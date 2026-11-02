# Stage 3 — Phase 01 Follow-up

**Branch:** `feature/independent-self-hosted-followup`  
**Status:** Implemented

## Objectives completed

1. **Wire `resolveInstitution` globally** in `app.ts` (soft mode).
2. **Atomic first-run setup** with permanent lock.
3. **Institution Super Admin** created only via setup (no hardcoded credentials).
4. **Validate `_id === tenantId`** on read and after create.
5. **Keep** existing Tenant module and `tenant.middleware.ts` (not removed).

## Behaviour

### `resolveInstitution` (soft)

| Installation state | Behaviour |
|--------------------|-----------|
| Not locked | Pass-through — legacy multi-tenant path still works |
| Locked | Load single Institution; set `req.tenantId` / `req.institutionId` |
| Setup / health / public paths | Always exempt |

### Setup API

| Method | Path | Purpose |
|--------|------|--------|
| `GET` | `/api/v1/setup/status` | Whether setup can run |
| `POST` | `/api/v1/setup/complete` | Create Institution + Super Admin + lock |

`POST /complete` body:

```json
{
  "institution": {
    "name": "Example College",
    "code": "EXC",
    "type": "affiliated",
    "hierarchyConfig": { "campus": false, "department": true },
    "featureToggles": { "labs": true }
  },
  "admin": {
    "email": "admin@college.edu",
    "password": "StrongPass1x",
    "firstName": "College",
    "lastName": "Admin"
  }
}
```

Password rules: min 10 chars, upper, lower, digit.

After success, further setup calls return **403 INSTALLATION_LOCKED**.

### Institution Super Admin role

Until the full Indian RBAC catalogue is implemented, the first admin is created as **`tenant_admin`** with `tenantId` set to the institution. This is the highest *institutional* role in the current permission map (not SaaS global `super_admin` with `tenantId: null`).

## Concurrency safety

- Unique partial index on active Institution prevents double create.
- Installation lock uses `findOneAndUpdate({ locked: { $ne: true } })`.
- If lock loses a race, created Institution + User are rolled back.

## Intentionally not done

- Removal of SaaS billing / plans / tenants module
- Removal of `tenant.middleware.ts`
- Full Indian role catalogue
- Frontend setup wizard UI
- Data migration of existing multi-tenant data

## Next phases

- Verify `req.tenantId` consumers under locked mode
- Typecheck / build / regression
- Then Stage 3 Phase 02: SaaS control-plane removal
