# Phase 3 — Platform, Tenant Management & SaaS Billing Foundation

**Status:** Complete  
**Version:** 0.3.0

## What was delivered

### Shared package
- `TenantStatus`, `PlanTier` / `PlanId`, `TenantLimits`, `UsageMetric`, `SubscriptionInfo`, `TenantPublic`, `PlanPublic`, `PlatformStats`
- Expanded `ResourceType` with `feature_flag` | `plan`
- Expanded `TenantBranding`
- Default plan limits, feature flags, and seed plan catalog constants

### Backend models
- **Tenant** — name, slug, status, branding, plan, limits, featureFlags, billing IDs, customDomain, ownerId, soft-delete
- **Plan** — catalog with price, limits, featureFlags; idempotent `seedPlans()`
- **UsageRecord** — per-tenant metric metering skeleton
- **WebhookEvent** — provider + eventId unique for idempotent webhooks

### Super Admin control plane (`/api/v1/admin`)
- List / create / get / update tenants
- Suspend / activate
- Platform stats (tenants, users, MRR skeleton)

### Tenant self-service (`/api/v1/tenants`)
- `POST /onboard` — self-service tenant + owner
- `GET|PATCH /me` — settings & branding
- `GET /me/usage` — usage vs limits

### Feature flags & limits
- `requireFeature(flagKey)` middleware
- `requireLimit(metric)` middleware
- `checkLimit` / `getUsageSnapshot` helpers
- Enforced on backend; readable on frontend via `/tenants/me`

### Billing foundation
- `POST /api/v1/billing/checkout` — checkout session (immediate apply when no Stripe keys / free plan)
- `POST /api/v1/billing/portal` — customer portal link skeleton
- `GET /api/v1/billing/plans` — public plan catalog
- `POST /api/v1/webhooks/stripe` & `/razorpay` — signature-aware, idempotent processing
- Events: checkout completed, invoice paid, subscription updated/deleted (Stripe); subscription activated/charged/cancelled (Razorpay)

### Custom domain readiness
- `customDomain` field + unique sparse index
- `resolveTenant` middleware resolves by custom domain host and subdomain slug

### Frontend
- Super Admin: tenant list, create, detail, stats cards (`/admin/tenants`)
- Tenant Settings (`/settings`) — branding, usage bars, feature flags, portal CTA
- Billing page (`/billing`) — plan cards + checkout
- `useFeatureFlag` / `useCurrentTenant` / `useTenantUsage`
- `<Feature flag="…">` component

## Acceptance checklist

### Backend
- [x] Tenant model complete
- [x] Super Admin CRUD + suspend/activate
- [x] Tenant Admin me + settings
- [x] Feature flags system
- [x] Plan limit checks
- [x] Stripe + Razorpay webhooks (idempotent)
- [x] Usage metering skeleton
- [x] Custom domain field + resolution
- [x] RBAC on all routes
- [x] Tenant isolation preserved

### Frontend
- [x] Super Admin dashboard
- [x] Create Tenant flow
- [x] Tenant Settings
- [x] Usage display
- [x] Feature flag hook + component
- [x] Billing CTA / portal

## Next (Phase 4+)
- Real Stripe/Razorpay SDK integration with live price IDs
- DNS verification for custom domains
- Audit log for plan/status changes
- Logo upload to object storage
- Enforce `requireLimit` on student/faculty create routes when those modules land
