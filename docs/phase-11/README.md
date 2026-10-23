# Phase 11 — Practical & Lab Platform

**Version:** 0.11.0  
**Status:** Implemented (mock executor for local; Docker worker skeleton for production path)

## Security model (non-negotiable)

```
Student browser → Main API (auth, enqueue only) → Queue / ExecutionJob
                                                      ↓
                                              Lab Worker / Mock adapter
                                                      ↓
                                                   Results DB
```

- **Never** run student code inside Express request handlers or the main API process.
- API creates `LabSubmission` + `ExecutionJob`, calls `ExecutionAdapter.enqueue`.
- `MockExecutionAdapter` (default `LAB_EXECUTOR=mock`): deterministic fake results; **no real code execution**.
- `DockerExecutionAdapter` / `workers/lab-worker`: production path skeleton — refuses in-process run.

### Production hardening checklist

- [ ] Deploy worker as separate service
- [ ] Docker: `--network=none`, read-only FS, non-root, memory/CPU/pids limits, seccomp
- [ ] Hard timeout kill
- [ ] No host mounts except ephemeral workdir
- [ ] Rate limits on submit/requeue (implemented)
- [ ] Hidden test `expectedOutput` never returned to students (implemented)

## Domain hierarchy

`Practical` → `Lab` → `Experiment` → `LabSubmission` / `ExecutionJob` / `LabEvaluation`

## API base

`/api/v1/labs`

| Area | Methods |
|------|---------|
| Practicals | `GET/POST /practicals`, `GET/PATCH/DELETE /practicals/:id`, `POST .../publish` |
| Labs | `GET /practicals/:id/labs`, `POST /labs`, `PATCH/DELETE /labs/:id` |
| Experiments | `GET /labs/:id/experiments`, `POST /experiments`, `GET/PATCH/DELETE /experiments/:id`, `PUT .../test-cases` |
| Submissions | `POST /experiments/:id/submissions`, `GET .../my-submissions`, `GET .../submissions` (faculty), `GET /submissions/:id`, `POST .../evaluate`, `POST .../requeue` |
| Jobs | `GET /executions/:jobId` |

## Env

| Variable | Default | Notes |
|----------|---------|-------|
| `LAB_EXECUTOR` | `mock` | `mock` \| `docker` |

## Gradebook hook

Submissions store `autoScore` / `manualScore` / `totalScore`. Digital lab records accumulate best scores per experiment. Phase 10 gradebook can later ingest practical components without rewriting this module.

## Frontend routes

- `/labs` — practical list (role-aware)
- `/labs/:practicalId` — labs
- `/labs/:practicalId/labs/:labId` — experiments
- `/labs/experiments/:experimentId` — student workspace
- `/labs/submissions/:id` — result / faculty evaluation
