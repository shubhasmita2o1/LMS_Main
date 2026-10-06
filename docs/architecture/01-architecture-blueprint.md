# Architecture Blueprint — SaaS Multi-Tenant

## High-Level Flow

```
[Students / Faculty / University Admins]
        │
        ▼
[CDN + WAF + Custom Domain routing]
        │
        ▼
[Frontend — React + Vite (or Next.js) + TypeScript]
        │
        ▼
[API Gateway / Express Modular Monolith]
        │
        ├── Auth
        ├── Tenant / Platform
        ├── Users
        ├── Academic
        ├── LMS
        ├── Assessment
        ├── Finance / Billing
        ├── Labs (isolated workers)
        ├── Notifications
        └── ...
        │
        ▼
[MongoDB Atlas | Redis | Object Storage | BullMQ Workers]
        │
        ▼
[Stripe / Razorpay | Email | Zoom/Meet | SSO | External SIS]
```

## Multi-Tenancy Strategy (Recommended & Implemented Direction)

**Shared database + `tenantId` on every document + strict middleware.**

- One MongoDB cluster (or database) shared across tenants.
- Every tenant-scoped collection document carries `tenantId`.
- Middleware resolves tenant from:
  1. Custom domain
  2. Subdomain (`tenant.platform.com`)
  3. Explicit header (`x-tenant-id`) for development / Super-Admin tools
- All queries are automatically constrained by the resolved `tenantId`.
- Super-Admin operates **outside** tenant scope.
- Compound indexes: `{ tenantId: 1, ...key fields }` on every collection.
- Soft deletion + audit fields (`createdBy`, `updatedBy`, `isDeleted`, `deletedAt`).

This approach balances operational simplicity for early SaaS with clear extraction paths to database-per-tenant later if required.

## Modular Monolith Rules

1. Feature-based modules under `apps/api/src/modules/<domain>/`.
2. Strict domain boundaries — no cross-module direct DB access; prefer services / events.
3. Shared kernel lives in `@university-lms/shared` (types, constants, pure utils).
4. Modules can later become independent microservices without a rewrite.
5. Lab / Practical execution **must never** run inside the main API process. Isolated workers / containers only.

## Technology Stack (Locked for Foundation)

| Layer | Choice |
|-------|--------|
| Frontend | React + Vite + TypeScript + Tailwind CSS |
| Backend | Node.js LTS + Express modular monolith + TypeScript |
| Database | MongoDB Atlas (Mongoose) |
| Cache / Queues | Redis + BullMQ (later phases) |
| Object Storage | Cloudflare R2 / AWS S3 / MinIO |
| Auth | Custom JWT + refresh tokens; SSO readiness (SAML/OIDC) |
| Payments | Stripe Billing + Razorpay |
| Validation | Zod (shared between FE/BE where possible) |
| Realtime | Socket.io (later) |

## Future Distributed Layer

Kafka or RabbitMQ, API Gateway, Docker, Kubernetes, OpenTelemetry, Prometheus, Grafana — introduced only after the modular monolith is stable and high-value independent services are identified (Notification, File/Media, Practical Execution, Analytics, Billing, Authentication).
