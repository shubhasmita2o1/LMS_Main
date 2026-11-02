# Stage 3 — Phase 01 Verification & Hardening

**Product:** University LMS — Independent, Self-Hosted University Management and Learning Platform  
**Developer:** Technoriya E Technologies Pvt. Ltd.  
**Repository:** https://github.com/shubhasmita2o1/LMS_Main  
**Document status:** Planning only — tests not executed in this document  
**Base ref inspected:** `main` @ `9d8506e21585548544d74a7db283818ea0f98461`  
**Related code:**
- `apps/api/src/modules/institution/*`
- `apps/api/src/modules/setup/*`
- `apps/api/src/middleware/institution.middleware.ts`
- `apps/api/src/app.ts`

**Rules for this milestone**
- Do not remove SaaS modules yet.
- Do not declare Phase 01 complete without documented test evidence.
- Actual result / Pass-Fail columns below are **blank until tests are run**.

---

## 1. Verification checklist

### Conventions

| Field | Meaning |
|-------|---------|
| **Test ID** | Stable identifier |
| **Actual result** | Fill only after execution |
| **Pass/Fail** | `PASS` / `FAIL` / `BLOCKED` / `NOT RUN` |
| **Evidence** | Logs, curl output, Mongo shell counts, screenshots, CI links |

Default API base: `http://localhost:4000`  
Default empty DB: dedicated MongoDB database name (e.g. `ulms_phase01_verify`) — **never production**.

---

### V-01 — Fresh installation on empty MongoDB

| Field | Content |
|-------|---------|
| **Test ID** | V-01 |
| **Objective** | Confirm API starts against an empty database and reports setup is available |
| **Preconditions** | Empty MongoDB database; valid `.env` (`MONGODB_URI`, JWT secrets ≥ 32 chars); `npm install` and `npm run build:shared` done |
| **Procedure** | 1. Point `MONGODB_URI` at empty DB. 2. `npm run dev:api`. 3. `GET /health`. 4. `GET /api/v1`. 5. `GET /api/v1/setup/status`. 6. `GET /api/v1/institution/installation-status`. |
| **Expected result** | Health OK; `/api/v1` returns `architecture: independent-self-hosted` (or current version string); setup status `locked: false`, `canRunSetup: true`; no Institution documents |
| **Actual result** | |
| **Pass/Fail** | NOT RUN |
| **Evidence required** | API logs; JSON responses; `db.institutions.countDocuments()` = 0; `db.installations.find()` |

---

### V-02 — First Institution creation (via setup)

| Field | Content |
|-------|---------|
| **Test ID** | V-02 |
| **Objective** | Create exactly one Institution with `_id === tenantId` |
| **Preconditions** | V-01 passed; installation unlocked |
| **Procedure** | `POST /api/v1/setup/complete` with valid institution + admin body (see §4 sample). Then `db.institutions.find().pretty()`. |
| **Expected result** | HTTP 201; response includes institution id/tenantId equal; Mongo has **one** non-deleted Institution; `_id` string equals `tenantId` string |
| **Actual result** | |
| **Pass/Fail** | NOT RUN |
| **Evidence required** | Response body; Mongo document dump |

---

### V-03 — First Institution Super Admin creation

| Field | Content |
|-------|---------|
| **Test ID** | V-03 |
| **Objective** | Exactly one initial institutional administrator is created and can log in |
| **Preconditions** | V-02 succeeded |
| **Procedure** | 1. Inspect `db.users.find({ isDeleted: false })`. 2. Confirm roles include `tenant_admin` (current temporary Institution Super Admin role). 3. Confirm `tenantId` equals Institution `_id`. 4. Confirm `isEmailVerified: true`, `approvalStatus: "approved"`, `isActive: true`. 5. `POST /api/v1/auth/login` with admin email/password. |
| **Expected result** | One admin user; login returns access + refresh tokens; user payload tenantId matches institution |
| **Actual result** | |
| **Pass/Fail** | NOT RUN |
| **Evidence required** | User document (password redacted); login response (tokens redacted in logs) |

