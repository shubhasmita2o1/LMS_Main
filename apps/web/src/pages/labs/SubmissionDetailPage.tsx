import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppLayout } from '../../components/layout/AppLayout';
import { labsApi } from '../../lib/labsApi';
import { useAuthStore } from '../../stores/authStore';
import type { LabSubmissionPublic } from '@university-lms/shared';
import { ArrowLeft, Loader2 } from 'lucide-react';

export function SubmissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const isStaff =
    user?.roles?.some((r) =>
      ['faculty', 'tenant_admin', 'university_admin', 'super_admin', 'department_head'].includes(r)
    ) ?? false;

  const [sub, setSub] = useState<LabSubmissionPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manualScore, setManualScore] = useState('');
  const [vivaScore, setVivaScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await labsApi.getSubmission(id);
      setSub(res.data.data);
      if (res.data.data.manualScore != null) setManualScore(String(res.data.data.manualScore));
      if (res.data.data.feedback) setFeedback(res.data.data.feedback);
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  const evaluate = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await labsApi.evaluate(id, {
        manualScore: manualScore === '' ? null : Number(manualScore),
        vivaScore: vivaScore === '' ? null : Number(vivaScore),
        feedback: feedback || null,
        totalScore: manualScore === '' ? null : Number(manualScore),
      });
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-12 flex justify-center text-slate-500 gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      </AppLayout>
    );
  }

  if (!sub) {
    return (
      <AppLayout>
        <div className="p-6 text-sm text-red-600">{error || 'Not found'}</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <Link
          to={`/labs/experiments/${sub.experimentId}`}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4" /> Experiment
        </Link>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
          <h1 className="text-lg font-bold text-slate-900">
            Submission · attempt {sub.attemptNumber}
          </h1>
          <p className="text-sm text-slate-600">
            Status: <strong>{sub.status}</strong>
            {sub.language ? ` · ${sub.language}` : ''}
            {sub.studentName ? ` · ${sub.studentName}` : ''}
          </p>
          {sub.autoScore != null && (
            <p className="text-sm">
              Auto: {sub.autoScore}
              {sub.manualScore != null ? ` · Manual: ${sub.manualScore}` : ''}
              {sub.totalScore != null ? ` · Total: ${sub.totalScore}` : ''}
            </p>
          )}
          {(sub.publicTotal ?? 0) > 0 && (
            <p className="text-xs text-slate-500">
              Public {sub.publicPassed}/{sub.publicTotal}
              {sub.hiddenTotal != null ? ` · Hidden ${sub.hiddenPassed}/${sub.hiddenTotal}` : ''}
            </p>
          )}
          {sub.code && (
            <pre className="text-xs bg-slate-50 border border-slate-100 rounded-xl p-3 overflow-x-auto max-h-64">
              {sub.code}
            </pre>
          )}
          {sub.feedback && (
            <div className="text-sm text-slate-700 border-t pt-3">
              <span className="font-medium">Feedback:</span> {sub.feedback}
            </div>
          )}
        </div>

        {isStaff && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
            <h2 className="font-semibold text-sm">Evaluate</h2>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs text-slate-500">
                Manual score
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={manualScore}
                  onChange={(e) => setManualScore(e.target.value)}
                  type="number"
                />
              </label>
              <label className="text-xs text-slate-500">
                Viva score
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={vivaScore}
                  onChange={(e) => setVivaScore(e.target.value)}
                  type="number"
                />
              </label>
            </div>
            <textarea
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm min-h-[80px]"
              placeholder="Feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
            <button
              type="button"
              disabled={saving}
              onClick={() => void evaluate()}
              className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save evaluation'}
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
