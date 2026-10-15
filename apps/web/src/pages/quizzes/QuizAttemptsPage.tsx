import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import type { ApiResponse, QuizAttemptPublic, QuizPublic } from '@university-lms/shared';

export function QuizAttemptsPage() {
  const { id } = useParams<{ id: string }>();

  const { data: quiz } = useQuery({
    queryKey: ['quiz', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<QuizPublic>>(`/quizzes/${id}`);
      return data.data!;
    },
  });

  const { data: attempts = [], isLoading } = useQuery({
    queryKey: ['quiz', id, 'attempts'],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<QuizAttemptPublic[]>>(`/quizzes/${id}/attempts`);
      return data.data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link to="/quizzes" className="text-sm text-slate-500">
            Quizzes
          </Link>
          <span className="text-slate-300">/</span>
          <h1 className="font-semibold text-slate-900">Attempts — {quiz?.title}</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl border divide-y">
          {isLoading && <p className="p-4 text-sm text-slate-500">Loading…</p>}
          {!isLoading && attempts.length === 0 && (
            <p className="p-4 text-sm text-slate-500">No attempts yet.</p>
          )}
          {attempts.map((a) => (
            <div key={a.id} className="p-4 flex justify-between gap-3 text-sm">
              <div>
                <p className="font-medium">{a.studentName || a.studentId}</p>
                <p className="text-xs text-slate-500">
                  Attempt {a.attemptNumber} · {a.status}
                  {a.submittedAt && ` · ${new Date(a.submittedAt).toLocaleString()}`}
                </p>
              </div>
              <div className="text-right">
                {a.totalMarksAwarded != null ? (
                  <p className="font-medium text-primary-700">
                    {a.totalMarksAwarded}
                    {quiz?.totalMarks != null ? ` / ${quiz.totalMarks}` : ''}
                    {a.percent != null ? ` (${a.percent}%)` : ''}
                  </p>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
