# Phase 5 — Student Information System

**Version:** 0.5.0

## Backend `/api/v1/students`

- CRUD + soft delete
- Search / filter / pagination
- Status change + enroll
- Documents metadata
- Bulk create + export CSV/JSON
- Stats
- `GET /me` for linked student user
- Plan limit `activeStudents` on create

## Frontend

- `/students` list
- `/students/new`, `/students/:id/edit`
- `/students/:id` detail
- `/students/me` self profile

## Models

- Student (guardians, emergency, previous education embedded)
- StudentDocument (separate collection)
