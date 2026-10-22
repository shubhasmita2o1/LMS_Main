import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type { ApiResponse, AssignmentPublic, CourseListItem } from '@university-lms/shared';
import { useAuthStore } from '../../stores/authStore';
import { AppLayout } from '../../components/layout/AppLayout';

export function AssignmentsPage() {
  const user = useAuthStore((s) => s.user);
  const [params] = useSearchParams();
  const courseIdParam = params.get('courseId') || '';
  const [courseId, setCourseId] = useState(courseIdParam);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [maxMarks, setMaxMarks] = useState(100);
  const [dueAt, setDueAt] = useState('');
  const qc = useQueryClient();

  const canManage = user?.roles?.some((r) =>
    ['faculty', 'tenant_admin', 'university_admin', 'super_admin'].includes(r)
  );

  const { data: courses = [] } = useQuery({
    queryKey: ['courses', 'for-assign'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CourseListItem[]>>('/courses', {
        params: { limit: 100, status: 'active' },
      });
      return data.data ?? [];
    },
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['assignments', courseId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<AssignmentPublic[]>>('/assignments', {
        params: { limit: 50, courseId: courseId || undefined },
      });
      return data.data ?? [];
    },
  });

  const createMut = useMutation({
    mutationFn: async () => {
      if (!courseId) throw new Error('Select course');
      await api.post('/assignments', {
        courseId,
        title,
        maxMarks,
        dueAt: dueAt ? new Date(dueAt).toISOString() : null,
        status: 'draft',
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignments'] });
      setShowCreate(false);
      setTitle('');
    },
  });

  const publishMut = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/assignments/${id}/publish`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assignments'] }),
  });

  return (
    <AppLayout>
      <div className="space-y-6 pb-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Assignments &amp; Tasks</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Course homework, practical assignments, and student submissions
            </p>
          </div>
          {canManage && (
            <button
              className="px-4 py-2 text-xs font-bold rounded-xl bg-primary-600 text-white hover:bg-primary-700 shadow-sm transition"
              onClick={() => setShowCreate((v) => !v)}
            >
              {showCreate ? 'Cancel' : '+ New Assignment'}
            </button>
          )}
        </div>
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
              {showCreate ? 'Cancel' : 'New Assignment'}
            </button>
          )}
        </div>

        {showCreate && canManage && (
          <div className="bg-white border rounded-xl p-5 space-y-3">
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="flex gap-3">
              <input
                type="number"
                className="border rounded-lg px-3 py-2 text-sm w-28"
                value={maxMarks}
                onChange={(e) => setMaxMarks(Number(e.target.value))}
              />
              <input
                type="datetime-local"
                className="border rounded-lg px-3 py-2 text-sm"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
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
            <p className="p-4 text-sm text-slate-500">No assignments.</p>
          )}
          {items.map((a) => (
            <div key={a.id} className="p-4 flex flex-wrap gap-3 justify-between items-center">
              <div>
                <Link
                  to={`/assignments/${a.id}`}
                  className="font-medium text-slate-900 hover:text-primary-700"
                >
                  {a.title}
                </Link>
                <div className="text-xs text-slate-500 mt-1 flex gap-2">
                  <span className="uppercase">{a.status}</span>
                  <span>{a.maxMarks} marks</span>
                  {a.dueAt && <span>Due {new Date(a.dueAt).toLocaleString()}</span>}
                  {a.mySubmissionStatus && (
                    <span className="text-primary-600">You: {a.mySubmissionStatus}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {canManage && a.status === 'draft' && (
                  <button
                    className="text-sm px-3 py-1.5 rounded-lg border hover:bg-slate-50"
                    onClick={() => publishMut.mutate(a.id)}
                  >
                    Publish
                  </button>
                )}
                {canManage && (
                  <Link
                    to={`/assignments/${a.id}/submissions`}
                    className="text-sm px-3 py-1.5 rounded-lg border hover:bg-slate-50"
                  >
                    Submissions ({a.submissionsCount ?? 0})
                  </Link>
                )}
                <Link
                  to={`/assignments/${a.id}`}
                  className="text-sm px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700"
                >
                  Open
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
