# Phase 12 — Examination System

## Overview

Production-oriented multi-tenant examination module:

- Exam schedule, centers, invigilators, student allocation
- Online exam player: server-authoritative timer, autosave, navigation, flagging, auto-submit
- Question snapshots from Question Bank (publish freezes content)
- Randomization (question + option order per attempt)
- Negative marking for objective items
- Suspicion event logging (proctoring **hooks only** — no vendor webcam AI)
- Results gated by `showResultAfter` policy

## API base

`/api/v1/exams`

### Admin / faculty

| Method | Path | Notes |
|--------|------|--------|
| POST | `/exams` | Create draft |
| GET | `/exams` | List + filters |
| GET | `/exams/:id` | Detail |
| PATCH | `/exams/:id` | Update (draft) |
| POST | `/exams/:id/questions` | Attach bank questions (snapshot on save) |
| POST | `/exams/:id/publish` | Lock paper, scheduled/live |
| POST | `/exams/:id/close` | Close + auto-submit in-progress |
| POST | `/exams/:id/allocations` | Bulk allocate (`courseId` and/or `studentIds`) |
| GET | `/exams/:id/allocations` | List |
| POST/GET | `/exams/:id/invigilators` | Invigilators |
| GET | `/exams/:id/attempts` | Monitor |
| POST | `/exams/:id/attempts/:attemptId/manual-score` | Subjective marks |
| CRUD | `/exams/centers` | Exam centers |

### Student

| Method | Path | Notes |
|--------|------|--------|
| GET | `/exams/my` | Allocated exams |
| POST | `/exams/:id/attempts/start` | Creates attempt; `endsAt = min(now+duration, exam.endAt)` |
| GET | `/exams/:id/paper` | Active paper **without** correct answers |
| PATCH | `/exams/:id/attempts/:attemptId/answers` | Autosave |
| POST | `/exams/:id/attempts/:attemptId/flag` | Flag question |
| POST | `/exams/:id/attempts/:attemptId/submit` | Final submit (idempotent) |
| POST | `/exams/:id/attempts/:attemptId/events` | Suspicion events |
| GET | `/exams/:id/attempts/:attemptId/result` | Policy-gated |

## Security

- Every document includes `tenantId`; queries filter by tenant + soft-delete
- Students only access allocated exams; cannot read other students’ attempts
- Correct answers never sent on paper/start endpoints
- Publish freezes question snapshots so bank edits do not alter a live exam
- RBAC resource `exam` actions: `read` | `manage` | `invigilate` | `attempt`

## Proctoring extension points (hooks only)

Models already include:

- `ExamSuspicionEvent` (`tab_blur`, `fullscreen_exit`, `copy_paste`, `multiple_login`, `heartbeat_miss`, `other`)
- `ExamAttempt.suspicionScore` aggregate
- Optional `idVerificationStatus`, `proctorSessionId` fields for a future vendor

**Do not** integrate a paid proctoring vendor in Phase 12. Wire a third-party session id into `proctorSessionId` and stream events into `ExamSuspicionEvent` when ready.

## Frontend routes

- `/examinations` — role-aware list
- `/examinations/:id` — detail / question attach / attempts
- `/examinations/:id/allocate` — bulk allocation
- `/examinations/:id/attempt` — full-screen exam player

## Flow checklist

1. Admin creates draft exam (schedule, duration, settings)
2. Attach questions from Question Bank
3. Publish → snapshots locked, status scheduled/live
4. Allocate students (course enrollment or IDs)
5. Student starts attempt in window → timer from server `endsAt`
6. Autosave + flag + optional suspicion events
7. Submit or auto-submit on timeout → objective auto-score (+ negative marking)
8. Results according to `showResultAfter`

## Out of scope

- Full AI proctoring / forced webcam identity vendor
- OMR scanning for offline papers
- Gradebook rewrite (thin `exam` source hook can be added later)
- Phase 13+ modules
