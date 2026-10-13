# University LMS — SaaS Platform

**Multi-tenant Learning Management & Academic Platform**  
MERN Stack • Modular Monolith → Microservices • MongoDB Atlas

Document Version: 0.3.0 • Aligned with Roadmap 2.0 (**Phase 0–3**)

---

## Current Status

| Phase | Status | Notes |
|-------|--------|-------|
| **Phase 0** — Product, Requirements & Architecture | ✅ Complete | See `docs/phase-0/` |
| **Phase 1** — Project Foundation & DevOps | ✅ Complete | Monorepo, Docker, CI skeleton |
| **Phase 2** — Authentication, Security, RBAC & Tenant Core | ✅ Complete | Auth, JWT, RBAC |
| **Phase 3** — Platform, Tenant Management & Billing | ✅ Complete | This release |
| Phase 4+ | 🔒 Not started | University hierarchy, courses, etc. |

---


## Phase 3 Highlights

- **Tenant model** with branding, plan tier, limits, feature flags, billing customer/subscription IDs, custom domain
- **Plan catalog** seeded (Free / Starter / Professional / Enterprise)
- **Super Admin APIs**: list/create/update/suspend/activate tenants + platform stats
- **Tenant APIs**: onboard, me, usage
- **Feature flags & plan limits** enforceable via middleware helpers
- **Billing skeleton**: checkout, portal, Stripe + Razorpay webhooks (idempotent)
- **Frontend**: Admin tenant management, Tenant Settings, Billing plans, `useFeatureFlag` + `<Feature>`

See `docs/phase-3/00-phase3-summary.md` for full details.

---
## Phase 2 Highlights

- **User model** with `tenantId` (null for Super Admin), refresh tokens, login history, lockout
- **Role model** (system + tenant-scoped) ready for Phase 3 seeds
- **Auth API**: register, login, refresh, logout, logout-all, me, forgot/reset password
- **JWT**: short-lived access (15m) + long-lived refresh (7d, hashed in DB, rotatable)
- **Middlewares**: `authenticate`, `resolveTenant`, `requirePermission` / `requireRoles`
- **Tenant isolation**: enforced on user queries; Super Admin operates with `tenantId = null`
- **Rate limiting** on auth endpoints
- **Frontend**: Login / Register / Dashboard / Users, Zustand auth store, Axios interceptors with auto-refresh, `ProtectedRoute`, `Can` component

---

## Project Structure (Phase 2)

```
university-lms/
├── apps/
│   ├── api/
│   │   └── src/
│   │       ├── config/
│   │       ├── middleware/     # auth, tenant, rbac, rateLimit, error, notFound
│   │       ├── modules/
│   │       │   ├── auth/       # routes, controller, service, validation
│   │       │   ├── users/      # model, routes, controller
│   │       │   ├── roles/      # model
│   │       │   └── health/
│   │       ├── types/          # express.d.ts
│   │       ├── utils/          # jwt, password, logger
│   │       ├── app.ts
│   │       └── server.ts
│   └── web/
│       └── src/
│           ├── components/auth/  # Can, ProtectedRoute
│           ├── features/
│           ├── hooks/            # usePermission
│           ├── lib/              # api (interceptors), queryClient
│           ├── pages/            # Login, Register, Dashboard, Users
│           ├── stores/           # authStore (Zustand + persist)
│           └── App.tsx
├── packages/shared/              # types, constants, utils
├── docker/
├── docs/
└── ...
```

---

## Quick Start

### 1. Install

```bash
cd university-lms
npm install
```

### 2. Environment

```bash
cp .env.example .env
# Set MONGODB_URI and strong JWT secrets (≥32 chars each)
```

### 3. Infrastructure

```bash
cd docker && docker compose up -d && cd ..
```

### 4. Build shared + run

```bash
npm run build:shared

# Terminal 1
npm run dev:api

# Terminal 2
npm run dev:web
```

- Frontend: http://localhost:5173  
- API: http://localhost:4000  
- Health: http://localhost:4000/health  

### 5. First user (Super Admin)

1. Open http://localhost:5173/register  
2. Register any email/password — **first user becomes `super_admin`** with `tenantId = null`  
3. Subsequent registrations create tenant-scoped users (default role `tenant_admin` gets a generated tenant ObjectId until Phase 3 Tenant model exists)

---

## Auth API

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/register` | Public (controlled) | Register; first user → super_admin |
| POST | `/api/v1/auth/login` | Public | Login → access + refresh tokens |
| POST | `/api/v1/auth/refresh` | Refresh token | Rotate tokens |
| POST | `/api/v1/auth/logout` | Bearer | Revoke one refresh token |
| POST | `/api/v1/auth/logout-all` | Bearer | Revoke all sessions |
| GET | `/api/v1/auth/me` | Bearer | Current user |
| POST | `/api/v1/auth/forgot-password` | Public | Request reset (token logged in dev) |
| POST | `/api/v1/auth/reset-password` | Public | Reset with token |
| GET | `/api/v1/users` | Bearer + `user:read` | List users (tenant-scoped) |
| GET | `/api/v1/users/:id` | Bearer + `user:read` | Get user |

### Example login

```bash
curl -s -X POST http://localhost:4000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"Password1"}' | jq
```

### Tenant header

Authenticated tenant users automatically send `x-tenant-id`. Super Admin may pass `x-tenant-id` to scope queries.

---

## Security checklist (Phase 2)

- [x] Passwords hashed with bcrypt (cost 12)
- [x] Access token 15m; refresh 7d stored hashed in DB, revocable
- [x] Tenant isolation on user list/get
- [x] Super Admin `tenantId = null`
- [x] Minimal JWT payload (`sub`, `tenantId`, `roles`, `type`)
- [x] Rate limits on auth routes
- [x] Generic login errors (no email enumeration)
- [x] CORS + Helmet
- [x] Login history + basic account lockout after failed attempts
- [x] Password reset architecture (email mock in dev)

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:api` | API watch mode (port 4000) |
| `npm run dev:web` | Vite dev server (port 5173) |
| `npm run build:shared` | Compile shared package |
| `npm run typecheck` | Type-check all workspaces |
| `npm run build` | Build all |

---

## Next: Phase 3

Super-Admin control plane, Tenant onboarding, branding, feature flags, Stripe/Razorpay subscription foundation, custom domain architecture.