---

### V-04 — Concurrent setup requests

| Field | Content |
|-------|---------|
| **Test ID** | V-04 |
| **Objective** | Concurrent `POST /setup/complete` cannot produce two Institutions or two admins |
| **Preconditions** | Empty DB (reset after V-03) or fresh empty DB |
| **Procedure** | Fire 5–10 parallel `POST /api/v1/setup/complete` with **different** admin emails but same institution name pattern (script with `xargs -P` or parallel curl). Inspect counts. |
| **Expected result** | Exactly one successful 201; others 403/409; `institutions` count = 1; non-deleted users with `tenant_admin` ≤ 1 for that install; installation `locked: true` |
| **Actual result** | |
| **Pass/Fail** | NOT RUN |
| **Evidence required** | Parallel command output; Mongo counts |

---

### V-05 — Repeated setup after lock

| Field | Content |
|-------|---------|
| **Test ID** | V-05 |
| **Objective** | Setup remains permanently locked after success |
| **Preconditions** | Successful locked installation |
| **Procedure** | `POST /api/v1/setup/complete` again with new credentials. `GET /api/v1/setup/status`. |
| **Expected result** | 403 `INSTALLATION_LOCKED`; status `locked: true`, `canRunSetup: false` |
| **Actual result** | |
| **Pass/Fail** | NOT RUN |
| **Evidence required** | JSON error body; status response |

---

### V-06 — Interrupted setup and recovery

| Field | Content |
|-------|---------|
| **Test ID** | V-06 |
| **Objective** | Document behaviour when process crashes between Institution create and lock |
| **Preconditions** | Ability to pause/kill API or inject failure (manual DB simulation acceptable) |
| **Procedure** | **Simulation A:** Manually insert Institution without Installation lock; restart API; call setup status and complete. **Simulation B:** Insert Institution + User without lock; attempt complete. **Simulation C (ideal later):** kill process mid-setup if reproducible. |
| **Expected result** | *Current implemented behaviour (document honestly):* unique index / lock may block second Institution; incomplete state may require manual cleanup. *Target after hardening:* detectable incomplete state + safe retry or documented recovery procedure without duplicate admins |
| **Actual result** | |
| **Pass/Fail** | NOT RUN |
| **Evidence required** | Steps taken; DB state before/after; whether second setup succeeded or required manual delete |

---

### V-07 — Locked vs unlocked institution middleware

| Field | Content |
|-------|---------|
| **Test ID** | V-07 |
| **Objective** | Soft `resolveInstitution` behaviour matches design |
| **Preconditions** | Ability to test both unlocked and locked DBs |
| **Procedure** | **Unlocked:** any authenticated/legacy route does not require Institution; setup works. **Locked:** requests (except setup/health/public) receive fixed `req.tenantId`; optional `INSTITUTION_ID` env pin. |
| **Expected result** | Unlocked: pass-through (legacy multi-tenant still possible). Locked: institution context injected; mismatch pin → 500 `INSTITUTION_ID_MISMATCH` |
| **Actual result** | |
| **Pass/Fail** | NOT RUN |
| **Evidence required** | Request logs or temporary debug of `req.tenantId`; env pin test |

---

### V-08 — INSTITUTION_ID validation

| Field | Content |
|-------|---------|
| **Test ID** | V-08 |
| **Objective** | Env pin rejects wrong id when installation is locked |
| **Preconditions** | Locked installation; known Institution `_id` |
| **Procedure** | 1. Start API with `INSTITUTION_ID=<correct>`. Hit protected route. 2. Restart with `INSTITUTION_ID=000000000000000000000000`. Hit route. |
| **Expected result** | Correct pin: OK. Wrong pin: error `INSTITUTION_ID_MISMATCH` |
| **Actual result** | |
| **Pass/Fail** | NOT RUN |
| **Evidence required** | Responses for both runs |

---

### V-09 — Authentication and existing tenantId queries

