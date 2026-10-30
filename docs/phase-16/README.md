# Phase 16 — Library, Placement, Internship & Student Support

## Overview

- **Library**: catalog (CRUD + search), circulation (loan/return with availability), reservations, overdue detection, fine records (pending/waived/settled_external — **no payment collection**)
- **Placement & Internship**: companies, drives (`placement` | `internship`), eligibility-gated apply, application pipeline, interviews, offers
- **Student Support**: tickets (grievance + counseling included as categories), messages, assign/status, escalate
- Phase 15 fee/payment gateways remain **out of scope**

## Library API — `/api/v1/library`

| Method | Path | Permission | Notes |
|--------|------|------------|--------|
| GET | `/items` | library:read | Catalog search |
| POST/PATCH/DELETE | `/items` | library:manage | Inventory |
| GET | `/loans`, `/loans/me` | library:read | Student scoped on me |
| POST | `/loans` | library:circulate | Decrements availableCopies |
| POST | `/loans/:id/return` | library:circulate | Increments available |
| GET/POST | `/reservations` | library:read | Create/cancel |
| GET | `/fines`, `/fines/me` | library:read | |
| POST | `/fines/:id/waive` | library:manage | No Stripe/Razorpay |
| POST | `/overdue/refresh` | library:manage | Marks overdue + fine records |

## Placement API — `/api/v1/placement`

| Method | Path | Permission | Notes |
|--------|------|------------|--------|
| CRUD | `/companies` | manage/read | |
| CRUD | `/drives` | manage/read | Students only see `open` |
| POST | `/drives/:id/open\|close\|complete` | manage | |
| POST | `/applications` | placement:apply | CGPA soft-check |
| GET | `/applications`, `/applications/me` | read | |
| PATCH | `/applications/:id/status` | manage | Pipeline |
| POST | `/interviews` | manage | |
| POST | `/offers` | manage | |
| POST | `/offers/:id/respond` | apply | Accept/decline |

## Support API — `/api/v1/support`

| Method | Path | Permission | Notes |
|--------|------|------------|--------|
| POST | `/tickets` | support:create | Student creates |
| GET | `/tickets`, `/tickets/me` | support:read | Student only own |
| PATCH | `/tickets/:id` | support:manage | Status/assign |
| POST | `/tickets/:id/escalate` | support:manage | Level + priority |
| GET/POST | `/tickets/:id/messages` | read/create | Internal notes staff-only |

## Frontend

- `/library` — catalog, loans, fines, reservations
- `/placement` — drives board, companies, applications pipeline, offers
- `/support` — helpdesk ticket list + thread drawer
- Nav: **Campus Services** (Library, Placement, Support) for admin/faculty/student; Soon badges removed for these three

## Version

App / shared version **0.16.0**.
