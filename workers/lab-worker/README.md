# Lab Worker (isolated execution)

**Phase 11 — Critical security boundary**

Student / untrusted code **must never** execute inside `apps/api` (the Express process).

## Architecture

```
Student browser → Main API (auth, validate, enqueue) → Queue / DB job row
                                                      ↓
                                              Lab Worker (this package)
                                                      ↓
                                              Results written to DB
```

## Modes

| Mode | Env | Behavior |
|------|-----|----------|
| `mock` | `LAB_EXECUTOR=mock` (default) | Deterministic fake pass/fail. **No real code runs.** Safe for local UI development. |
| `docker` | `LAB_EXECUTOR=docker` | Intended production path: claim `ExecutionJob` documents with `status=queued`, run language containers with hard limits, write results back. |

## Production hardening (required before real student code)

- Separate process / deployment from the web API (e.g. Kubernetes Job consumer, sidekiq-style worker).
- Docker (or gVisor / Firecracker):
  - `--network=none`
  - read-only root FS + tmpfs workdir
  - non-root user
  - memory, CPU, pids cgroup limits
  - seccomp + AppArmor/SELinux
  - no `--privileged`, no host volume mounts except ephemeral workdir
- Hard kill on timeout; discard containers after each run.
- Language images: `python:3.12-slim`, `node:20-slim`, etc. (java/c/cpp/sql as best-effort).
- Service-to-service auth when callback to API is used; prefer direct DB writes with worker credentials that cannot escalate tenant scope incorrectly.

## Local development

The main API embeds `MockExecutionAdapter` when `LAB_EXECUTOR` is unset or `mock`.  
You do **not** need to start this worker for Phase 11 acceptance with mock mode.

```bash
# API only (mock executor)
export LAB_EXECUTOR=mock
npm run dev:api
```

## Skeleton entry

`src/index.ts` documents the claim → run → complete loop. Wire Redis/BullMQ or Mongo change streams in a later hardening pass.