| Field | Content |
|-------|---------|
| **Test ID** | V-09 |
| **Objective** | Login and tenant-scoped queries work with fixed institution tenantId |
| **Preconditions** | Locked install + Super Admin from setup |
| **Procedure** | Login → use access token on `GET /api/v1/users` or `GET /api/v1/institution` → create a minimal academic entity if role allows → confirm stored `tenantId` equals Institution id |
| **Expected result** | Auth succeeds; documents written with institution tenantId; no cross-tenant leakage in single-install DB |
| **Actual result** | |
| **Pass/Fail** | NOT RUN |
| **Evidence required** | Login + sample document `tenantId` |

---

### V-10 — Academic module compatibility

| Field | Content |
|-------|---------|
| **Test ID** | V-10 |
| **Objective** | Core academic paths still respond under locked institution context |
| **Preconditions** | V-09; permissions for academic admin |
| **Procedure** | Smoke: `GET/POST` as appropriate for `/api/v1/academic` hierarchy endpoints (university/department/program as implemented); `/api/v1/students`; `/api/v1/courses` list/create minimal records |
| **Expected result** | No unexpected 500 from missing tenant context; created rows carry fixed tenantId |
| **Actual result** | |
| **Pass/Fail** | NOT RUN |
| **Evidence required** | Status codes; one document per module |

---

### V-11 — Lab execution isolation

| Field | Content |
|-------|---------|
| **Test ID** | V-11 |
| **Objective** | Lab execution remains outside main API process |
| **Preconditions** | Labs module available; default `LAB_EXECUTOR=mock` unless Docker worker configured |
| **Procedure** | 1. Confirm code paths still use ExecutionAdapter pattern (`apps/api` labs module + `workers/lab-worker`). 2. Submit a mock lab execution if APIs allow. 3. Confirm student code is not `eval`'d in API process. |
| **Expected result** | Isolation architecture unchanged; mock or worker path only |
| **Actual result** | |
| **Pass/Fail** | NOT RUN |
| **Evidence required** | Reference to adapter usage; execution response; note that Phase 01 did not modify lab-worker |

---

### V-12 — API typecheck and production build

| Field | Content |
|-------|---------|
| **Test ID** | V-12 |
| **Objective** | API TypeScript and build succeed |
| **Preconditions** | Node ≥ 20; dependencies installed |
| **Procedure** | From repo root: `npm run build:shared` then `npm run typecheck -w @university-lms/api` and `npm run build -w @university-lms/api` |
| **Expected result** | Exit code 0 |
| **Actual result** | |
| **Pass/Fail** | NOT RUN |
| **Evidence required** | Terminal transcript |

---

### V-13 — Frontend typecheck and production build

| Field | Content |
|-------|---------|
| **Test ID** | V-13 |
| **Objective** | Web TypeScript and Vite build succeed |
| **Preconditions** | Shared built |
| **Procedure** | `npm run typecheck -w @university-lms/web` and `npm run build -w @university-lms/web` |
| **Expected result** | Exit code 0 |
| **Actual result** | |
| **Pass/Fail** | NOT RUN |
| **Evidence required** | Terminal transcript |

---

### V-14 — Backup and restoration considerations

| Field | Content |
|-------|---------|
| **Test ID** | V-14 |
| **Objective** | Document backup scope for a single-institution install |
| **Preconditions** | Locked test installation with sample data |
| **Procedure** | 1. `mongodump` the test DB. 2. Drop DB. 3. `mongorestore`. 4. Restart API. 5. Login + `GET /api/v1/setup/status` (must stay locked). |
| **Expected result** | Restored Institution, Installation lock, admin user, and sample academic data; setup still locked |
| **Actual result** | |
| **Pass/Fail** | NOT RUN |
| **Evidence required** | Dump path; post-restore counts; login success |

---

## 2. Hardening backlog

Distinguish **implemented today** vs **proposed**.

