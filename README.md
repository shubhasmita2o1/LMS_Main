# University LMS — SaaS Platform

**Multi-tenant Learning Management & Academic Platform**  
MERN Stack • Modular Monolith → Microservices • MongoDB Atlas

Document Version: Starter 0.1.0 • Aligned with Roadmap 2.0 (Phase 0 + Phase 1 complete)

---

## Current Status

| Phase | Status | Notes |
|-------|--------|-------|
| **Phase 0** — Product, Requirements & Architecture | ✅ Complete | See `docs/phase-0/` |
| **Phase 1** — Project Foundation & DevOps | ✅ Complete | This repository |
| Phase 2+ | 🔒 Not started | Awaiting review |

---

## Project Structure

```
university-lms/
├── apps/
│   ├── api/                 # Express + TypeScript modular monolith
│   │   └── src/
│   │       ├── config/      # env, database
│   │       ├── middleware/  # error, notFound, rateLimit
│   │       ├── modules/     # feature modules (health only for now)
│   │       ├── utils/       # logger
│   │       ├── app.ts
│   │       └── server.ts
│   └── web/                 # React + Vite + TypeScript + Tailwind
├── packages/
│   └── shared/              # Shared types, constants, pure utils
├── docker/
│   └── docker-compose.yml   # Local MongoDB + Redis
├── docs/
│   ├── architecture/        # Architecture blueprint
│   ├── phase-0/             # Product scope, module map, hierarchy, RBAC, NFRs
│   └── conventions/         # Engineering conventions
├── .github/workflows/       # CI (typecheck + build)
├── .env.example
├── package.json             # npm workspaces root
└── README.md
```

---

## Prerequisites

- Node.js ≥ 20
- npm ≥ 10
- Docker (optional, for local MongoDB + Redis)
- MongoDB (local via Docker or Atlas)

---

## Quick Start

### 1. Install dependencies

```bash
cd university-lms
npm install
```

### 2. Environment

```bash
cp .env.example .env
# Edit .env — at minimum set MONGODB_URI and strong JWT secrets
```

### 3. Start local infrastructure (recommended)

```bash
cd docker
docker compose up -d
cd ..
```

### 4. Build shared package

```bash
npm run build:shared
```

### 5. Run development servers

```bash
# Terminal 1 — API (port 4000)
npm run dev:api

# Terminal 2 — Web (port 5173)
npm run dev:web
```

- Frontend: http://localhost:5173  
- API Health: http://localhost:4000/health  
- API Base: http://localhost:4000/api/v1  

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:api` | Start API in watch mode |
| `npm run dev:web` | Start frontend Vite dev server |
| `npm run build` | Build shared + all workspaces |
| `npm run build:shared` | Build shared package only |
| `npm run typecheck` | Type-check all workspaces |
| `npm run format` | Format with Prettier |
| `npm run format:check` | Check formatting |

---

## Architecture Notes

- **Multi-tenancy**: Shared database + `tenantId` on every document + strict middleware (Phase 2).
- **Modular Monolith**: Feature-based modules under `apps/api/src/modules/`.
- **Shared package**: Types and constants live in `@university-lms/shared`.
- **Lab execution** (future): completely isolated from the main API process.
- **SaaS-first**: Super-Admin control plane, billing, feature flags, white-label planned from Phase 2–3.

See:

- `docs/architecture/01-architecture-blueprint.md`
- `docs/phase-0/` for product scope, module map, hierarchy, role matrix, NFRs
- `docs/conventions/01-engineering-conventions.md`

---

## Recommended Build Order (from Roadmap)

```
Foundation → Security + Tenant Core → SaaS Billing → University Structure
→ SIS → Faculty → Curriculum → Core LMS → Assessment & Gradebook
→ Practical Labs → Examination → Communication → University Operations
→ Finance → Analytics → AI → Integrations → Compliance → Microservices
```

**Important Rules**

1. Testing, security, DevOps, observability and data governance run continuously.
2. Practical/Lab execution must be isolated from the core API.
3. Multi-tenancy and billing must be production-ready before first external university is onboarded.
4. Aim for a sellable MVP after Phase 10–11 (≈ 4.5–5.5 months with a focused team).

---

## Phase 1 Deliverables Checklist

- [x] Git-ready monorepo (npm workspaces)
- [x] Backend Express + TypeScript + MongoDB + Redis foundation
- [x] Frontend React/Vite + TypeScript + Tailwind + design tokens
- [x] Environment configuration & secrets via Zod-validated env
- [x] Docker Compose for local MongoDB + Redis
- [x] CI pipeline (typecheck + build)
- [x] Logging (structured JSON logger skeleton)
- [x] Health checks
- [x] Rate-limit skeleton
- [x] Error handling + standard API response shape
- [x] Shared types for multi-tenancy, roles, permissions
- [x] Prettier + EditorConfig
- [x] Phase 0 documentation (scope, modules, hierarchy, RBAC, NFRs, architecture)
- [x] Engineering conventions documented

**Intentionally deferred to Phase 2+**

- User / Role / Permission models & auth
- Tenant resolution middleware
- Super-Admin & tenant onboarding
- Business modules (SIS, LMS, Assessment, etc.)
- OpenAPI full generation
- Full ESLint ruleset & unit tests
- BullMQ workers

---

Ready for review. Do not proceed beyond Phase 1 until approved.
