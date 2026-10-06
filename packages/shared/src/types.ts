/**
 * Core shared types for multi-tenant University LMS
 */

export type TenantId = string;
export type UserId = string;
export type ObjectId = string;

/** Base document fields present on every MongoDB document */
export interface BaseDocument {
  _id: ObjectId;
  tenantId: TenantId;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: UserId;
  updatedBy?: UserId;
  isDeleted?: boolean;
  deletedAt?: Date | null;
}

/** User roles (expandable via RBAC) */
export type SystemRole =
  | 'super_admin'
  | 'tenant_admin'
  | 'university_admin'
  | 'faculty'
  | 'student'
  | 'staff'
  | 'parent'
  | 'guest';

/** Permission action */
export type PermissionAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'manage'
  | 'export'
  | 'import';

/** Resource types for fine-grained RBAC */
export type ResourceType =
  | 'tenant'
  | 'user'
  | 'role'
  | 'university'
  | 'campus'
  | 'school'
  | 'department'
  | 'program'
  | 'batch'
  | 'section'
  | 'course'
  | 'student'
  | 'faculty'
  | 'assignment'
  | 'quiz'
  | 'exam'
  | 'grade'
  | 'attendance'
  | 'fee'
  | 'billing'
  | 'notification'
  | 'analytics'
  | 'lab'
  | 'library'
  | 'placement';

export interface Permission {
  resource: ResourceType;
  action: PermissionAction;
  /** Optional scope, e.g. own department only */
  scope?: string;
}

export interface AuthUser {
  id: UserId;
  tenantId: TenantId | null; // null for super_admin
  email: string;
  roles: SystemRole[];
  permissions: Permission[];
  firstName?: string;
  lastName?: string;
}

/** JWT access token payload — keep minimal (no sensitive data) */
export interface TokenPayload {
  sub: UserId;
  tenantId: TenantId | null;
  roles: SystemRole[];
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

export interface LoginInput {
  email: string;
  password: string;
  tenantId?: string; // optional: required for tenant users when not resolved from host
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  /** Controlled: only super_admin or tenant_admin bootstrap */
  role?: SystemRole;
  tenantId?: string | null;
}

export interface LoginResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface TenantBranding {
  name: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  faviconUrl?: string;
  customDomain?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message?: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

/** Login history entry (stored on User) */
export interface LoginHistoryEntry {
  at: Date;
  ip?: string;
  userAgent?: string;
  success: boolean;
}
