# Stage 3 — Phase 01: Institution Model & Context Middleware

**Branch:** `feature/independent-self-hosted`  
**Status:** Implemented (foundation only)

## What was added

| Path | Purpose |
|------|--------|
| `apps/api/src/modules/institution/institution.model.ts` | Single Institution document per installation |
| `apps/api/src/modules/institution/installation.model.ts` | Setup lock state |
| `apps/api/src/modules/institution/institution.service.ts` | get / create / update Institution |
| `apps/api/src/modules/institution/institution.controller.ts` | HTTP handlers |
| `apps/api/src/modules/institution/institution.routes.ts` | `/api/v1/institution` |
| `apps/api/src/middleware/institution.middleware.ts` | `resolveInstitution` — injects fixed `req.tenantId` |
| `docs/migration/STAGE3_PHASE01.md` | This note |

## Locked decisions applied

1. **Field name stays `tenantId`** on all existing collections.  
2. Institution document’s `_id` is also stored as `tenantId` on itself; that value is the fixed context for the whole install.  
3. Existing `tenants` module is **not** deleted.  
4. Multi-tenant header/subdomain resolution is not yet removed (next small commit will wire the new middleware and decommission the old path safely).

## How context works

```
resolveInstitution middleware
  → load single Institution (or fail)
  → req.tenantId      = institution.tenantId
  → req.institutionId = institution._id
  → req.institution   = { id, name, type, … }
```

Existing services that already filter by `req.tenantId` will continue to work once this middleware is mounted in `app.ts` (Phase 01 follow-up).

## Not yet done (later phases)

- Wire `resolveInstitution` into `app.ts` and retire `resolveTenant`
- First-run setup wizard (`/api/v1/setup/*`) with atomic lock
- Remove SaaS billing / plans / global Super Admin
- Full Indian RBAC catalogue
- Frontend institution store & dashboards

## Safety

No data migration has been run. No existing Tenant documents were modified. Lab execution isolation is untouched.
