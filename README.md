# University LMS — SaaS Platform

**Multi-tenant Learning Management & Academic Platform**  
MERN + TypeScript • Modular monolith • MongoDB Atlas • Redis-ready

**Document version:** 0.14.0 · **Roadmap:** University LMS SaaS Master Roadmap v2.0  
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
| **12** | Examination System (online player & allocation) | ✅ Complete |
| **13** | Communication, Notifications & Discussion | ✅ Complete |
| **14** | Timetable, Transcripts & Certificate Verification | ✅ Complete |
| **15+** | Admissions, Finance & Fees, Library, Placement & Sellable MVP Polish | Planned |

**Sellable MVP target:** after Phase 10–14. **Lab execution stays isolated from the main API** (`ExecutionAdapter` + mock/Docker worker).

### Phase 14 — Timetable & Transcripts (Verification)

- **Rooms and timetable scheduling** with faculty, room, and section conflict detection
- Cancellation, substitution, and dry-run conflict check engine
- Role-aware personal calendar (`/calendar` & `/timetable/my`) for students and faculty
- **Official transcripts** generated exclusively from published gradebook records with GPA calculations
- **Certificates** (provisional, degree, bonafide) with HMAC-SHA256 digital signature and high-entropy verification codes
- **Public verification portal** endpoint (`GET /api/v1/public/verify/:code`) and unauthenticated web viewer (`/verify/:code`). See `docs/phase-14/README.md`.
- APIs: `/api/v1/timetable`, `/api/v1/transcripts`, `/api/v1/certificates`, `/api/v1/public/verify/:code`

### Phase 13 — Communication, Notifications & Discussion

- Multi-channel notification engine (in-app, email via Resend, push & SMS adapter hooks)
- In-app notification drawer with polling, unread badges, mark-read, user channel preferences, admin template manager, and delivery logs
- Campus & Course Announcements with multi-tier audience targeting (tenant, course, program, section, role)
- Course Discussion Forums with threaded replies, pin/lock, verified answer marking, moderation hiding, and content reporting. See `docs/phase-13/README.md`.
- APIs: `/api/v1/notifications`, `/api/v1/announcements`, `/api/v1/courses/:courseId/discussions`

### Phase 12 — Examination System

- Online exams with server timer, autosave, question flagging, auto-submit, negative marking
- Center allocation, invigilators, question snapshots from bank on publish
- Suspicion event hooks (browser focus loss, fullscreen exit — no vendor proctoring). See `docs/phase-12/README.md`.
- API: `/api/v1/exams`

### Phase 11 — Practical & Lab Platform

- Default: `LAB_EXECUTOR=mock` (deterministic fake results; **no student code runs in main API**).
- Production path: separate `workers/lab-worker` + Docker isolation (`network=none`, cgroup limits, non-root). See `docs/phase-11/README.md`.
- API: `/api/v1/labs` — practicals → labs → experiments → submissions / executions.

---

## Stack

