import { useCallback } from 'react';
import { isAxiosError } from 'axios';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import type { AuthContextValue, RegisterInput, ApiResponse, LoginResponse, AuthUser } from '../types/auth';

function getErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as
      | { error?: { message?: string }; message?: string }
      | undefined;
    if (data?.error?.message) return data.error.message;
    if (typeof data?.message === 'string' && data.message) return data.message;
    if (err.message) return err.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export type RegisterResult = {
  email: string;
  message: string;
};

export function useAuth(): AuthContextValue & {
  registerAccount: (input: RegisterInput & { organizationName?: string }) => Promise<RegisterResult>;
} {
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const storeIsAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isAuthenticated = storeIsAuthenticated();

  const login = useCallback(
    async (email: string, password: string, tenantId?: string, _rememberMe?: boolean) => {
      try {
        const payload: Record<string, string> = { email, password };
        if (tenantId?.trim()) payload.tenantId = tenantId.trim();
        const { data } = await api.post<ApiResponse<LoginResponse>>('/auth/login', payload);
        if (!data.success || !data.data) {
          throw new Error(data.message || 'Login failed');
        }
        setAuth(data.data.user, data.data.tokens);
      } catch (err) {
        throw new Error(getErrorMessage(err, 'Login failed'));
      }
    },
    [setAuth]
  );

  const registerAccount = useCallback(
    async (input: RegisterInput & { organizationName?: string }) => {
      try {
        const payload = {
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          password: input.password,
          organizationName: input.organizationName,
        };
        const { data } = await api.post<ApiResponse<{ email: string; message: string }>>(
          '/auth/register',
          payload
        );
        if (!data.success) {
          throw new Error(data.message || 'Registration failed');
        }
        return {
          email: data.data?.email || input.email,
          message:
            data.data?.message ||
            data.message ||
            'Registration successful. Please verify your email.',
        };
      } catch (err) {
        throw new Error(getErrorMessage(err, 'Registration failed'));
      }
    },
    []
  );

  const register = useCallback(
    async (input: RegisterInput, _rememberMe?: boolean) => {
      await registerAccount(input);
    },
    [registerAccount]
  );

  const logout = useCallback(async () => {
    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch {
      /* best-effort */
    } finally {
      clearAuth();
    }
  }, [refreshToken, clearAuth]);

  const logoutAll = useCallback(async () => {
    try {
      await api.post('/auth/logout-all');
    } catch {
      /* best-effort */
    } finally {
      clearAuth();
    }
  }, [clearAuth]);

  const refreshUser = useCallback(async () => {
    const { data } = await api.get<ApiResponse<AuthUser>>('/auth/me');
    if (data?.data) {
      useAuthStore.setState({ user: data.data });
    }
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading: false,
    login,
    register,
    registerAccount,
    logout,
    logoutAll,
    refreshUser,
  };
}

export default useAuth;
