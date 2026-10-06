import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { api } from '../lib/api';
import {
  getRefreshToken,
  hasTokens,
  setTokens,
  clearTokens,
  setStoredTenantId,
  AUTH_UNAUTHORIZED_EVENT,
} from '../lib/authStorage';
import type {
  AuthUser,
  AuthContextValue,
  RegisterInput,
  LoginResponse,
  ApiResponse,
} from '../types/auth';
import type { AxiosError } from 'axios';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Helper to extract clean error message from backend response
  const formatApiError = (err: unknown): Error => {
    const axiosError = err as AxiosError<ApiResponse>;
    if (axiosError.response?.data?.error?.message) {
      return new Error(axiosError.response.data.error.message);
    }
    if (axiosError.message) {
      return new Error(axiosError.message);
    }
    return new Error('An unexpected error occurred. Please try again.');
  };

  // Fetch current user details via /auth/me
  const refreshUser = useCallback(async () => {
    try {
      const response = await api.get<ApiResponse<AuthUser>>('/auth/me');
      if (response.data?.data) {
        setUser(response.data.data);
        if (response.data.data.tenantId) {
          setStoredTenantId(response.data.data.tenantId);
        }
      }
    } catch (error) {
      setUser(null);
      clearTokens();
      throw formatApiError(error);
    }
  }, []);

  // Restore session on initial load
  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      if (hasTokens()) {
        try {
          const response = await api.get<ApiResponse<AuthUser>>('/auth/me');
          if (isMounted && response.data?.data) {
            setUser(response.data.data);
            if (response.data.data.tenantId) {
              setStoredTenantId(response.data.data.tenantId);
            }
          }
        } catch {
          if (isMounted) {
            setUser(null);
            clearTokens();
          }
        }
      }

      if (isMounted) {
        setIsLoading(false);
      }
    }

    initializeAuth();

    // Listen for global unauthorized event dispatched by Axios interceptor
    const handleUnauthorized = () => {
      setUser(null);
      setIsLoading(false);
    };

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);

    return () => {
      isMounted = false;
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized);
    };
  }, []);

  // Login handler
  const login = useCallback(
    async (email: string, password: string, tenantId?: string, rememberMe = true) => {
      setIsLoading(true);
      try {
        const payload: { email: string; password: string; tenantId?: string } = {
          email: email.trim().toLowerCase(),
          password,
        };
        if (tenantId && tenantId.trim()) {
          payload.tenantId = tenantId.trim();
        }

        const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', payload);

        if (!response.data?.data) {
          throw new Error('Invalid login response from server');
        }

        const { user: loggedInUser, tokens } = response.data.data;

        // Store tokens & tenant
        setTokens(tokens, rememberMe);
        if (loggedInUser.tenantId) {
          setStoredTenantId(loggedInUser.tenantId);
        }

        setUser(loggedInUser);
      } catch (error) {
        setUser(null);
        clearTokens();
        throw formatApiError(error);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Register handler
  const register = useCallback(
    async (data: RegisterInput, rememberMe = true) => {
      setIsLoading(true);
      try {
        const response = await api.post<ApiResponse<LoginResponse>>('/auth/register', data);

        if (!response.data?.data) {
          throw new Error('Invalid registration response from server');
        }

        const { user: registeredUser, tokens } = response.data.data;

        // Auto login on successful registration
        setTokens(tokens, rememberMe);
        if (registeredUser.tenantId) {
          setStoredTenantId(registeredUser.tenantId);
        }

        setUser(registeredUser);
      } catch (error) {
        setUser(null);
        clearTokens();
        throw formatApiError(error);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Logout handler
  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (err) {
      // Best-effort logout - continue clearing local state even on network error
      console.warn('Logout API call failed:', err);
    } finally {
      clearTokens();
      setStoredTenantId(null);
      setUser(null);
    }
  }, []);

  // Logout all devices handler (Bonus)
  const logoutAll = useCallback(async () => {
    try {
      await api.post('/auth/logout-all');
    } catch (err) {
      console.warn('Logout-all API call failed:', err);
    } finally {
      clearTokens();
      setStoredTenantId(null);
      setUser(null);
    }
  }, []);

  const value: AuthContextValue = {
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    register,
    logout,
    logoutAll,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
