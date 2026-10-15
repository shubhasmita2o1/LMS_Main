# Phase 9 — Assignments, Quiz & Question Bank

**Version:** 0.9.0  
**Status:** Complete (MVP)

## Backend modules

| Module | Path | Base route |
|--------|------|------------|
| Question bank | `apps/api/src/modules/question-bank` | `/api/v1/question-bank` |
| Assignments | `apps/api/src/modules/assignments` | `/api/v1/assignments` |
| Quizzes | `apps/api/src/modules/quizzes` | `/api/v1/quizzes` |

## Models

- QBankSubject / Unit / Topic / Question
- Assignment + AssignmentSubmission (late/resubmit/rubric/plagiarismScore)
- Quiz + QuizAttempt (timer, shuffle, auto-grade objective)

## Frontend

- `/question-bank`, `/assignments`, `/quizzes` (+ builder, take, attempts)

Marks fields ready for Phase 10 Gradebook.
