import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
  startAttempt,
  saveAnswers,
  submitAttempt,
  logSuspicion,
  getResult,
} from '../../lib/examsApi';
import type { ExamPaperPublic, ExamResultPublic } from '@university-lms/shared';
import { Flag, ChevronLeft, ChevronRight, Loader2, Clock } from 'lucide-react';

export function ExamAttemptPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [paper, setPaper] = useState<ExamPaperPublic | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [remaining, setRemaining] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<ExamResultPublic | null>(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const startMut = useMutation({
    mutationFn: () => startAttempt(id),
    onSuccess: (data) => {
      setPaper(data);
      setAnswers({});
      setFlagged({});
      const ms = new Date(data.endsAt).getTime() - Date.now();
      setRemaining(Math.max(0, Math.floor(ms / 1000)));
    },
    onError: (e: any) => {
      setError(e?.response?.data?.error?.message || e.message || 'Cannot start exam');
    },
  });

  useEffect(() => {
    startMut.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (remaining == null || done) return;
    if (remaining <= 0) {
      submitMut.mutate(true);
      return;
    }
    const t = setInterval(() => {
      setRemaining((r) => (r == null ? null : Math.max(0, r - 1)));
    }, 1000);
    return () => clearInterval(t);
  }, [remaining, done]); // eslint-disable-line

  useEffect(() => {
    if (!paper || done) return;
    const t = setInterval(() => {
      const ms = new Date(paper.endsAt).getTime() - Date.now();
      setRemaining(Math.max(0, Math.floor(ms / 1000)));
    }, 30000);
    return () => clearInterval(t);
  }, [paper, done]);

  useEffect(() => {
    if (!paper || done) return;
    const onBlur = () => {
      logSuspicion(id, paper.attemptId, { type: 'tab_blur' }).catch(() => {});
    };
    window.addEventListener('blur', onBlur);
    return () => window.removeEventListener('blur', onBlur);
  }, [paper, done, id]);

  const persist = useCallback(
    async (qid: string, response?: string | string[], flag?: boolean) => {
      if (!paper) return;
      setSaving(true);
      try {
        await saveAnswers(id, paper.attemptId, [
          { questionId: qid, response, flagged: flag },
        ]);
        setLastSaved(new Date());
      } catch (e: any) {
        const code = e?.response?.data?.error?.code;
        if (code === 'AUTO_SUBMITTED' || code === 'TIME_UP') setDone(true);
      } finally {
        setSaving(false);
      }
    },
    [paper, id]
  );

  useEffect(() => {
    if (!paper || done) return;
    const sec = paper.settings.autosaveIntervalSec || 30;
    const t = setInterval(() => {
      const entries = Object.entries(answers).map(([questionId, response]) => ({
        questionId,
        response,
        flagged: flagged[questionId],
      }));
      if (entries.length) {
        saveAnswers(id, paper.attemptId, entries)
          .then(() => setLastSaved(new Date()))
          .catch(() => {});
      }
    }, sec * 1000);
    return () => clearInterval(t);
  }, [paper, answers, flagged, done, id]);

  const submitMut = useMutation({
    mutationFn: async (_auto?: boolean) => {
      if (!paper) throw new Error('No paper');
      const entries = Object.entries(answers).map(([questionId, response]) => ({
        questionId,
        response,
        flagged: flagged[questionId],
      }));
      if (entries.length) {
        try {
          await saveAnswers(id, paper.attemptId, entries);
        } catch {
          /* proceed */
        }
      }
      return submitAttempt(id, paper.attemptId);
    },
    onSuccess: async (att) => {
      setDone(true);
      try {
        const res = await getResult(id, att.id);
        setResult(res);
      } catch {
        setResult({
          attemptId: att.id,
          examId: id,
          status: att.status,
          marksObtained: att.marksObtained ?? 0,
          totalMarks: paper?.questions.reduce((s, q) => s + q.marks, 0) || 0,
          showBreakdown: false,
        });
      }
    },
  });

  const questions = paper?.questions || [];
  const current = questions[idx];

  const palette = useMemo(() => {
    return questions.map((q, i) => {
      const answered = answers[q.questionId] != null && answers[q.questionId] !== '';
      const isFlagged = !!flagged[q.questionId];
      return { i, answered, isFlagged, current: i === idx };
    });
  }, [questions, answers, flagged, idx]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md rounded-2xl border bg-white p-6 text-center shadow">
          <p className="text-sm font-semibold text-red-600">{error}</p>
          <button
            type="button"
            className="mt-4 text-sm text-primary-600"
            onClick={() => navigate('/examinations')}
          >
            Back to examinations
          </button>
        </div>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Preparing exam…
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow">
          <h1 className="text-lg font-bold text-slate-900">Exam submitted</h1>
          <p className="mt-1 text-sm text-slate-500">Your responses have been recorded.</p>
          {result && (
            <div className="mt-4 rounded-lg bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">
                Score: {result.marksObtained} / {result.totalMarks}
              </p>
              <p className="text-xs capitalize text-slate-500">Status: {result.status}</p>
            </div>
          )}
          <button
            type="button"
            className="mt-6 w-full rounded-lg bg-primary-600 py-2 text-sm font-semibold text-white"
            onClick={() => navigate('/examinations')}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-white px-4 py-3 shadow-sm">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">{paper.title}</p>
          <p className="text-[11px] text-slate-500">
            {paper.code} · Attempt #{paper.attemptNumber}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 font-mono text-sm font-bold text-white">
            <Clock className="h-3.5 w-3.5" />
            {remaining != null ? formatTime(remaining) : '—'}
          </span>
          <span className="text-[11px] text-slate-400">
            {saving ? 'Saving…' : lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : '—'}
          </span>
          <button
            type="button"
            onClick={() => setConfirmSubmit(true)}
            className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white"
          >
            Submit
          </button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-4 lg:flex-row">
        <aside className="lg:w-48">
          <div className="rounded-xl border bg-white p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase text-slate-400">Questions</p>
            <div className="grid grid-cols-5 gap-1.5 lg:grid-cols-4">
              {palette.map((p) => (
                <button
                  key={p.i}
                  type="button"
                  onClick={() => setIdx(p.i)}
                  className={`relative h-8 rounded text-xs font-bold ${
                    p.current
                      ? 'bg-primary-600 text-white'
                      : p.answered
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {p.i + 1}
                  {p.isFlagged && (
                    <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber-500" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex-1 rounded-xl border bg-white p-5 shadow-sm">
          {current && (
            <>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">
                    Question {idx + 1} of {questions.length} · {current.marks} mark
                    {current.marks !== 1 ? 's' : ''} · {current.type}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm font-medium text-slate-900">
                    {current.stem}
                  </p>
                </div>
                {paper.settings.allowFlagging && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = !flagged[current.questionId];
                      setFlagged((f) => ({ ...f, [current.questionId]: next }));
                      persist(current.questionId, answers[current.questionId], next);
                    }}
                    className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-semibold ${
                      flagged[current.questionId]
                        ? 'border-amber-300 bg-amber-50 text-amber-800'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <Flag className="h-3.5 w-3.5" />
                    Flag
                  </button>
                )}
              </div>

              {(current.type === 'mcq' || current.type === 'true_false') && (
                <div className="space-y-2">
                  {(current.options || []).map((o) => (
                    <label
                      key={o.key}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm ${
                        answers[current.questionId] === o.key
                          ? 'border-primary-300 bg-primary-50'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name={current.questionId}
                        checked={answers[current.questionId] === o.key}
                        onChange={() => {
                          setAnswers((a) => ({ ...a, [current.questionId]: o.key }));
                          persist(current.questionId, o.key, flagged[current.questionId]);
                        }}
                      />
                      <span>{o.text}</span>
                    </label>
                  ))}
                </div>
              )}

              {current.type === 'multi_select' && (
                <div className="space-y-2">
                  {(current.options || []).map((o) => {
                    const selected = Array.isArray(answers[current.questionId])
                      ? (answers[current.questionId] as string[])
                      : [];
                    const checked = selected.includes(o.key);
                    return (
                      <label
                        key={o.key}
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm ${
                          checked ? 'border-primary-300 bg-primary-50' : 'border-slate-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const next = checked
                              ? selected.filter((k) => k !== o.key)
                              : [...selected, o.key];
                            setAnswers((a) => ({ ...a, [current.questionId]: next }));
                            persist(current.questionId, next, flagged[current.questionId]);
                          }}
                        />
                        <span>{o.text}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {['short', 'long', 'fill_blank', 'numerical'].includes(current.type) && (
                <textarea
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  rows={current.type === 'long' ? 8 : 3}
                  value={(answers[current.questionId] as string) || ''}
                  onChange={(e) =>
                    setAnswers((a) => ({ ...a, [current.questionId]: e.target.value }))
                  }
                  onBlur={(e) =>
                    persist(current.questionId, e.target.value, flagged[current.questionId])
                  }
                  placeholder="Type your answer…"
                />
              )}

              <div className="mt-6 flex justify-between">
                <button
                  type="button"
                  disabled={idx === 0 || !paper.settings.allowNavigation}
                  onClick={() => setIdx((i) => Math.max(0, i - 1))}
                  className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </button>
                <button
                  type="button"
                  disabled={idx >= questions.length - 1 || !paper.settings.allowNavigation}
                  onClick={() => setIdx((i) => Math.min(questions.length - 1, i + 1))}
                  className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </main>
      </div>

      {confirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-base font-bold text-slate-900">Submit exam?</h2>
            <p className="mt-2 text-sm text-slate-600">
              You have answered{' '}
              {Object.keys(answers).filter((k) => answers[k] != null && answers[k] !== '').length}{' '}
              of {questions.length} questions. This cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-sm text-slate-600"
                onClick={() => setConfirmSubmit(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white"
                disabled={submitMut.isPending}
                onClick={() => {
                  setConfirmSubmit(false);
                  submitMut.mutate(false);
                }}
              >
                {submitMut.isPending ? 'Submitting…' : 'Confirm submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
