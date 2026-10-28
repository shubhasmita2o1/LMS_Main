# Phase 13 — Communication, Notifications & Discussion

## Overview

Multi-tenant communication stack:

- **In-app notifications** with read/unread, preferences, delivery logs
- **Email channel** via existing Resend / `sendEmail` service (optional)
- **Push / SMS** adapter interfaces with **noop** defaults (no vendor keys required)
- **Announcements** with audience targeting (tenant / course / program / section / role)
- **Course discussions** (threads, replies, pin/lock, mark answer, hide, report)

## Channels

| Channel | Status | Enablement |
|---------|--------|------------|
| `in_app` | Production-ready | Always available; preference default **on** |
| `email` | Production-ready when configured | Set `EMAIL_PROVIDER_API_KEY` (Resend) and `EMAIL_FROM` on API. Without key, dev mode logs `[DEV MAIL]` only |
| `push` | Architecture-ready | `NoopPushAdapter` by default; swap via `setPushAdapter` |
| `sms` | Architecture-ready | `NoopSmsAdapter` by default; swap via `setSmsAdapter` |

## API

### Notifications — `/api/v1/notifications`

| Method | Path | Notes |
|--------|------|--------|
| GET | `/` | My in-app list (`unreadOnly`, pagination) |
| GET | `/unread-count` | Badge count |
| POST | `/:id/read` | Mark one read |
| POST | `/read-all` | Mark all read |
| GET/PATCH | `/preferences` | Per type/channel toggles |
| GET | `/templates` | Admin templates |
| POST/PATCH/DELETE | `/templates` | Admin CRUD |
| GET | `/admin/delivery-logs` | Email/push attempt log |

### Announcements — `/api/v1/announcements`

| Method | Path | Notes |
|--------|------|--------|
| GET | `/` | Audience-filtered for current user |
| GET | `/:id` | Detail |
| POST | `/` | Faculty/admin create (draft or publish) |
| PATCH | `/:id` | Update draft |
| POST | `/:id/publish` | Publish + fan-out notifications |
| POST | `/:id/archive` | Archive |

### Discussions

| Method | Path | Notes |
|--------|------|--------|
| GET/POST | `/api/v1/courses/:courseId/discussions/threads` | List / create |
| GET | `/api/v1/courses/:courseId/discussions/threads/:threadId` | Thread + replies |
| POST | `.../threads/:threadId/replies` | Reply → notifies participants |
| POST | `.../threads/:threadId/lock` | Moderate |
| POST | `.../threads/:threadId/pin` | Faculty pin |
| POST | `/api/v1/discussions/replies/:replyId/hide` | Hide reply |
| POST | `/api/v1/discussions/replies/:replyId/mark-answer` | Mark helpful |
| POST | `/api/v1/discussions/reports` | Report content |
| GET | `/api/v1/discussions/reports` | Moderator list |

Rate limits apply on create thread/reply and reports.

## Automated triggers (MVP)

1. **Announcement publish** → `notifyUser` for resolved audience (in-app + optional email)
2. **Discussion reply** → in-app notify prior participants on the thread

## Security

- Every document includes `tenantId`; queries filter tenant + soft-delete
- Students only see own notifications; cannot list others
- Course discussion requires enrollment (or faculty/admin)
- Moderation actions require `discussion:moderate`
- Bodies length-limited; frontend renders as text (no raw HTML)
- Delivery logs store provider mode / short errors — never dump full email secrets

## Frontend

- Header **notification bell** → live drawer (poll)
- `/notifications` — full list + preferences
- `/communication` — announcements feed + composer (staff)
- `/courses/:courseId/discussions` — course Q&A
- Main nav **Communication** (not “Soon”) for admin / faculty / student

## Enable email in development

```bash
# apps/api .env
EMAIL_PROVIDER_API_KEY=re_xxx
EMAIL_FROM="University LMS <noreply@yourdomain.com>"
```

Without the key, API still creates in-app rows and logs `[DEV MAIL]` for email attempts.
