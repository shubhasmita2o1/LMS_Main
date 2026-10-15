import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type { ApiResponse, QuizPublic, CourseListItem } from '@university-lms/shared';
import { useAuthStore } from '../../stores/authStore';

export function QuizzesPage() {
  const user = useAuthStore((s) => s.user);
  const [courseId, setCourseId] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(30);
  const qc = useQueryClient();

  const canManage = user?.roles?.some((r) =>
    ['faculty', 'tenant_admin', 'university_admin', 'super_admin'].includes(r)
  );

  const { data: courses = [] } = useQuery({
    queryKey: ['courses', 'for-quiz'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CourseListItem[]>>('/courses', {
        params: { limit: 100 },
      });
      return data.data ?? [];
    },
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['quizzes', courseId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<QuizPublic[]>>('/quizzes', {
        params: { limit: 50, courseId: courseId || undefined },
      });
      return data.data ?? [];
    },
  });

  const createMut = useMutation({
    mutationFn: async () => {
      await api.post('/quizzes', {
        courseId,
        title,
        durationMinutes: duration,
        maxAttempts: 1,
        status: 'draft',
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quizzes'] });
      setShowCreate(false);
      setTitle('');
    },
  });

  const publishMut = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/quizzes/${id}/publish`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quizzes'] }),
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link to="/dashboard" className="text-sm text-slate-500 hover:text-slate-800">
            Dashboard
          </Link>
          <span className="text-slate-300">/</span>
          <h1 className="font-semibold text-slate-900">Quizzes</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="flex flex-wrap gap-3 items-center">
          <select
            className="border rounded-lg px-3 py-2 text-sm min-w-[200px]"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
          >
            <option value="">All courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
          {canManage && (
            <button
              className="ml-auto px-4 py-2 text-sm rounded-lg bg-primary-600 text-white"
              onClick={() => setShowCreate((v) => !v)}
            >
              {showCreate ? 'Cancel' : 'New Quiz'}
            </button>
          )}
        </div>

        {showCreate && canManage && (
          <div className="bg-white border rounded-xl p-5 space-y-3">
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="Quiz title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="flex gap-3 items-center text-sm">
              <label>Duration (min)</label>
              <input
                type="number"
                className="border rounded-lg px-3 py-2 w-24"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
            </div>
            <button
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm disabled:opacity-50"
              disabled={!courseId || !title || createMut.isPending}
              onClick={() => createMut.mutate()}
            >
              Create draft
            </button>
          </div>
        )}

        <div className="bg-white rounded-xl border divide-y">
          {isLoading && <p className="p-4 text-sm text-slate-500">Loading…</p>}
          {!isLoading && items.length === 0 && (
            <p className="p-4 text-sm text-slate-500">No quizzes.</p>
          )}
          {items.map((q) => (
            <div key={q.id} className="p-4 flex flex-wrap gap-3 justify-between items-center">
              <div>
                <Link
                  to={`/quizzes/${q.id}`}
                  className="font-medium text-slate-900 hover:text-primary-700"
                >
                  {q.title}
                </Link>
                <div className="text-xs text-slate-500 mt-1 flex gap-2">
                  <span className="uppercase">{q.status}</span>
                  <span>{q.totalMarks} marks</span>
                  {q.durationMinutes && <span>{q.durationMinutes} min</span>}
                  <span>{q.questions?.length || 0} questions</span>
                </div>
              </div>
              <div className="flex gap-2">
                {canManage && (
                  <Link
                    to={`/quizzes/${q.id}/builder`}
                    className="text-sm px-3 py-1.5 rounded-lg border"
                  >
                    Builder
                  </Link>
                )}
                {canManage && q.status === 'draft' && (
                  <button
                    className="text-sm px-3 py-1.5 rounded-lg border"
                    onClick={() => publishMut.mutate(q.id)}
                  >
                    Publish
                  </button>
                )}
                {canManage && (
                  <Link
                    to={`/quizzes/${q.id}/attempts`}
                    className="text-sm px-3 py-1.5 rounded-lg border"
                  >
                    Attempts
                  </Link>
                )}
                {q.status === 'published' && (
                  <Link
                    to={`/quizzes/${q.id}/take`}
                    className="text-sm px-3 py-1.5 rounded-lg bg-primary-600 text-white"
                  >
                    Take quiz
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