| ID | Topic | Implemented behaviour (as of main @ 9d8506e) | Proposed hardening |
|----|--------|-----------------------------------------------|--------------------|
| H-01 | Setup rate limiting | Only global `defaultApiRateLimit` (100/min/IP). Setup routes have **no** dedicated limiter | Add `setupRateLimit` (e.g. 5 complete attempts / 15 min / IP) on `POST /setup/complete` |
| H-02 | Atomic installation | Compensating deletes + unique partial index + conditional `findOneAndUpdate` lock — **not** a multi-doc Mongo transaction | Prefer transaction when replica set available; else durable "setup_in_progress" state machine with idempotent retry |
| H-03 | Crash recovery | Partial Institution/User possible if process dies before lock | On boot: detect orphan Institution without lock / without admin; expose admin-only or CLI recovery; never auto-create second Institution |
| H-04 | Singleton Institution | Partial unique index on `{ isDeleted: false }`; service rejects count > 1 on read | Keep index; add startup assertion; optional env `ALLOW_LEGACY_MULTI_TENANT=true` only for transition |
| H-05 | Installation lock integrity | `locked: true` set via conditional update; subsequent setup returns 403 | Ensure single Installation doc (unique collection invariant); reject deletes of lock in app code; audit log lock event |
| H-06 | Duplicate first-admin prevention | Email uniqueness + rollback on lock race | Also unique partial index strategy for "first admin" flag if needed; refuse second `tenant_admin` bootstrap via setup |
| H-07 | Password handling | bcrypt via `hashPassword`; Zod min 10 + complexity on setup body; password not returned in JSON | Align strength with global auth policy; never log password; consider breachable-password checks later |
| H-08 | Setup endpoint protection | Public while unlocked (required for first run) | Rate limit (H-01); optional one-time `SETUP_BOOTSTRAP_TOKEN` from env required on `POST /complete`; disable setup routes entirely when `INSTALLATION_LOCKED` file/env forced |
| H-09 | Error handling / logging | `AppError` codes: `INSTALLATION_LOCKED`, `INSTITUTION_EXISTS`, `INSTITUTION_MISCONFIGURED`, etc. | Structured audit events for setup start/success/failure; no sensitive fields in logs |
| H-10 | Incomplete installation recovery | Manual Mongo cleanup | Documented CLI: `npm run setup:repair` (future) listing orphans and safe delete/complete options |
| H-11 | Role naming | First admin = `tenant_admin` | Phase 03 RBAC: introduce `institution_super_admin` (or Principal-equivalent) and migrate |
| H-12 | Soft mode exit | Unlocked → legacy multi-tenant path still works | After verification, policy decision: force setup on empty DB in production (`REQUIRE_INSTALLATION=true`) |

---

## 3. Test execution commands

Inspected from root `package.json`, `apps/api/package.json`, `apps/web/package.json`.

```bash
# Clone / checkout main
git clone https://github.com/shubhasmita2o1/LMS_Main.git
cd LMS_Main
git checkout main

# Install
cp .env.example .env   # set MONGODB_URI to EMPTY test DB, JWT secrets
npm install
npm run build:shared

# Typecheck & build (V-12, V-13)
npm run typecheck -w @university-lms/api
npm run build -w @university-lms/api
npm run typecheck -w @university-lms/web
npm run build -w @university-lms/web
# Or all workspaces:
npm run typecheck
npm run build

# Run API
npm run dev:api
# API: http://localhost:4000
```

### Setup API samples

```bash
# Status
curl -s http://localhost:4000/api/v1/setup/status | jq

# Complete (V-02 / V-03)
curl -s -X POST http://localhost:4000/api/v1/setup/complete \
  -H 'Content-Type: application/json' \
  -d '{
    "institution": {
      "name": "Verification College",
      "code": "VCOL",
      "type": "affiliated"
    },
    "admin": {
      "email": "admin@verification.college",
      "password": "StrongPass1x",
      "firstName": "Institution",
      "lastName": "Admin"
    }
  }' | jq

# Login
curl -s -X POST http://localhost:4000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@verification.college","password":"StrongPass1x"}' | jq

# Concurrent (example — adjust)
seq 1 5 | xargs -P 5 -I{} curl -s -o /tmp/setup-{}.json -w "%{http_code}\n" \
  -X POST http://localhost:4000/api/v1/setup/complete \
  -H 'Content-Type: application/json' \
  -d "{\"institution\":{\"name\":\"Concurrent College {}\"},\"admin\":{\"email\":\"admin{}@c.test\",\"password\":\"StrongPass1x\",\"firstName\":\"A\",\"lastName\":\"B\"}}"
```

