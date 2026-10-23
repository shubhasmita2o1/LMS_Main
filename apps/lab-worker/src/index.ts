/**
 * Lab worker skeleton — claim queued ExecutionJobs and run them in isolation.
 *
 * This process is intentionally separate from apps/api.
 * Do not import Express route handlers here.
 *
 * Production: implement Docker runner with network=none, cgroup limits, non-root.
 * Dev: prefer LAB_EXECUTOR=mock inside the API (MockExecutionAdapter).
 */

console.log(`[lab-worker] Starting (mode=${process.env.LAB_EXECUTOR || 'unset'})`);
console.log(
  '[lab-worker] Skeleton only. Wire Mongo claim loop + Docker runner before production use.'
);
console.log(
  '[lab-worker] See apps/lab-worker/README.md and docs/phase-11/README.md for hardening checklist.'
);

// Placeholder poll loop (no-op until Docker runner is implemented)
const intervalMs = Number(process.env.LAB_WORKER_POLL_MS || 5000);

setInterval(() => {
  // Future:
  // 1. Find ExecutionJob { status: 'queued' } with findOneAndUpdate → 'running'
  // 2. Spawn language container with limits
  // 3. Compare stdout to test cases
  // 4. Write testResults, status, scores back to ExecutionJob + LabSubmission
  // NEVER eval() code in this Node process either — always containerize.
}, intervalMs);

process.on('SIGTERM', () => {
  console.log('[lab-worker] Shutting down');
  process.exit(0);
});
