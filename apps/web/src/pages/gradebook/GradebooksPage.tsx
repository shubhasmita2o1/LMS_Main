import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type { ApiResponse, GradebookPublic, CourseListItem } from '@university-lms/shared';
import { useAuthStore } from '../../stores/authStore';
import { AppLayout } from '../../components/layout/AppLayout';
import {
  PageShell,
  SectionHeader,
  SurfaceCard,
  PillButton,
  StatusBadge,
  EmptyState,
} from '../../components/ui';
import { Award, Plus, CalendarCheck2, ArrowRight } from 'lucide-react';

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

  return (
    <AppLayout>
      <PageShell>
        {/* Header */}
        <SectionHeader
          title="Gradebook &amp; Results"
          subtitle="Continuous assessment weighting, score sheets, 10-point letter grading, and publishing transcripts"
          actions={
            canManage && (
              <PillButton
                variant={showCreate ? 'secondary' : 'primary'}
                icon={Plus}
                onClick={() => setShowCreate((v) => !v)}
              >
                {showCreate ? 'Cancel' : 'New Gradebook'}
              </PillButton>
            )
          }
        />

        {/* Filter Bar */}
        <SurfaceCard padding="sm">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
              Course Filter:
            </span>
            <select
              className="px-4 py-2 border border-slate-200/80 rounded-full text-xs bg-slate-50/50 hover:bg-white text-slate-700 min-w-[220px] focus:outline-none focus:ring-2 focus:ring-[#165239]/20 transition"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
            >
              <option value="">All active courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {(c as any).code || ''} — {c.name}
                </option>
              ))}
            </select>
          </div>
        </SurfaceCard>

        {/* Creation Form */}
        {showCreate && canManage && (
          <SurfaceCard className="border-[#165239]/30 bg-[#eaf5ee]/20 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Define Course Gradebook Structure</h3>
              <StatusBadge
                label={`Weights Total: ${weightSum.toFixed(1)}%`}
                variant={Math.abs(weightSum - 100) <= 0.5 ? 'success' : 'danger'}
                size="sm"
              />
            </div>

            {!courseId && (
              <p className="text-xs text-amber-700 font-semibold">Select a course filter first.</p>
            )}

            <input
              className="w-full px-4 py-2.5 border border-slate-200/80 rounded-2xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#165239]/20 transition"
              placeholder="Title (e.g., CS301 Continuous Evaluation – Fall 2026)…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700 block">Assessment Components</span>
              {components.map((c, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-2 md:grid-cols-4 gap-2.5 p-3.5 bg-white rounded-2xl border border-slate-200/80"
                >
                  <input
                    className="border border-slate-200 rounded-full px-3 py-1.5 text-xs text-slate-800"
                    placeholder="Key"
                    value={c.key}
                    onChange={(e) => {
                      const next = [...components];
                      next[idx] = { ...c, key: e.target.value };
                      setComponents(next);
                    }}
                  />
                  <input
                    className="border border-slate-200 rounded-full px-3 py-1.5 text-xs text-slate-800"
                    placeholder="Name"
                    value={c.name}
                    onChange={(e) => {
                      const next = [...components];
                      next[idx] = { ...c, name: e.target.value };
                      setComponents(next);
                    }}
                  />
                  <select
                    className="border border-slate-200 rounded-full px-3 py-1.5 text-xs text-slate-800 bg-white"
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
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      className="border border-slate-200 rounded-full px-3 py-1.5 text-xs w-20 text-slate-800"
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
                      className="border border-slate-200 rounded-full px-3 py-1.5 text-xs w-20 text-slate-800"
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
                      className="w-6 h-6 rounded-full text-rose-500 hover:bg-rose-50 flex items-center justify-center text-xs font-bold"
                      onClick={() => setComponents(components.filter((_, i) => i !== idx))}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="text-xs text-[#165239] font-bold hover:underline"
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
                + Add Component
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <PillButton
                variant="primary"
                disabled={!courseId || Math.abs(weightSum - 100) > 0.5 || createMut.isPending}
                loading={createMut.isPending}
                onClick={() => createMut.mutate()}
              >
                Create Gradebook
              </PillButton>
            </div>
          </SurfaceCard>
        )}

        {/* Gradebooks List */}
        <SurfaceCard padding="none">
          {isLoading && (
            <div className="p-8 text-center text-xs text-slate-400">Loading gradebooks…</div>
          )}

          {!isLoading && items.length === 0 && (
            <EmptyState
              icon={Award}
              title="No Gradebooks Configured"
              description="No gradebooks have been defined for this course yet."
            />
          )}

          {!isLoading && items.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Gradebook Title</th>
                    <th className="px-5 py-3.5">Course</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Components</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((g) => (
                    <tr key={g.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3.5 font-bold text-slate-900">{g.title}</td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {g.courseCode ? `${g.courseCode} — ` : ''}
                        {g.courseName || g.courseId}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge
                          label={g.status}
                          variant={
                            g.status === 'open'
                              ? 'success'
                              : g.status === 'locked'
                              ? 'warning'
                              : 'primary'
                          }
                          size="sm"
                        />
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 font-mono">
                        {g.components?.length ?? 0} evaluation units
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <PillButton
                          variant="primary"
                          size="sm"
                          onClick={() => navigate(`/gradebook/${g.id}`)}
                        >
                          Open Score Sheet
                        </PillButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SurfaceCard>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between pt-2">
          <Link
            to="/gradebook/transcript"
            className="text-xs font-bold text-[#165239] hover:text-[#1f6b4c] flex items-center gap-1.5 transition"
          >
            <Award className="w-4 h-4" />
            <span>View Student Academic Transcript</span>
          </Link>
          <Link
            to="/attendance"
            className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition"
          >
            <CalendarCheck2 className="w-4 h-4" />
            <span>Attendance Registers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </PageShell>
    </AppLayout>
  );
}
export default GradebooksPage;
