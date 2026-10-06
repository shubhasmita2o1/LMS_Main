/**
 * Shared constants
 */

export const APP_NAME = 'University LMS';
export const APP_VERSION = '0.2.0';

/** Default pagination */
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

/** JWT related */
export const ACCESS_TOKEN_EXPIRES_IN = '15m';
export const REFRESH_TOKEN_EXPIRES_IN = '7d';
/** Access token lifetime in seconds (for client) */
export const ACCESS_TOKEN_EXPIRES_SECONDS = 15 * 60;

/** Tenant resolution headers / strategies */
export const TENANT_HEADER = 'x-tenant-id';
export const TENANT_SUBDOMAIN_HEADER = 'x-tenant-subdomain';

/** Soft delete flag */
export const SOFT_DELETE_FIELD = 'isDeleted';

/** Bcrypt cost factor */
export const BCRYPT_ROUNDS = 12;

/** Max failed login attempts before temporary lock (Phase 2 basic) */
export const MAX_FAILED_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/** Default system role permission sets (seed reference) */
export const SYSTEM_ROLE_PERMISSIONS: Record<
  string,
  Array<{ resource: string; action: string }>
> = {
  super_admin: [{ resource: 'tenant', action: 'manage' }, { resource: 'user', action: 'manage' }],
  tenant_admin: [
    { resource: 'user', action: 'manage' },
    { resource: 'role', action: 'manage' },
    { resource: 'university', action: 'manage' },
    { resource: 'course', action: 'manage' },
    { resource: 'student', action: 'manage' },
    { resource: 'faculty', action: 'manage' },
  ],
  university_admin: [
    { resource: 'university', action: 'manage' },
    { resource: 'course', action: 'manage' },
    { resource: 'student', action: 'read' },
    { resource: 'faculty', action: 'read' },
  ],
  faculty: [
    { resource: 'course', action: 'read' },
    { resource: 'assignment', action: 'manage' },
    { resource: 'quiz', action: 'manage' },
    { resource: 'grade', action: 'manage' },
    { resource: 'attendance', action: 'manage' },
    { resource: 'student', action: 'read' },
  ],
  student: [
    { resource: 'course', action: 'read' },
    { resource: 'assignment', action: 'read' },
    { resource: 'quiz', action: 'read' },
    { resource: 'grade', action: 'read' },
    { resource: 'attendance', action: 'read' },
  ],
  staff: [{ resource: 'user', action: 'read' }],
  parent: [{ resource: 'student', action: 'read' }],
  guest: [],
};
