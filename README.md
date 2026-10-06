# University LMS — SaaS Platform

**Multi-tenant Learning Management & Academic Platform**  
MERN Stack • Modular Monolith → Microservices • MongoDB Atlas

---

## Project Structure

```
university-lms/
├── apps/
│   ├── api/          # Express + TypeScript modular monolith
│   └── web/          # React + Vite + TypeScript + Tailwind
├── packages/
│   └── shared/       # Shared types, constants, utils
├── docker/
│   └── docker-compose.yml   # Local MongoDB + Redis
├── .env.example
├── package.json      # npm workspaces root
└── README.md
```

## Prerequisites

- Node.js ≥ 20
- npm ≥ 10
- MongoDB (local or Atlas)
- Redis (optional for Phase 1, required later)

## Quick Start

### 1. Install dependencies

```bash
cd university-lms
npm install
```

### 2. Environment

```bash
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secrets
```

### 3. Start local infrastructure (optional)

```bash
cd docker
docker compose up -d
```

### 4. Run development servers

```bash
# Terminal 1 — API (port 4000)
npm run dev:api

# Terminal 2 — Web (port 5173)
npm run dev:web
```

- Frontend: http://localhost:5173  
- API Health: http://localhost:4000/health  
- API Base: http://localhost:4000/api/v1  

## Development Roadmap Alignment

This starter corresponds to **Phase 1 — Project Foundation & DevOps**.

Next recommended steps (Phase 2):

1. User / Role / Permission models
2. Authentication (JWT + refresh tokens)
3. Tenant resolution middleware
4. RBAC middleware
5. Super-Admin & Tenant onboarding foundations

See the full *University LMS SaaS Master Roadmap* for the complete phased plan.

## Scripts

| Command            | Description                      |
|--------------------|----------------------------------|
| `npm run dev:api`  | Start API in watch mode          |
| `npm run dev:web`  | Start frontend Vite dev server   |
| `npm run build`    | Build all workspaces             |
| `npm run typecheck`| Type-check all workspaces        |

## Architecture Notes

- **Multi-tenancy**: Shared database + `tenantId` on every document + strict middleware.
- **Modular Monolith**: Feature-based modules under `apps/api/src/modules/`.
- **Shared package**: Types and constants live in `@university-lms/shared`.
- Lab execution (future) will be completely isolated from the main API process.

---

Document Version: Starter 0.1.0 • Aligned with Roadmap 2.0