### Mongo checks

```javascript
// mongosh <uri>
db.institutions.find({ isDeleted: false })
db.installations.find()
db.users.find({ isDeleted: false }, { email: 1, roles: 1, tenantId: 1, approvalStatus: 1, isActive: 1 })
```

---

## 4. Acceptance criteria (Phase 01 close-out)

Phase 01 may be declared **complete** only when **all** of the following are true and evidenced:

- [ ] Fresh installation on empty DB succeeds (V-01–V-03)
- [ ] Exactly one Institution exists after setup
- [ ] Institution `_id` equals `tenantId`
- [ ] Exactly one initial institutional administrator exists for that install
- [ ] Concurrent setup cannot produce duplicate Institutions or duplicate successful locks (V-04)
- [ ] Setup remains permanently locked after success (V-05)
- [ ] Incomplete setup behaviour is documented; recovery path is known (V-06) — hardening may still be open if risk accepted
- [ ] Locked middleware injects fixed institution context; unlocked soft mode documented (V-07)
- [ ] `INSTITUTION_ID` pin validated when set (V-08)
- [ ] Auth + tenantId queries work (V-09)
- [ ] Academic smoke paths work under fixed context (V-10)
- [ ] Lab execution remains isolated (V-11)
- [ ] API typecheck + build pass (V-12)
- [ ] Frontend typecheck + build pass (V-13)
- [ ] Backup/restore notes validated or explicitly deferred with owner approval (V-14)
- [ ] SaaS compatibility code does **not** override locked institutional context (no second tenant wins)
- [ ] This checklist's Actual/Pass columns filled; evidence stored (repo `docs/migration/` or internal test vault)

**Hardening items H-01–H-12** may be tracked as residual risk; critical security items (rate limit, bootstrap token, crash recovery) should be resolved or formally accepted before production customer installs.

---

## 5. Known limitations (do not over-claim)

1. **Soft mode:** Until installation is locked, legacy multi-tenant behaviour remains reachable.
2. **No multi-document transaction** in setup — crash windows exist.
3. **Setup is public while unlocked** — only global rate limit applies today.
4. **Role name** `tenant_admin` is temporary compatibility, not final Institution Super Admin catalogue entry.
5. **SaaS modules** (`/tenants`, `/billing`, `/admin` control plane, plan seeding) still present — Phase 02 scope.
6. **README** still describes multi-tenant SaaS product identity — documentation update is pending.
7. **No automated test suite** for setup concurrency in CI at time of writing.
8. **This document does not claim any test passed** — all cases default to NOT RUN.

---

## 6. Recommended implementation order

1. **Execute verification checklist V-01 → V-14** on a disposable database; fill Actual/Pass/Evidence.  
2. **H-01 + H-08** — setup rate limit + optional `SETUP_BOOTSTRAP_TOKEN`.  
3. **H-03 + H-10** — incomplete setup detection and recovery procedure/CLI.  
4. **H-02** — strengthen atomicity (transactions or state machine).  
5. **H-05 / H-04** — lock and singleton assertions at startup.  
6. Close Phase 01 with signed checklist.  
7. Only then start **Phase 02: SaaS control-plane removal**.  
8. **Phase 03: Indian RBAC** (includes H-11 role rename).

---

## 7. Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Verification lead | | | |
| Engineering | | | |
| Product / Technoriya | | | |

**Phase 01 status after this document:** Implemented on `main` — **verification pending**.

---

*End of STAGE3_PHASE01_VERIFICATION.md*
