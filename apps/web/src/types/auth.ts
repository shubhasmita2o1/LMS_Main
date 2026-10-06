import type {
  AuthUser,
  SystemRole,
  ResourceType,
  PermissionAction,
  Permission,
  LoginInput,
  RegisterInput,
  LoginResponse,
  AuthTokens,
  ApiResponse,
  TenantId,
  UserId,
} from '@university-lms/shared';

export type {
  AuthUser,
  SystemRole,
  ResourceType,
  PermissionAction,
  Permission,
  LoginInput,
  RegisterInput,
  LoginResponse,
  AuthTokens,
  ApiResponse,
  TenantId,
  UserId,
};

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextValue extends AuthState {
  login: (email: string, password: string, tenantId?: string, rememberMe?: boolean) => Promise<void>;
  register: (data: RegisterInput, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export interface ApiErrorResponse {
  code: string;
  message: string;
  details?: Record<string, string[] | string>;
}
