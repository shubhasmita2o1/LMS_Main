import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type { ApiResponse, AssignmentPublic, CourseListItem } from '@university-lms/shared';
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
import { FileCheck2, Plus, Clock, Award, CheckCircle2 } from 'lucide-react';

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
      <PageShell>
        {/* Header */}
        <SectionHeader
          title="Assignments &amp; Tasks"
          subtitle="Course homework, practical assignments, rubric evaluations, and student submissions"
          actions={
            canManage && (
              <PillButton
                variant={showCreate ? 'secondary' : 'primary'}
                icon={Plus}
                onClick={() => setShowCreate((v) => !v)}
              >
                {showCreate ? 'Cancel' : 'New Assignment'}
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
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>
        </SurfaceCard>

        {/* Creation Form Modal/Card */}
        {showCreate && canManage && (
          <SurfaceCard className="border-[#165239]/30 bg-[#eaf5ee]/20 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Create New Course Assignment</h3>
              <span className="text-xs text-slate-500">Draft Status</span>
            </div>

            <input
              className="w-full px-4 py-2.5 border border-slate-200/80 rounded-2xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#165239]/20 transition"
              placeholder="Assignment title / problem statement…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Maximum Marks
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-2 border border-slate-200/80 rounded-full text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#165239]/20 transition"
                  value={maxMarks}
                  onChange={(e) => setMaxMarks(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Due Date &amp; Time
                </label>
                <input
                  type="datetime-local"
                  className="w-full px-4 py-2 border border-slate-200/80 rounded-full text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#165239]/20 transition"
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <PillButton
                variant="primary"
                disabled={!courseId || !title || createMut.isPending}
                loading={createMut.isPending}
                onClick={() => createMut.mutate()}
              >
                Create Assignment Draft
              </PillButton>
            </div>
          </SurfaceCard>
        )}

        {/* Assignments List */}
        <SurfaceCard padding="none">
          {isLoading && (
            <div className="p-8 text-center text-xs text-slate-400">Loading assignments…</div>
          )}

          {!isLoading && items.length === 0 && (
            <EmptyState
              icon={FileCheck2}
              title="No Assignments Found"
              description="No assignments have been assigned for this course filter yet."
            />
          )}

          <div className="divide-y divide-slate-100">
            {items.map((a) => (
              <div
                key={a.id}
                className="p-5 flex flex-wrap gap-4 justify-between items-center hover:bg-slate-50/70 transition"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      to={`/assignments/${a.id}`}
                      className="font-bold text-slate-900 text-sm hover:text-[#165239] transition"
                    >
                      {a.title}
                    </Link>
                    <StatusBadge
                      label={a.status}
                      variant={a.status === 'published' ? 'success' : 'warning'}
                      size="sm"
                    />
                  </div>

                  <div className="text-xs text-slate-500 flex items-center gap-3 flex-wrap mt-1">
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <Award className="w-3.5 h-3.5 text-slate-400" />
                      {a.maxMarks} marks
                    </span>
                    {a.dueAt && (
                      <span className="flex items-center gap-1 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Due {new Date(a.dueAt).toLocaleDateString()}
                      </span>
                    )}
                    {a.mySubmissionStatus && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#eaf5ee] text-[#165239] font-bold text-[10px]">
                        <CheckCircle2 className="w-3 h-3" />
                        You: {a.mySubmissionStatus}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {canManage && a.status === 'draft' && (
                    <PillButton
                      variant="outline"
                      size="sm"
                      onClick={() => publishMut.mutate(a.id)}
                      loading={publishMut.isPending}
                    >
                      Publish
                    </PillButton>
                  )}
                  {canManage && (
                    <PillButton
                      to={`/assignments/${a.id}/submissions`}
                      variant="secondary"
                      size="sm"
                    >
                      Submissions ({a.submissionsCount ?? 0})
                    </PillButton>
                  )}
                  <PillButton
                    to={`/assignments/${a.id}`}
                    variant="primary"
                    size="sm"
                  >
                    Open
                  </PillButton>
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </PageShell>
    </AppLayout>
  );
}
export default AssignmentsPage;
