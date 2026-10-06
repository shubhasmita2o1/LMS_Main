/**
 * Auth Storage Helper
 * 
 * Manages JWT access and refresh token storage in browser storage.
 * Note on security:
 * In Phase 2, tokens are stored in browser Web Storage (localStorage or sessionStorage).
 * In future phases, refresh tokens should ideally be moved to Secure HttpOnly cookies
 * while access tokens reside in-memory to mitigate XSS exposure.
 */

const ACCESS_TOKEN_KEY = 'ul_access_token';
const REFRESH_TOKEN_KEY = 'ul_refresh_token';
const TENANT_ID_KEY = 'ul_tenant_id';
const REMEMBER_ME_KEY = 'ul_remember_me';

// Custom event to broadcast auth state changes (e.g. forced logout on refresh failure)
export const AUTH_UNAUTHORIZED_EVENT = 'ul:auth:unauthorized';


export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY) || sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  const isSessionOnly = sessionStorage.getItem(ACCESS_TOKEN_KEY) !== null;
  if (isSessionOnly) {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  }
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string): void {
  const isSessionOnly = sessionStorage.getItem(REFRESH_TOKEN_KEY) !== null;
  if (isSessionOnly) {
    sessionStorage.setItem(REFRESH_TOKEN_KEY, token);
  } else {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  }
}

export function setTokens(
  tokens: { accessToken: string; refreshToken: string },
  rememberMe = true
): void {
  // Clear any existing tokens from both storages first
  clearTokens();

  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  storage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  localStorage.setItem(REMEMBER_ME_KEY, String(rememberMe));
}

export function getStoredTenantId(): string | null {
  return localStorage.getItem(TENANT_ID_KEY) || sessionStorage.getItem(TENANT_ID_KEY);
}

export function setStoredTenantId(tenantId: string | null): void {
  if (tenantId) {
    localStorage.setItem(TENANT_ID_KEY, tenantId);
    sessionStorage.setItem(TENANT_ID_KEY, tenantId);
  } else {
    localStorage.removeItem(TENANT_ID_KEY);
    sessionStorage.removeItem(TENANT_ID_KEY);
  }
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(REMEMBER_ME_KEY);
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function hasTokens(): boolean {
  return Boolean(getAccessToken() || getRefreshToken());
}

export function dispatchUnauthorized(): void {
  clearTokens();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));
  }
}
