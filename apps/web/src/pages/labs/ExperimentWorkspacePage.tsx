import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppLayout } from '../../components/layout/AppLayout';
import { labsApi } from '../../lib/labsApi';
import { useAuthStore } from '../../stores/authStore';
import type {
  ExperimentPublic,
  LabSubmissionPublic,
  LabLanguage,
  ExecutionJobPublic,
} from '@university-lms/shared';
import { ArrowLeft, Loader2, Play, Send, History } from 'lucide-react';

export function ExperimentWorkspacePage() {
  const { experimentId } = useParams<{ experimentId: string }>();
  const user = useAuthStore((s) => s.user);
  const isStaff =
    user?.roles?.some((r) =>
      ['faculty', 'tenant_admin', 'university_admin', 'super_admin', 'department_head'].includes(r)
    ) ?? false;

  const [experiment, setExperiment] = useState<ExperimentPublic | null>(null);
  const [language, setLanguage] = useState<LabLanguage>('python');
  const [code, setCode] = useState('');
  const [submissions, setSubmissions] = useState<LabSubmissionPublic[]>([]);
  const [latest, setLatest] = useState<LabSubmissionPublic | null>(null);
  const [job, setJob] = useState<ExecutionJobPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facultySubs, setFacultySubs] = useState<LabSubmissionPublic[]>([]);

  const load = useCallback(async () => {
    if (!experimentId) return;
    setLoading(true);
    try {
      const res = await labsApi.getExperiment(experimentId);
      const ex = res.data.data;
      setExperiment(ex);
      const langs = ex.allowedLanguages?.length ? ex.allowedLanguages : (['python'] as LabLanguage[]);
      const lang = langs[0];
      setLanguage(lang);
      setCode(ex.starterCode?.[lang] || '');

      if (isStaff) {
        const s = await labsApi.listSubmissions(experimentId, { limit: 30 });
        setFacultySubs(s.data.data.items);
      } else {
        const mine = await labsApi.mySubmissions(experimentId);
        setSubmissions(mine.data.data);
        if (mine.data.data[0]) setLatest(mine.data.data[0]);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'Failed to load experiment');
    } finally {
      setLoading(false);
    }
  }, [experimentId, isStaff]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!experiment) return;
    const starter = experiment.starterCode?.[language];
    if (starter != null) setCode(starter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  useEffect(() => {
    if (!latest?.executionJobId) return;
    if (latest.status !== 'running' && latest.status !== 'submitted') return;

    let cancelled = false;
    const tick = async () => {
      try {
        const res = await labsApi.getJob(latest.executionJobId!);
        if (cancelled) return;
        setJob(res.data.data);
        if (['succeeded', 'failed', 'timeout', 'cancelled'].includes(res.data.data.status)) {
          const mine = await labsApi.mySubmissions(experimentId!);
          if (!cancelled) {
            setSubmissions(mine.data.data);
            setLatest(mine.data.data[0] || null);
          }
        }
      } catch {
        /* ignore */
      }
    };
    void tick();
    const id = setInterval(() => void tick(), 1200);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [latest?.executionJobId, latest?.status, experimentId]);

  const onLanguageChange = (lang: LabLanguage) => {
    setLanguage(lang);
  };

  const submit = async () => {
    if (!experimentId) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await labsApi.submit(experimentId, {
        kind: 'code',
        language,
        code,
      });
      setLatest(res.data.data);
      const mine = await labsApi.mySubmissions(experimentId);
      setSubmissions(mine.data.data);
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-12 flex justify-center text-slate-500 gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading workspace…
        </div>
      </AppLayout>
    );
  }

  if (!experiment) {
    return (
      <AppLayout>
        <div className="p-6 text-sm text-red-600">{error || 'Experiment not found'}</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <Link to="/labs" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800">
              <ArrowLeft className="w-3 h-3" /> Labs
            </Link>
            <h1 className="text-lg font-bold text-slate-900 mt-1">{experiment.title}</h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>
              Limit {experiment.timeLimitSec}s · {experiment.memoryLimitMb}MB · max {experiment.maxScore}
            </span>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
            <h2 className="text-sm font-semibold text-slate-800">Problem</h2>
            <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {experiment.statement}
            </div>
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Public tests
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-slate-500 border-b">
                      <th className="py-1 pr-2">Input</th>
                      <th className="py-1 pr-2">Expected</th>
                      <th className="py-1">Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(experiment.testCases || [])
                      .filter((t) => t.visibility === 'public')
                      .map((t) => (
                        <tr key={t.id} className="border-b border-slate-50">
                          <td className="py-1 pr-2 font-mono">{t.input}</td>
                          <td className="py-1 pr-2 font-mono">{t.expectedOutput}</td>
                          <td className="py-1">{t.weight}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {(experiment.testCases || []).some((t) => t.visibility === 'hidden') && (
                <p className="text-xs text-slate-400 mt-2">
                  Hidden tests exist (expected output not shown). Pass/fail counts appear after scoring.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2 justify-between">
              <select
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                value={language}
                onChange={(e) => onLanguageChange(e.target.value as LabLanguage)}
              >
                {(experiment.allowedLanguages || ['python']).map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
              {!isStaff && (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void submit()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-sm font-semibold disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Submit
                </button>
              )}
            </div>
            <textarea
              className="w-full min-h-[280px] rounded-xl border border-slate-200 bg-slate-50 font-mono text-sm p-3 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              placeholder="// Write your code here"
            />
            <p className="text-[11px] text-slate-400">
              Execution is isolated (never runs inside the main API). Mock mode uses deterministic results;
              tip: include # PASS or // PASS for all tests pass in mock.
            </p>
          </div>
        </div>

        {!isStaff && latest && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Play className="w-4 h-4" /> Latest attempt #{latest.attemptNumber}
              <span className="font-normal text-slate-500">· {latest.status}</span>
              {latest.executionJobId && job && (
                <span className="font-normal text-slate-500">· job {job.status}</span>
              )}
            </div>
            {latest.autoScore != null && (
              <p className="text-sm">
                Auto score: <strong>{latest.autoScore}</strong>
                {latest.totalScore != null ? ` · Total: ${latest.totalScore}` : ''}
              </p>
            )}
            {(latest.publicTotal ?? 0) > 0 && (
              <p className="text-xs text-slate-600">
                Public tests: {latest.publicPassed}/{latest.publicTotal}
                {latest.hiddenTotal != null
                  ? ` · Hidden: ${latest.hiddenPassed}/${latest.hiddenTotal}`
                  : ''}
              </p>
            )}
            {latest.testResults && latest.testResults.length > 0 && (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-500 border-b">
                    <th className="py-1">Test</th>
                    <th className="py-1">Result</th>
                    <th className="py-1">Output</th>
                  </tr>
                </thead>
                <tbody>
                  {latest.testResults.map((r) => (
                    <tr key={r.testCaseId} className="border-b border-slate-50">
                      <td className="py-1 font-mono">{r.testCaseId}</td>
                      <td className="py-1">
                        <span className={r.passed ? 'text-emerald-600' : 'text-red-600'}>
                          {r.passed ? 'PASS' : 'FAIL'}
                        </span>
                      </td>
                      <td className="py-1 font-mono truncate max-w-[200px]">{r.actualOutput}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <Link
              to={`/labs/submissions/${latest.id}`}
              className="text-xs text-primary-600 hover:underline"
            >
              Open submission detail →
            </Link>
          </div>
        )}

        {!isStaff && submissions.length > 1 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold flex items-center gap-1 mb-2">
              <History className="w-4 h-4" /> Attempt history
            </h3>
            <ul className="text-xs space-y-1">
              {submissions.map((s) => (
                <li key={s.id}>
                  <Link to={`/labs/submissions/${s.id}`} className="text-primary-600 hover:underline">
                    #{s.attemptNumber}
                  </Link>{' '}
                  · {s.status}
                  {s.totalScore != null ? ` · ${s.totalScore}` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}

        {isStaff && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
            <h3 className="text-sm font-semibold">Faculty — submissions</h3>
            {facultySubs.length === 0 ? (
              <p className="text-xs text-slate-500">No submissions yet.</p>
            ) : (
              <ul className="text-sm space-y-1">
                {facultySubs.map((s) => (
                  <li key={s.id} className="flex justify-between gap-2 border-b border-slate-50 py-1">
                    <Link to={`/labs/submissions/${s.id}`} className="text-primary-600 hover:underline">
                      {s.studentName || s.studentId} · attempt {s.attemptNumber}
                    </Link>
                    <span className="text-xs text-slate-500">
                      {s.status}
                      {s.totalScore != null ? ` · ${s.totalScore}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
