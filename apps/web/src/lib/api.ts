/**
 * Axios API client instance with authentication and automatic token refresh interceptor.
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  dispatchUnauthorized,
  getStoredTenantId,
} from './authStorage';
import type { ApiResponse, AuthTokens } from '@university-lms/shared';

// Create base instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Mutex / Queue state for concurrent 401 refresh requests
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
}

// REQUEST INTERCEPTOR: Attach access token and tenant header
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = getAccessToken();
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    const tenantId = getStoredTenantId();
    if (tenantId && config.headers && !config.headers['x-tenant-id']) {
      config.headers['x-tenant-id'] = tenantId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR: Handle 401 and refresh token rotation
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url || '';
    const isAuthEndpoint =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/refresh');

    // Only attempt refresh on 401 if it wasn't already retried and isn't an auth endpoint
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        // No refresh token available; session cannot be recovered
        clearTokens();
        dispatchUnauthorized();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Refresh already in progress; queue this request
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newAccessToken) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call refresh endpoint directly using a clean axios call (bypass interceptor queue)
        const refreshResponse = await axios.post<ApiResponse<{ tokens: AuthTokens }>>(
          `${import.meta.env.VITE_API_URL || '/api/v1'}/auth/refresh`,
          { refreshToken },
          {
            headers: { 'Content-Type': 'application/json' },
            withCredentials: true,
          }
        );

        const newTokens = refreshResponse.data?.data?.tokens;
        if (!newTokens?.accessToken) {
          throw new Error('No access token returned in refresh response');
        }

        // Store new rotated tokens
        setTokens(newTokens);

        // Process queued requests
        processQueue(null, newTokens.accessToken);

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
        }

        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed (token expired or invalidated)
        processQueue(refreshError, null);
        clearTokens();
        dispatchUnauthorized();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
