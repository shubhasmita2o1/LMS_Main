import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import api from '../../lib/api';
import type {
  ApiResponse,
  QuizAttemptPublic,
  QuestionSafePublic,
  QuizPublic,
} from '@university-lms/shared';

export function QuizTakePage() {
  const { id } = useParams<{ id: string }>();
  const [attempt, setAttempt] = useState<QuizAttemptPublic | null>(null);
  const [quiz, setQuiz] = useState<QuizPublic | null>(null);
  const [questions, setQuestions] = useState<QuestionSafePublic[]>([]);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [remaining, setRemaining] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<QuizAttemptPublic | null>(null);

  const startMut = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<
        ApiResponse<{ attempt: QuizAttemptPublic; questions: QuestionSafePublic[] }>
      >(`/quizzes/${id}/start`);
      return data.data!;
    },
    onSuccess: (data) => {
      setAttempt(data.attempt);
      setQuestions(data.questions || []);
      const ans: Record<string, string | string[]> = {};
      for (const a of data.attempt.answers || []) {
        if (a.response != null) ans[a.questionId] = a.response as any;
      }
      setAnswers(ans);
      if (data.attempt.expiresAt) {
        const ms = new Date(data.attempt.expiresAt).getTime() - Date.now();
        setRemaining(Math.max(0, Math.floor(ms / 1000)));
      }
    },
    onError: (e: any) => {
      setError(e?.response?.data?.error?.message || e.message || 'Failed to start');
    },
  });

  useEffect(() => {
    startMut.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const saveAnswer = useCallback(
    async (questionId: string, response: string | string[]) => {
      if (!attempt) return;
      setAnswers((prev) => ({ ...prev, [questionId]: response }));
      try {
        await api.post(`/quizzes/attempts/${attempt.id}/answer`, {
          answers: [{ questionId, response }],
        });
      } catch {
        /* keep local */
      }
    },
    [attempt]
  );

  const submitMut = useMutation({
    mutationFn: async () => {
      if (!attempt) throw new Error('No attempt');
      const { data } = await api.post<
        ApiResponse<{ attempt: QuizAttemptPublic; quiz: QuizPublic }>
      >(`/quizzes/attempts/${attempt.id}/submit`);
      return data.data!;
    },
    onSuccess: (data) => {
      setDone(true);
      setResult(data.attempt);
      setQuiz(data.quiz);
    },
  });

  // Timer
  useEffect(() => {
    if (remaining == null || done) return;
    if (remaining <= 0) {
      submitMut.mutate();
      return;
    }
    const t = setInterval(() => {
      setRemaining((r) => (r == null ? null : Math.max(0, r - 1)));
    }, 1000);
    return () => clearInterval(t);
  }, [remaining, done]); // eslint-disable-line

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#F3F5F7] p-8 flex items-center justify-center">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-card text-center border border-slate-100">
          <p className="text-rose-600 text-sm font-semibold mb-4">{error}</p>
          <Link
            to="/quizzes"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-xs font-bold text-white bg-[#165239] hover:bg-[#12422e] transition shadow-2xs"
          >
            Back to quizzes
          </Link>
        </div>
      </div>
    );
  }

  if (done && result) {
    const show =
      quiz?.showResults === 'after_submit' ||
      (quiz?.showResults === 'after_close' && quiz?.status === 'closed');
    return (
      <div className="min-h-screen bg-[#F3F5F7] flex items-center justify-center p-6">
        <main className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-card text-center space-y-4 border border-slate-100">
          <div className="w-12 h-12 rounded-full bg-[#eaf5ee] text-[#165239] flex items-center justify-center mx-auto mb-2 text-xl font-bold">
            ✓
          </div>
          <h1 className="text-xl font-bold text-slate-900">Quiz submitted</h1>
          {show && result.totalMarksAwarded != null && (
            <p className="text-base font-bold text-[#165239] bg-[#f0f7f4] py-2 px-4 rounded-full inline-block">
              Score: {result.totalMarksAwarded}
              {quiz?.totalMarks != null ? ` / ${quiz.totalMarks}` : ''}
              {result.percent != null ? ` (${result.percent}%)` : ''}
            </p>
          )}
          {!show && (
            <p className="text-xs text-slate-500 font-medium">Results will be available once evaluated.</p>
          )}
          <div>
            <Link
              to="/quizzes"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-xs font-bold text-white bg-[#165239] hover:bg-[#12422e] transition shadow-2xs"
            >
              Back to quizzes
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="min-h-screen bg-[#F3F5F7] flex items-center justify-center text-sm font-medium text-slate-400">
        Starting attempt…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F5F7] py-6 px-4 sm:px-6">
      <header className="max-w-3xl mx-auto bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-card px-6 h-16 flex items-center justify-between sticky top-4 z-20">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Live Assessment</span>
          <h1 className="text-sm sm:text-base font-bold text-slate-900">Attempt #{attempt.attemptNumber}</h1>
        </div>
        {remaining != null && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400">Time Left:</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-mono font-bold tabular-nums ${
                remaining < 60
                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                  : 'bg-[#eaf5ee] text-[#165239] border border-[#c2decf]/60'
              }`}
            >
              {formatTime(remaining)}
            </span>
          </div>
        )}
      </header>

      <main className="max-w-3xl mx-auto py-6 space-y-5">
        {questions.map((q, idx) => (
          <div key={q.id} className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] uppercase">
                Q{idx + 1} · {q.type.replace('_', ' ')}
              </span>
              <span className="font-semibold text-slate-500 text-xs">{q.marks} marks</span>
            </div>
            <p className="text-sm text-slate-900 font-semibold leading-relaxed">{q.stem}</p>

            {['mcq', 'true_false'].includes(q.type) && (
              <div className="space-y-2.5 pt-1">
                {(q.options || []).map((o) => {
                  const isSelected = answers[q.id] === o.key;
                  return (
                    <label
                      key={o.key}
                      className={`flex items-center gap-3 p-3 rounded-2xl border text-xs font-medium cursor-pointer transition ${
                        isSelected
                          ? 'border-[#165239] bg-[#eaf5ee]/50 text-[#165239] font-bold'
                          : 'border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        className="text-[#165239] focus:ring-[#165239]"
                        checked={isSelected}
                        onChange={() => saveAnswer(q.id, o.key)}
                      />
                      <span>
                        <span className="font-bold mr-1">{o.key}.</span> {o.text}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            {q.type === 'multi_select' && (
              <div className="space-y-2.5 pt-1">
                {(q.options || []).map((o) => {
                  const arr = Array.isArray(answers[q.id]) ? (answers[q.id] as string[]) : [];
                  const isChecked = arr.includes(o.key);
                  return (
                    <label
                      key={o.key}
                      className={`flex items-center gap-3 p-3 rounded-2xl border text-xs font-medium cursor-pointer transition ${
                        isChecked
                          ? 'border-[#165239] bg-[#eaf5ee]/50 text-[#165239] font-bold'
                          : 'border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="rounded text-[#165239] focus:ring-[#165239]"
                        checked={isChecked}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...arr, o.key]
                            : arr.filter((x) => x !== o.key);
                          saveAnswer(q.id, next);
                        }}
                      />
                      <span>
                        <span className="font-bold mr-1">{o.key}.</span> {o.text}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            {['fill_blank', 'numerical', 'short', 'long'].includes(q.type) && (
              <textarea
                className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#165239] focus:border-[#165239] bg-slate-50/40"
                rows={q.type === 'long' ? 5 : 2}
                placeholder="Type your response here..."
                value={(answers[q.id] as string) || ''}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                onBlur={(e) => saveAnswer(q.id, e.target.value)}
              />
            )}
          </div>
        ))}

        <div className="flex justify-end gap-3 pb-12 pt-2">
          <button
            className="px-6 py-3 rounded-full bg-[#165239] hover:bg-[#12422e] text-white text-xs font-bold transition shadow-card disabled:opacity-50"
            disabled={submitMut.isPending}
            onClick={() => {
              if (confirm('Submit quiz? You cannot change answers after submit.')) {
                submitMut.mutate();
              }
            }}
          >
            {submitMut.isPending ? 'Submitting…' : 'Submit Quiz'}
          </button>
        </div>
      </main>
    </div>
  );
}
