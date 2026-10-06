/**
 * Shared constants
 */

export const APP_NAME = 'University LMS';
export const APP_VERSION = '0.1.0';

/** Default pagination */
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

/** JWT related */
export const ACCESS_TOKEN_EXPIRES_IN = '15m';
export const REFRESH_TOKEN_EXPIRES_IN = '7d';

/** Tenant resolution headers / strategies */
export const TENANT_HEADER = 'x-tenant-id';
export const TENANT_SUBDOMAIN_HEADER = 'x-tenant-subdomain';

/** Soft delete flag */
export const SOFT_DELETE_FIELD = 'isDeleted';
