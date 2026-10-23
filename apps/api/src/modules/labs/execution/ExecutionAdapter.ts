/**
 * Pluggable execution adapter interface.
 *
 * CRITICAL SECURITY: Student code MUST NEVER run inside the main API process.
 * - MockExecutionAdapter: deterministic fake results for local/dev only.
 * - DockerExecutionAdapter: skeleton that would spawn isolated containers
 *   (production MUST use a separate worker process / queue consumer).
 *
 * See docs/phase-11/README.md for production hardening requirements.
 */

import type {
  ExecutionJobInput,
  ExecutionStatusResult,
  ExecutionStatus,
  LabTestResult,
} from '@university-lms/shared';

export interface ExecutionAdapter {
  /** Enqueue a job for isolated execution. Returns the job id used by the adapter. */
  enqueue(job: ExecutionJobInput): Promise<{ jobId: string }>;
  /** Poll status / results for a job. */
  getStatus(jobId: string): Promise<ExecutionStatusResult>;
  /** Optional: cancel a running/queued job */
  cancel?(jobId: string): Promise<void>;
}

/** In-memory job store for mock + in-process queue simulation (dev only). */
export interface MockJobRecord {
  input: ExecutionJobInput;
  status: ExecutionStatus;
  result?: ExecutionStatusResult;
  createdAt: number;
}

const mockStore = new Map<string, MockJobRecord>();

/**
 * MockExecutionAdapter — local development only.
 * Does NOT execute real user code. Produces deterministic pass/fail based on
 * simple heuristics so UI + scoring paths can be tested safely.
 */
export class MockExecutionAdapter implements ExecutionAdapter {
  async enqueue(job: ExecutionJobInput): Promise<{ jobId: string }> {
    const jobId = job.jobId;
    mockStore.set(jobId, {
      input: job,
      status: 'queued',
      createdAt: Date.now(),
    });

    // Simulate async processing without blocking the request path
    setImmediate(() => {
      void this.processMock(jobId);
    });

    return { jobId };
  }

  async getStatus(jobId: string): Promise<ExecutionStatusResult> {
    const rec = mockStore.get(jobId);
    if (!rec) {
      return {
        jobId,
        status: 'failed',
        errorMessage: 'Job not found in mock executor',
      };
    }
    if (rec.result) return rec.result;
    return {
      jobId,
      status: rec.status,
    };
  }

  async cancel(jobId: string): Promise<void> {
    const rec = mockStore.get(jobId);
    if (rec && (rec.status === 'queued' || rec.status === 'running')) {
      rec.status = 'cancelled';
      rec.result = {
        jobId,
        status: 'cancelled',
        errorMessage: 'Cancelled',
      };
    }
  }

  private async processMock(jobId: string): Promise<void> {
    const rec = mockStore.get(jobId);
    if (!rec) return;

    rec.status = 'running';
    const start = Date.now();

    // Artificial delay so UI can show "running"
    await new Promise((r) => setTimeout(r, 400 + Math.random() * 600));

    const { input } = rec;
    const code = (input.code || '').trim();
    const testResults: LabTestResult[] = [];

    // Heuristic: empty code fails all; code containing "// PASS" or "# PASS" passes all;
    // otherwise alternate / hash-based pass for demo stability.
    const forcePass = /(?:\/\/|#)\s*PASS/i.test(code);
    const forceFail = /(?:\/\/|#)\s*FAIL/i.test(code) || code.length === 0;

    for (let i = 0; i < input.testCases.length; i++) {
      const tc = input.testCases[i];
      let passed = false;
      if (forceFail) passed = false;
      else if (forcePass) passed = true;
      else {
        // Stable pseudo-random from jobId + test id
        const hash = [...(jobId + tc.id)].reduce((a, c) => a + c.charCodeAt(0), 0);
        passed = hash % 3 !== 0; // ~2/3 pass for demo
      }

      testResults.push({
        testCaseId: tc.id,
        passed,
        actualOutput: passed ? tc.expectedOutput : `mock_output_${i}`,
        durationMs: 5 + (i % 20),
        score: passed ? tc.weight : 0,
      });
    }

    const allPassed = testResults.every((t) => t.passed);
    const anyFailed = testResults.some((t) => !t.passed);

    rec.status = forceFail && input.testCases.length === 0 ? 'failed' : 'succeeded';
    rec.result = {
      jobId,
      status: rec.status,
      stdout: allPassed
        ? 'Mock run OK\n'
        : anyFailed
          ? 'Mock run completed with failures\n'
          : 'Mock run completed\n',
      stderr: forceFail ? 'Mock: empty or FAIL marker in code\n' : null,
      exitCode: forceFail ? 1 : 0,
      testResults,
      durationMs: Date.now() - start,
      errorMessage: forceFail && code.length === 0 ? 'No code provided' : null,
    };
  }
}

/**
 * DockerExecutionAdapter skeleton.
 *
 * PRODUCTION REQUIREMENTS (do not skip):
 * - Run as a separate worker process (apps/lab-worker), not inside Express handlers.
 * - Use Docker (or gVisor / Firecracker) with:
 *   - network=none
 *   - read-only root filesystem
 *   - non-root user
 *   - memory + CPU + pids cgroup limits
 *   - seccomp / AppArmor profile
 *   - no privileged mode, no host mounts except a tmp workdir
 * - Language images: python:3.12-slim, node:20-slim, etc.
 * - Hard kill on timeout; never trust student code.
 *
 * This class is a stub that rejects execution until a real worker is wired.
 */
export class DockerExecutionAdapter implements ExecutionAdapter {
  async enqueue(_job: ExecutionJobInput): Promise<{ jobId: string }> {
    throw new Error(
      'DockerExecutionAdapter is a skeleton. Run apps/lab-worker with LAB_EXECUTOR=docker, ' +
        'or set LAB_EXECUTOR=mock for local development. Student code must not run in the API process.'
    );
  }

  async getStatus(jobId: string): Promise<ExecutionStatusResult> {
    return {
      jobId,
      status: 'failed',
      errorMessage: 'Docker executor not configured in this process',
    };
  }
}

let activeAdapter: ExecutionAdapter | null = null;

export function getExecutionAdapter(): ExecutionAdapter {
  if (activeAdapter) return activeAdapter;

  const mode = (process.env.LAB_EXECUTOR || 'mock').toLowerCase();
  if (mode === 'docker') {
    // Prefer external worker; fall back to skeleton that refuses in-process run
    activeAdapter = new DockerExecutionAdapter();
  } else {
    activeAdapter = new MockExecutionAdapter();
  }
  return activeAdapter;
}

export function setExecutionAdapter(adapter: ExecutionAdapter): void {
  activeAdapter = adapter;
}

/** Expose mock store size for health/diagnostics (dev) */
export function mockJobCount(): number {
  return mockStore.size;
}
