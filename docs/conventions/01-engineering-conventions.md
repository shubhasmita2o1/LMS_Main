# Engineering Conventions

## Repository Structure

```
university-lms/
├── apps/
│   ├── api/                 # Express + TypeScript modular monolith
│   └── web/                 # React + Vite + TypeScript + Tailwind
├── packages/
│   └── shared/              # Shared types, constants, pure utils
├── docker/                  # Local infrastructure (MongoDB, Redis)
├── docs/                    # Architecture, Phase-0, conventions
├── .github/workflows/       # CI
├── .env.example
├── package.json             # npm workspaces root
└── README.md
```

## Branching

- `main` — production-ready
- `develop` — integration branch (optional early on)
- `feature/<ticket>-short-description`
- `fix/<ticket>-short-description`
- `chore/...`, `docs/...`

Prefer short-lived feature branches and PR reviews.

## Commit Messages

Follow Conventional Commits:

```
feat(api): add tenant resolution middleware
fix(web): correct health check link
docs: add Phase 0 role matrix
chore: add ESLint and Prettier
test(api): add health route unit test
```

## TypeScript

- Strict mode enabled everywhere.
- Shared types live in `@university-lms/shared`.
- Prefer interfaces for object shapes; types for unions/aliases.
- No `any` without explicit justification and comment.

## API Conventions

- Base path: `/api/v1`
- Health: `/health` (unversioned, no auth)
- Response envelope:

```json
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "limit": 20, "total": 100 }
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": { ... }
  }
}
```

- Pagination defaults: page=1, limit=20, max=100.
- All tenant-scoped routes require resolved tenant context.

## Module Layout (API)

```
modules/<domain>/
  ├── <domain>.routes.ts
  ├── <domain>.controller.ts
  ├── <domain>.service.ts
  ├── <domain>.model.ts          # Mongoose schema
  ├── <domain>.schema.ts         # Zod validation
  └── <domain>.types.ts          # local types if needed
```

## Frontend Conventions

- Path alias `@/` → `src/`
- Feature folders under `src/features/` (later)
- Shared UI under `src/components/`
- API client & query hooks under `src/lib/` and `src/hooks/`
- Forms: React Hook Form + Zod
- Server state: TanStack Query
- Client state: Zustand (sparingly)

## Security Rules

- Never commit `.env` or real secrets.
- Validate all input with Zod.
- Enforce `tenantId` on every data access.
- Rate-limit public and auth endpoints.
- Lab code execution isolated from the API process.
