# Phase 14 — Timetable & Transcripts

## Overview

- **Rooms** and **timetable entries** with faculty / room / section conflict detection
- **Cancel** and **substitute** flows
- **Calendar/me** for students (enrolled courses/sections) and faculty (own teaching)
- **Transcripts** generated from **published** gradebook `Result` records only
- **Certificates** (provisional, degree, bonafide, transcript)
- **HMAC-SHA256** digital signature + high-entropy `verificationCode`
- **Public verify** at `GET /api/v1/public/verify/:code` and `/verify/:code` (no login)

## Timetable API — `/api/v1/timetable`

| Method | Path | Notes |
|--------|------|--------|
| GET/POST/PATCH/DELETE | `/rooms` | Room CRUD |
| GET/POST | `/entries` | List / create (409 + conflicts unless `force`) |
| PATCH/DELETE | `/entries/:id` | Update / soft-delete |
| POST | `/entries/:id/cancel` | Cancel slot |
| POST | `/entries/:id/substitute` | Substitution record + optional field overrides |
| POST | `/conflicts/check` | Dry-run conflicts |
| GET | `/calendar/me` | Role-aware personal calendar |

## Transcripts — `/api/v1/transcripts`

| Method | Path | Notes |
|--------|------|--------|
| GET | `/` or `/me` | Admin filters; student sees own **issued** only |
| POST | `/generate` | Draft snapshot from published results |
| POST | `/:id/issue` | Serial, verificationCode, HMAC signature |
| POST | `/:id/revoke` | Blocks public verify |
| GET | `/:id` | Detail |

## Certificates — `/api/v1/certificates`

| Method | Path | Notes |
|--------|------|--------|
| GET | `/` or `/me` | List |
| POST | `/` | Draft |
| POST | `/:id/issue` | Sign + code |
| POST | `/:id/revoke` | Revoke |

## Public verify

`GET /api/v1/public/verify/:verificationCode`

Returns limited authenticity payload (student name, type, serial, issuedAt, GPA summary). Does **not** expose internal Mongo IDs or full grade rows beyond summary policy.

## Signing

```
payload = tenantId|serial|studentId|type|issuedAtISO|hashOrTitle
signature = HMAC-SHA256(payload, TRANSCRIPT_SIGNING_SECRET)
```

Env:

- `TRANSCRIPT_SIGNING_SECRET` — required strength in production (default only for dev)
- `APP_URL` — used for QR/verify links on the web app (`/verify/:code`)

## Frontend

- `/timetable` — admin week grid + create slot/room
- `/timetable/my` and `/calendar` — personal calendar
- `/documents` and `/transcripts` — issue/view documents
- `/verify/:code` — public authenticity page

## RBAC

- `timetable` / `room`: read | manage
- `transcript` / `certificate`: read | manage | issue
