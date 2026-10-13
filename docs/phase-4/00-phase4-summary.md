# Phase 4 — University & Academic Structure

**Status:** Complete (backend + frontend foundation)  
**Version:** 0.4.0

## Hierarchy

University → Campus → School → Department → Program → Batch → Section  
(+ AcademicYear → Semester, AcademicConfig)

## Backend (`/api/v1/academic/*`)

| Area | Endpoints |
|------|-----------|
| Tree | `GET /tree` |
| Config | `GET/PATCH /config` |
| Universities | CRUD |
| Campuses | CRUD |
| Schools | CRUD |
| Departments | CRUD + `POST /:id/assign-hod` |
| Programs | CRUD + `POST /:id/assign-coordinator` |
| Academic years | CRUD + `POST /:id/set-current` |
| Semesters | CRUD + `POST /:id/set-current` |
| Batches | CRUD |
| Sections | CRUD + `POST /:id/assign-advisor` |

All models: `tenantId`, soft delete, audit fields, unique indexes per tenant.

## Frontend routes

- `/academic` — hierarchy tree
- `/academic/universities/new`
- `/academic/departments`
- `/academic/programs`
- `/academic/batches`
- `/academic/years`
- `/academic/settings`

## Isolation & RBAC

- Every query filters by tenantId
- `authenticate` + `resolveTenant` + `requirePermission` on routes
- Frontend uses `<Can>` for create/delete actions
