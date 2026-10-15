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
      <div className="min-h-screen bg-slate-50 p-8">
        <p className="text-red-600 text-sm">{error}</p>
        <Link to="/quizzes" className="text-sm text-primary-700 mt-4 inline-block">
          Back to quizzes
        </Link>
      </div>
    );
  }

  if (done && result) {
    const show =
      quiz?.showResults === 'after_submit' ||
      (quiz?.showResults === 'after_close' && quiz?.status === 'closed');
    return (
      <div className="min-h-screen bg-slate-50">
        <main className="max-w-xl mx-auto px-6 py-12 text-center space-y-4">
          <h1 className="text-xl font-semibold text-slate-900">Quiz submitted</h1>
          {show && result.totalMarksAwarded != null && (
            <p className="text-lg text-primary-700">
              Score: {result.totalMarksAwarded}
              {quiz?.totalMarks != null ? ` / ${quiz.totalMarks}` : ''}
              {result.percent != null ? ` (${result.percent}%)` : ''}
            </p>
          )}
          {!show && (
            <p className="text-sm text-slate-500">Results will be available later.</p>
          )}
          <Link to="/quizzes" className="text-sm text-primary-700">
            Back to quizzes
          </Link>
        </main>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 text-sm text-slate-500">Starting attempt…</div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <h1 className="font-semibold text-slate-900">Quiz attempt #{attempt.attemptNumber}</h1>
          {remaining != null && (
            <span
              className={`text-sm font-mono tabular-nums ${
                remaining < 60 ? 'text-red-600' : 'text-slate-700'
              }`}
            >
              {formatTime(remaining)}
            </span>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {questions.map((q, idx) => (
          <div key={q.id} className="bg-white rounded-xl border p-5 space-y-3">
            <div className="flex justify-between text-xs text-slate-500">
              <span>
                Q{idx + 1} · {q.type}
              </span>
              <span>{q.marks} marks</span>
            </div>
            <p className="text-sm text-slate-900 font-medium">{q.stem}</p>

            {['mcq', 'true_false'].includes(q.type) && (
              <div className="space-y-2">
                {(q.options || []).map((o) => (
                  <label key={o.key} className="flex gap-2 items-center text-sm cursor-pointer">
                    <input
                      type="radio"
                      name={q.id}
                      checked={answers[q.id] === o.key}
                      onChange={() => saveAnswer(q.id, o.key)}
                    />
                    <span>
                      {o.key}. {o.text}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {q.type === 'multi_select' && (
              <div className="space-y-2">
                {(q.options || []).map((o) => {
                  const arr = Array.isArray(answers[q.id]) ? (answers[q.id] as string[]) : [];
                  return (
                    <label key={o.key} className="flex gap-2 items-center text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={arr.includes(o.key)}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...arr, o.key]
                            : arr.filter((x) => x !== o.key);
                          saveAnswer(q.id, next);
                        }}
                      />
                      <span>
                        {o.key}. {o.text}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            {['fill_blank', 'numerical', 'short', 'long'].includes(q.type) && (
              <textarea
                className="w-full border rounded-lg px-3 py-2 text-sm"
                rows={q.type === 'long' ? 5 : 2}
                value={(answers[q.id] as string) || ''}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                onBlur={(e) => saveAnswer(q.id, e.target.value)}
              />
            )}
          </div>
        ))}

        <div className="flex justify-end gap-3 pb-12">
          <button
            className="px-5 py-2.5 rounded-lg bg-primary-600 text-white text-sm font-medium disabled:opacity-50"
            disabled={submitMut.isPending}
            onClick={() => {
              if (confirm('Submit quiz? You cannot change answers after submit.')) {
                submitMut.mutate();
              }
            }}
          >
            Submit quiz
          </button>
        </div>
      </main>
    </div>
  );
}
