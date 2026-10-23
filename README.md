# University LMS — SaaS Platform

**Multi-tenant Learning Management & Academic Platform**  
MERN + TypeScript • Modular monolith • MongoDB Atlas • Redis-ready

**Document version:** 0.11.0 · **Roadmap:** University LMS SaaS Master Roadmap v2.0  
**Repository:** [shubhasmita2o1/LMS_Main](https://github.com/shubhasmita2o1/LMS_Main)

---

## Current status

| Phase | Scope | Status |
|------:|-------|--------|
| **0** | Product, requirements & architecture | ✅ Complete |
| **1** | Project foundation & DevOps | ✅ Complete |
| **2** | Auth, security, RBAC & tenant core | ✅ Complete |
| **3** | Platform, tenant management & billing | ✅ Complete |
| **4** | Academic hierarchy | ✅ Complete |
| **5** | Student Information System (SIS) | ✅ Complete |
| **6** | Faculty management | ✅ Complete |
| **7** | Courses, curriculum & enrollments | ✅ Complete |
| **8** | Core LMS (lessons, progress, live classes) | ✅ Complete |
| **9** | Assignments, quiz & question bank | ✅ Complete |
| **10** | Gradebook, results & basic attendance | ✅ Complete |
| **11** | Practical & Lab Platform (isolated execution) | ✅ Complete |
| **12+** | Examinations, analytics, sellable MVP polish | Planned |

**Sellable MVP target:** after Phase 10–11 (per roadmap). **Lab execution stays isolated from the main API** (`ExecutionAdapter` + mock/Docker worker).

### Phase 11 — Lab execution

- Default: `LAB_EXECUTOR=mock` (deterministic fake results; **no student code runs**).
- Production: separate `apps/lab-worker` + Docker isolation (`network=none`, cgroup limits, non-root). See `docs/phase-11/README.md` and `apps/lab-worker/README.md`.
- API: `/api/v1/labs` — practicals → labs → experiments → submissions / executions.

---

## Stack

| Layer | Choice |
|-------|--------|
| API | Express + TypeScript, Zod validation |
| Web | React + Vite + Tailwind, React Query, Zustand |
| Shared | `@university-lms/shared` types, constants, utils |
| DB | MongoDB (Atlas-ready), multi-tenant via `tenantId` on every document |
| Cache / queues | Redis (optional in early phases) |
| Billing | Stripe + Razorpay skeletons |
| Storage | Local disk abstraction (S3-ready) for lesson/assignment files |
| Auth | JWT access + refresh, RBAC permissions per role |

**Multi-tenancy:** shared database + `tenantId` isolation on all queries. Super Admin operates with `tenantId = null`.

---

## Monorepo layout

```
university-lms/
├── apps/
│   ├── api/                 # Express API (@university-lms/api)
│   │   └── src/
│   │       ├── config/
│   │       ├── middleware/  # auth, tenant, rbac, rateLimit, errors
│   │       ├── modules/     # feature modules (see below)
│   │       ├── services/    # storage, feature flags, …
│   │       └── scripts/     # seed helpers
│   └── web/                 # React SPA (@university-lms/web)
│       └── src/
│           ├── pages/       # feature screens
│           ├── components/
│           ├── hooks/
│           ├── lib/         # API client
│           └── stores/      # auth store
├── packages/
│   └── shared/              # shared types, constants, utils
├── docs/
│   ├── phase-0/ … phase-9/
│   ├── architecture/
│   └── conventions/
├── docker/
├── .github/workflows/       # CI: install, build shared, typecheck, build api/web
└── package.json             # npm workspaces root
```

### API modules (`apps/api/src/modules`)

| Module | Base path | Notes |
|--------|-----------|--------|
| `auth` | `/api/v1/auth` | Login, register, refresh, logout, me |
| `users` | `/api/v1/users` | User admin |
| `tenants` / `admin` / `billing` / `plans` | `/api/v1/…` | Tenant, super-admin, billing |
| `academic` | `/api/v1/academic` | University → section hierarchy |
| `students` | `/api/v1/students` | SIS |
| `faculty` | `/api/v1/faculty` | Faculty profiles & assignments |
| `courses` | `/api/v1/courses` | Catalog, structure, offerings, enrollments |
| `learn` | `/api/v1/learn` | Outline, progress, notes, live classes, content upload |
| `question-bank` | `/api/v1/question-bank` | Subjects / units / topics / questions |
| `assignments` | `/api/v1/assignments` | Assignments & submissions |
| `quizzes` | `/api/v1/quizzes` | Quizzes & attempts (auto-grade objective) |

---

## Phase highlights (summary)

### Phases 0–3 — Foundation & platform
- Product/architecture docs, monorepo, Docker, CI skeleton
- JWT auth, RBAC, tenant resolution, rate limits
- Tenant CRUD, plans, feature flags, Stripe/Razorpay webhook + checkout/portal skeletons

### Phases 4–6 — Academic & people
- University → campus → school → department → program → batch → section
- Academic year / semester / config
- Student SIS (CRUD, documents, bulk, enrollment status)
- Faculty profiles, department assign, teaching assignments

### Phases 7–8 — Courses & learning
- Course catalog, modules/lessons, offerings, curriculum mapping, enrollments
- Learning progress, notes, bookmarks, live classes
- Storage abstraction for content files

### Phase 9 — Assessments (current)
- **Question bank:** subject → unit → topic → question (MCQ, multi-select, T/F, fill, short/long, numerical, matching)
- **Assignments:** due/late policy, resubmit, rubric, attachments; student submit; faculty grade
- **Quizzes:** bank attach, duration, shuffle, max attempts; timed attempt; **server-side** auto-grade for objective items; manual grade for subjective
- Frontend: Q-Bank, Assignments, Quizzes (builder / take / attempts)
- Marks fields ready for **Phase 10 Gradebook**

See `docs/phase-9/README.md` for API surface details.

---

## Getting started

### Phase 10 — Gradebook, Results & Attendance

- **Gradebook** with weighted components (assignment / quiz / attendance / manual)
- Server-side **recompute** pulling marks from Phase 9 submissions & quiz attempts
- Lock / unlock / **publish results** with immutable snapshots
- Student **my-grades** + basic **transcript**
- **Attendance sessions** (manual, QR-ready), bulk mark, summary, shortage report
- APIs: `/api/v1/gradebook`, `/api/v1/attendance`
- Frontend: gradebook setup + roster, attendance mark UI, student views


### Prerequisites

- Node.js **≥ 20**
- MongoDB (local or Atlas)
- Optional: Redis, Docker

### Install

```bash
git clone https://github.com/shubhasmita2o1/LMS_Main.git
cd LMS_Main
cp .env.example .env   # set MONGODB_URI, JWT secrets
npm install
npm run build:shared
```

### Run (development)

```bash
# Terminal 1 — API (default http://localhost:4000)
npm run dev:api

# Terminal 2 — Web (default http://localhost:5173)
npm run dev:web
```

API health: `GET /health`  
API version: `GET /api/v1` (reports phase/version)

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:api` | API watch mode |
| `npm run dev:web` | Vite dev server |
| `npm run build:shared` | Compile shared package |
| `npm run typecheck` | Type-check all workspaces |
| `npm run build` | Build shared + all workspaces |
| `npm run seed:users` | Demo users for login (API workspace: `apps/api`) |
| `npm run seed:demo` | Demo tenant seed (API workspace) |

---

## Auth & tenancy (quick reference)

Production lifecycle: **Register → Email verify → Admin approve (+ role/tenant) → Activate → Login**.

### Hard rules
- Public `POST /auth/register` never creates `super_admin`, never trusts client `role`/`tenantId`, never issues tokens.
- New accounts: `isEmailVerified=false`, `approvalStatus=pending`, `isActive=false`.
- Login requires verified email + approved + active + not locked.
- Super Admin only via `npm run seed:bootstrap-sa` or `seed:users` (controlled tooling).
- Frontend persist key `ul-auth-v2`; tokens starting with `demo-` are not authenticated.
- Demo login autofill only when `import.meta.env.DEV && VITE_ENABLE_DEMO_LOGIN==="true"`.

### Email
- `EMAIL_PROVIDER_API_KEY` (Resend), `EMAIL_FROM`, `APP_URL`
- Without API key in development: `[DEV MAIL]` log with link (no production tokens logged).

### Demo / bootstrap users

```bash
cd apps/api && npm run seed:users
# Super Admin bootstrap (does not wipe other SAs):
BOOTSTRAP_SA_EMAIL=admin@example.com BOOTSTRAP_SA_PASSWORD='StrongPass1' npm run seed:bootstrap-sa
```

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `admin@university.edu` | `Password123!` |
| Tenant Admin | `dean.mitchell@stanford.edu` | `Password123!` |
| Faculty | `prof.jenkins@stanford.edu` | `Password123!` |
| Student | `alex.rivera@stanford.edu` | `Password123!` |

Seeded users are verified + approved + active.

### Admin approval APIs
- `GET /api/v1/users?approvalStatus=pending` — list pending
- `POST /api/v1/users/:id/approve` — body `{ role, tenantId?, activate }` (RBAC `user:manage`)
- `POST /api/v1/users/:id/reject` — body `{ reason? }`
- `PATCH /api/v1/users/:id/active` — body `{ isActive }`

### Example login

```bash
curl -s -X POST http://localhost:4000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@university.edu","password":"Password123!"}'
```

## Security baseline

- [x] bcrypt password hashing
- [x] Short-lived access + revocable refresh tokens
- [x] Tenant isolation on queries (`tenantId` + soft delete)
- [x] RBAC on routes (`requirePermission` / `requireRoles`)
- [x] Zod validation on inputs
- [x] Rate limits (global + auth)
- [x] Helmet + CORS
- [x] Enrollment checks for student assessment access
- [x] Grades computed on the server (never trust client scores)
- [x] Plagiarism field architecture-ready (no external API yet)

---

## Frontend routes (selected)

| Path | Audience |
|------|----------|
| `/login`, `/register` | Public |
| `/dashboard` | Authenticated |
| `/academic/*`, `/students`, `/faculty`, `/courses` | Staff / admin |
| `/learn` | Enrolled learning |
| `/assignments`, `/assignments/:id` | Faculty + students |
| `/quizzes`, `/quizzes/:id/take`, `/quizzes/:id/builder` | Faculty + students |
| `/question-bank` | Faculty / admin |
| `/admin/tenants`, `/billing`, `/settings` | Super admin / tenant admin |

---

## Documentation

| Path | Content |
|------|---------|
| `docs/phase-0/` … `docs/phase-9/` | Phase notes & summaries |
| `docs/architecture/` | Architecture decisions |
| `docs/conventions/` | Coding conventions |
| `.env.example` | Environment variables |

---

## CI

On push/PR to `main` or `develop`:

1. `npm ci`
2. Build `@university-lms/shared`
3. `npm run typecheck` (all workspaces)
4. Build API + Web

Workflow: `.github/workflows/ci.yml`

---

## Next: Phase 10 — Gradebook

Consume assignment submission and quiz attempt marks into a unified gradebook, reporting, and export. Do not expand into full exam system (Phase 12) until Gradebook is stable.

---

## License

UNLICENSED — private project.
