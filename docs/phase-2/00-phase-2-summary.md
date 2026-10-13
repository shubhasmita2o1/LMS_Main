# Phase 2 — Authentication, Security, RBAC & Tenant Core

## Delivered

### Shared (`packages/shared`)
- `TokenPayload`, `AuthTokens`, `LoginInput`, `RegisterInput`, `LoginResponse`
- `LoginHistoryEntry`, expanded constants (`BCRYPT_ROUNDS`, lockout, `SYSTEM_ROLE_PERMISSIONS`)

### Backend models
- **User**: email, password (select:false), names, roles[], permissions[], tenantId (nullable), flags, loginHistory, refreshTokens (hashed), lockout fields, soft delete
- **Role**: name, permissions[], tenantId (nullable), isSystemRole, systemKey

### Auth module
- POST register / login / refresh / logout / logout-all
- GET me
- POST forgot-password / reset-password (dev token logged)
- bcrypt cost 12, JWT access 15m + refresh 7d (SHA-256 stored, rotated on refresh)
- Failed-attempt lockout (5 → 15 min)

### Middleware
- `authenticate` — Bearer access token → `req.user`
- `resolveTenant` — header / subdomain / super-admin override → `req.tenantId`
- `requirePermission(resource, action)` / `requireRoles(...)`
- `authRateLimit` / `loginRateLimit`

### Users API
- GET `/users`, GET `/users/:id` — tenant-scoped; super_admin can list across tenants or filter via `x-tenant-id`

### Frontend
- Zustand `authStore` (persisted)
- Axios client with Authorization + tenant header + 401 refresh queue
- Login / Register / Dashboard / Users pages
- `ProtectedRoute`, `Can`, `usePermission`

## Bootstrap behaviour
1. Empty DB → first register creates **super_admin** (`tenantId: null`), email auto-verified
2. Later registers create tenant users (generated ObjectId tenant until Phase 3 Tenant model)

## Security notes
- Never trust frontend for authorization
- Login errors are generic
- Refresh tokens revoked on logout / password reset
- Tenant isolation on all user queries
