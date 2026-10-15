import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type { ApiResponse, GradebookPublic, CourseListItem } from '@university-lms/shared';
import { useAuthStore } from '../../stores/authStore';
import { AppLayout } from '../../components/layout/AppLayout';

const COMPONENT_TYPES = [
  'assignment',
  'quiz',
  'midterm',
  'final',
  'attendance',
  'project',
  'other',
  'manual',
] as const;

type CompDraft = {
  key: string;
  name: string;
  type: string;
  weightPercent: number;
  maxMarks: number;
  source: string;
  sourceIds: string;
  dropLowest: number;
};

export function GradebooksPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [courseId, setCourseId] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [components, setComponents] = useState<CompDraft[]>([
    {
      key: 'assignments',
      name: 'Assignments',
      type: 'assignment',
      weightPercent: 30,
      maxMarks: 100,
      source: 'assignment',
      sourceIds: '',
      dropLowest: 0,
    },
    {
      key: 'quizzes',
      name: 'Quizzes',
      type: 'quiz',
      weightPercent: 30,
      maxMarks: 100,
      source: 'quiz',
      sourceIds: '',
      dropLowest: 0,
    },
    {
      key: 'attendance',
      name: 'Attendance',
      type: 'attendance',
      weightPercent: 10,
      maxMarks: 100,
      source: 'attendance',
      sourceIds: '',
      dropLowest: 0,
    },
    {
      key: 'final',
      name: 'Final Exam',
      type: 'final',
      weightPercent: 30,
      maxMarks: 100,
      source: 'manual',
      sourceIds: '',
      dropLowest: 0,
    },
  ]);

  const canManage = user?.roles?.some((r) =>
    ['faculty', 'tenant_admin', 'university_admin', 'super_admin'].includes(r)
  );

  const { data: courses = [] } = useQuery({
    queryKey: ['courses', 'for-gb'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CourseListItem[]>>('/courses', {
        params: { limit: 100 },
      });
      return data.data ?? [];
    },
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['gradebooks', courseId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<GradebookPublic[]>>('/gradebook', {
        params: { limit: 50, courseId: courseId || undefined },
      });
      return data.data ?? [];
    },
  });

  const weightSum = components.reduce((s, c) => s + (Number(c.weightPercent) || 0), 0);

  const createMut = useMutation({
    mutationFn: async () => {
      if (!courseId) throw new Error('Select a course');
      if (Math.abs(weightSum - 100) > 0.5) throw new Error('Weights must sum to 100');
      await api.post('/gradebook', {
        courseId,
        title: title || `Gradebook`,
        components: components.map((c) => ({
          key: c.key,
          name: c.name,
          type: c.type,
          weightPercent: Number(c.weightPercent),
          maxMarks: Number(c.maxMarks),
          source: c.source,
          sourceIds: c.sourceIds
            ? c.sourceIds
                .split(',')
                .map((x) => x.trim())
                .filter(Boolean)
            : [],
          dropLowest: Number(c.dropLowest) || 0,
        })),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gradebooks'] });
      setShowCreate(false);
      setTitle('');
    },
  });

  const statusBadge = (s: string) => {
    const colors: Record<string, string> = {
      open: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      locked: 'bg-amber-50 text-amber-700 border-amber-200',
      published: 'bg-blue-50 text-blue-700 border-blue-200',
    };
    return (
      <span
        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${colors[s] || 'bg-slate-50 text-slate-600'}`}
      >
        {s}
      </span>
    );
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold text-slate-900">Gradebooks</h1>
          <select
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm min-w-[200px] ml-2"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
          >
            <option value="">All courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {(c as any).code || ''} — {c.name}
              </option>
            ))}
          </select>
          {canManage && (
            <button
              className="ml-auto px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
              onClick={() => setShowCreate((v) => !v)}
            >
              {showCreate ? 'Cancel' : 'New Gradebook'}
            </button>
          )}
        </div>

        {showCreate && canManage && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm">
            <h2 className="font-medium text-slate-800">Create gradebook</h2>
            {!courseId && (
              <p className="text-sm text-amber-600">Select a course above first.</p>
            )}
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="Title (e.g. CS301 – Fall 2026)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">Components</span>
                <span
                  className={
                    Math.abs(weightSum - 100) <= 0.5
                      ? 'text-emerald-600'
                      : 'text-red-600 font-medium'
                  }
                >
                  Weights: {weightSum.toFixed(1)}%
                </span>
              </div>
              {components.map((c, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100"
                >
                  <input
                    className="border rounded px-2 py-1 text-sm"
                    placeholder="Key"
                    value={c.key}
                    onChange={(e) => {
                      const next = [...components];
                      next[idx] = { ...c, key: e.target.value };
                      setComponents(next);
                    }}
                  />
                  <input
                    className="border rounded px-2 py-1 text-sm"
                    placeholder="Name"
                    value={c.name}
                    onChange={(e) => {
                      const next = [...components];
                      next[idx] = { ...c, name: e.target.value };
                      setComponents(next);
                    }}
                  />
                  <select
                    className="border rounded px-2 py-1 text-sm"
                    value={c.type}
                    onChange={(e) => {
                      const next = [...components];
                      const type = e.target.value;
                      const source =
                        type === 'assignment' || type === 'quiz' || type === 'attendance'
                          ? type
                          : 'manual';
                      next[idx] = { ...c, type, source };
                      setComponents(next);
                    }}
                  >
                    {COMPONENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      className="border rounded px-2 py-1 text-sm w-20"
                      placeholder="Weight %"
                      value={c.weightPercent}
                      onChange={(e) => {
                        const next = [...components];
                        next[idx] = { ...c, weightPercent: Number(e.target.value) };
                        setComponents(next);
                      }}
                    />
                    <input
                      type="number"
                      className="border rounded px-2 py-1 text-sm w-20"
                      placeholder="Max"
                      value={c.maxMarks}
                      onChange={(e) => {
                        const next = [...components];
                        next[idx] = { ...c, maxMarks: Number(e.target.value) };
                        setComponents(next);
                      }}
                    />
                    <button
                      type="button"
                      className="text-xs text-red-500"
                      onClick={() => setComponents(components.filter((_, i) => i !== idx))}
                    >
                      ✕
                    </button>
                  </div>
                  {(c.source === 'assignment' || c.source === 'quiz') && (
                    <input
                      className="col-span-2 border rounded px-2 py-1 text-sm"
                      placeholder="Source IDs (comma-separated assignment/quiz ids)"
                      value={c.sourceIds}
                      onChange={(e) => {
                        const next = [...components];
                        next[idx] = { ...c, sourceIds: e.target.value };
                        setComponents(next);
                      }}
                    />
                  )}
                </div>
              ))}
              <button
                type="button"
                className="text-sm text-indigo-600"
                onClick={() =>
                  setComponents([
                    ...components,
                    {
                      key: `comp_${components.length + 1}`,
                      name: 'Component',
                      type: 'manual',
                      weightPercent: 0,
                      maxMarks: 100,
                      source: 'manual',
                      sourceIds: '',
                      dropLowest: 0,
                    },
                  ])
                }
              >
                + Add component
              </button>
            </div>
            {createMut.error && (
              <p className="text-sm text-red-600">{(createMut.error as Error).message}</p>
            )}
            <button
              className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white disabled:opacity-50"
              disabled={!courseId || Math.abs(weightSum - 100) > 0.5 || createMut.isPending}
              onClick={() => createMut.mutate()}
            >
              {createMut.isPending ? 'Creating…' : 'Create gradebook'}
            </button>
          </div>
        )}

        {isLoading ? (
          <p className="text-slate-500 text-sm">Loading…</p>
        ) : items.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-xl p-12 text-center text-slate-500">
            No gradebooks yet. Create one for a course to start tracking grades.
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Course</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Components</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-medium text-slate-900">{g.title}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {g.courseCode ? `${g.courseCode} — ` : ''}
                      {g.courseName || g.courseId}
                    </td>
                    <td className="px-4 py-3">{statusBadge(g.status)}</td>
                    <td className="px-4 py-3 text-slate-500">{g.components?.length ?? 0}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="text-indigo-600 hover:underline"
                        onClick={() => navigate(`/gradebook/${g.id}`)}
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex gap-4 text-sm">
          <Link to="/gradebook/transcript" className="text-indigo-600 hover:underline">
            My transcript
          </Link>
          <Link to="/attendance" className="text-indigo-600 hover:underline">
            Attendance
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}

export default GradebooksPage;