| Layer | Choice |
|-------|--------|
| API | Express + TypeScript, Zod validation |
| Web | React + Vite + Tailwind, React Query, Zustand, Lucide Icons |
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
│   │       ├── services/    # storage, feature flags, mailer, …
│   │       └── scripts/     # seed helpers
│   └── web/                 # React SPA (@university-lms/web)
│       └── src/
│           ├── pages/       # feature screens
│           ├── components/
│           ├── hooks/
│           ├── lib/         # API client
│           └── stores/      # auth store, tenant store
├── packages/
│   └── shared/              # shared types, constants, utils
├── workers/
│   └── lab-worker/          # isolated code execution worker (Docker)
├── docs/
│   ├── phase-0/ … phase-14/
│   ├── architecture/
│   └── conventions/
├── docker/
├── .github/workflows/       # CI: install, build shared, typecheck, build api/web
└── package.json             # npm workspaces root
```

### API modules (`apps/api/src/modules`)

| Module | Base path | Notes |
|--------|-----------|--------|
| `auth` | `/api/v1/auth` | Login, register, email verify, refresh, logout, me |
| `users` | `/api/v1/users` | User directory, approval lifecycle, status toggle |
| `tenants` / `admin` / `billing` / `plans` | `/api/v1/…` | Multi-tenant control plane, plans, subscriptions |
| `academic` | `/api/v1/academic` | University → campus → school → dept → program → batch → section |
| `students` | `/api/v1/students` | Student SIS, documents, enrollment status |
| `faculty` | `/api/v1/faculty` | Faculty profiles, workload, teaching assignments |
| `courses` | `/api/v1/courses` | Catalog, offerings, syllabus, OBE CO-PO mapping, enrollments |
| `learn` | `/api/v1/learn` | Lessons, progress tracking, notes, live classes, file uploads |
| `question-bank` | `/api/v1/question-bank` | Subjects, units, topics, multi-type questions |
| `assignments` | `/api/v1/assignments` | Rubrics, late policies, submissions & grading |
| `quizzes` | `/api/v1/quizzes` | Timed attempts, auto-grading for objective questions |
| `gradebook` | `/api/v1/gradebook` | Weighted components, formula compute, publish snapshots, transcript |
| `attendance` | `/api/v1/attendance` | Sessions, bulk marking, student percentage summaries, shortage alerts |
| `labs` | `/api/v1/labs` | Practicals, labs, experiment workspaces, test-case evaluations |
| `exams` | `/api/v1/exams` | Examination papers, question snapshots, candidate allocation, attempt player |
| `notifications` | `/api/v1/notifications` | In-app alerts, read tracking, preferences, templates, delivery logs |
| `announcements` | `/api/v1/announcements` | Targeted notices with broadcast fan-out |
| `discussions` | `/api/v1/courses/:courseId/discussions` | Course Q&A forums, threaded replies, moderation & reports |
| `timetable` | `/api/v1/timetable` | Rooms, weekly entries, conflict detection, calendar/me |
| `transcripts` | `/api/v1/transcripts` | Academic transcripts compiled from published results, HMAC issue & revoke |
| `certificates` | `/api/v1/certificates` | Degree, provisional, bonafide certificates with verification codes |
| `public-verify` | `/api/v1/public/verify/:code` | Unauthenticated authenticity check for employers and credential verifiers |

---

## Phase highlights (summary)

### Phases 0–3 — Foundation & platform
- Product/architecture docs, monorepo, Docker, CI pipeline
- JWT auth, RBAC, tenant resolution, rate limits
- Tenant CRUD, plans, feature flags, Stripe/Razorpay webhook + checkout/portal skeletons

### Phases 4–6 — Academic & people
- University → campus → school → department → program → batch → section
- Academic year / semester / system configuration
- Student SIS (CRUD, documents, bulk CSV import, enrollment status)
- Faculty directory, department assign, teaching assignments

### Phases 7–8 — Courses & learning
- Course catalog, modules/lessons, offerings, curriculum mapping, enrollments
- Learning progress, student notes, bookmarks, live classes
- Storage abstraction for content files

### Phase 9 — Assessments
- **Question bank:** subject → unit → topic → question (MCQ, multi-select, T/F, fill, short/long, numerical, matching)
- **Assignments:** due/late policy, resubmit, rubric, attachments; student submit; faculty grade
- **Quizzes:** bank attach, duration, shuffle, max attempts; timed attempt; **server-side** auto-grade for objective items; manual grade for subjective

### Phase 10 — Gradebook, Results & Attendance
- **Gradebook** with weighted components (assignment / quiz / attendance / manual)
- Server-side **recompute** pulling marks from Phase 9 submissions & quiz attempts
- Lock / unlock / **publish results** with immutable snapshots
- Student **my-grades** + official **transcript** view
- **Attendance sessions** (manual, QR-ready), bulk mark, summary, shortage report

### Phase 11 — Practical & Lab Platform
- Practical suites, lab stations, and experiment workspaces with instructions & starter code
- Test case evaluation with public and hidden test verification
- Asynchronous queue execution model with pluggable adapters (`MockExecutionAdapter` and `DockerExecutionAdapter`)

### Phase 12 — Examination System
- Term examinations, examination center & seating allocation
- Authoritative exam player with server timers, autosave, flagging, and auto-submit on expiry
- Snapshot-isolated questions on publish, negative marking, and proctoring suspicion event logging

### Phase 13 — Communication, Notifications & Discussion
- In-app notification bell with live drawer, badge counts, and user-configurable channel preferences
- Targeted announcements for tenant/campus/program/course/section/role
- Course discussion boards with threaded discussions, replies, moderation, pinning, and verified answers
- Extensible multi-channel notification dispatcher with Resend email integration and push/SMS adapter hooks

### Phase 14 — Timetable & Transcripts (Verification)
- Institutional room management (capacity, room type, campus building, facilities)
- Multi-dimensional conflict engine detecting room, faculty, and section double-bookings with override auditing
- Substitution and cancellation lifecycles with personal timetable calendar views
- Official transcript compilation strictly from published semester/term results with cumulative GPA calculations
- Cryptographic certificate issuance with HMAC-SHA256 signature and unauthenticated public verification portal (`/verify/:code`)

---

## Getting started

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
- [x] Rate limits (global + auth + discussion/report thresholds)
- [x] Helmet + CORS
- [x] Enrollment checks for student assessment, lab, and discussion access
- [x] Server-authoritative timer, auto-grading, and gradebook computations
- [x] Isolated lab code execution architecture (`MockExecutionAdapter` / Docker worker)
- [x] Content safety: lengths enforced, sanitized display (no raw HTML injection)
- [x] Cryptographic verification: HMAC-SHA256 signed transcripts & certificates with public verification portal
- [x] Conflict engine: automated detection of room, faculty, and section collision with force-override auditing

---

## Frontend routes (selected)

| Path | Audience |
|------|----------|
| `/login`, `/register` | Public |
| `/dashboard` | Authenticated |
| `/academic/*`, `/students`, `/faculty`, `/courses` | Staff / admin |
| `/learn`, `/learn/my-courses` | Enrolled learning |
| `/assignments`, `/assignments/:id` | Faculty + students |
| `/quizzes`, `/quizzes/:id/take`, `/quizzes/:id/builder` | Faculty + students |
| `/question-bank` | Faculty / admin |
| `/gradebook`, `/gradebook/transcript` | Faculty / admin / students |
| `/attendance`, `/attendance/mark` | Faculty / admin / students |
| `/labs`, `/labs/:practicalId` | Faculty + students |
| `/examinations`, `/examinations/:id`, `/examinations/:id/attempt` | Faculty + students |
| `/communication`, `/notifications` | Faculty + admin + students |
| `/timetable`, `/timetable/my`, `/calendar` | Faculty + students + staff |
| `/documents`, `/transcripts` | Faculty + students + staff |
| `/verify/:code` | Public (unauthenticated) |
| `/admin/tenants`, `/billing`, `/settings` | Super admin / tenant admin |

---

## Documentation

| Path | Content |
|------|---------|
| `docs/phase-0/` … `docs/phase-14/` | Phase specifications & architecture guides |
| `docs/phase-11/README.md` | Practical & Lab isolated execution spec |
| `docs/phase-12/README.md` | Examination engine & candidate allocation spec |
| `docs/phase-13/README.md` | Communication, notifications & discussion spec |
| `docs/phase-14/README.md` | Timetable engine, conflict detection & transcript verification spec |
| `docs/architecture/` | Architecture decision records (ADRs) |
| `docs/conventions/` | Coding & API conventions |
| `.env.example` | Environment variable reference |

---

## CI

On push/PR to `main` or `develop`:

1. `npm ci`
2. Build `@university-lms/shared`
3. `npm run typecheck` (all workspaces)
4. Build API + Web

Workflow: `.github/workflows/ci.yml`

---

## Next: Phase 15 — Admissions, Finance & Fees, Library, Placement & MVP Polish

Student admissions, fee payment structures & receipts, library catalogue and circulation, placement portal, and multi-tenant billing & onboarding polish towards a market-ready production SaaS release.

---

## License

UNLICENSED — private project.
