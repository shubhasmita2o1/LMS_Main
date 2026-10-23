import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type { ApiResponse, QuizPublic, CourseListItem } from '@university-lms/shared';
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
import { HelpCircle, Plus, Clock, Award, Play } from 'lucide-react';

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
    <AppLayout>
      <PageShell>
        {/* Header */}
        <SectionHeader
          title="Quizzes &amp; Assessments"
          subtitle="Online quizzes, automated evaluations, question weights, and student attempts"
          actions={
            canManage && (
              <PillButton
                variant={showCreate ? 'secondary' : 'primary'}
                icon={Plus}
                onClick={() => setShowCreate((v) => !v)}
              >
                {showCreate ? 'Cancel' : 'New Quiz'}
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
              <option value="">All courses</option>
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
              <h3 className="text-sm font-bold text-slate-900">Create New Assessment Quiz</h3>
              <span className="text-xs text-slate-500">Draft Status</span>
            </div>

            <input
              className="w-full px-4 py-2.5 border border-slate-200/80 rounded-2xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#165239]/20 transition"
              placeholder="Quiz title (e.g., Mid-Term Assessment: Modules 1–3)…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-600">Duration (Minutes):</label>
              <input
                type="number"
                className="w-28 px-4 py-2 border border-slate-200/80 rounded-full text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#165239]/20 transition"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
            </div>

            <div className="pt-2 flex justify-end">
              <PillButton
                variant="primary"
                disabled={!courseId || !title || createMut.isPending}
                loading={createMut.isPending}
                onClick={() => createMut.mutate()}
              >
                Create Quiz Draft
              </PillButton>
            </div>
          </SurfaceCard>
        )}

        {/* Quizzes List */}
        <SurfaceCard padding="none">
          {isLoading && (
            <div className="p-8 text-center text-xs text-slate-400">Loading quizzes…</div>
          )}

          {!isLoading && items.length === 0 && (
            <EmptyState
              icon={HelpCircle}
              title="No Quizzes Found"
              description="No quizzes have been configured for this course yet."
            />
          )}

          <div className="divide-y divide-slate-100">
            {items.map((q) => (
              <div
                key={q.id}
                className="p-5 flex flex-wrap gap-4 justify-between items-center hover:bg-slate-50/70 transition"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      to={`/quizzes/${q.id}`}
                      className="font-bold text-slate-900 text-sm hover:text-[#165239] transition"
                    >
                      {q.title}
                    </Link>
                    <StatusBadge
                      label={q.status}
                      variant={q.status === 'published' ? 'success' : 'warning'}
                      size="sm"
                    />
                  </div>

                  <div className="text-xs text-slate-500 flex items-center gap-3 flex-wrap mt-1">
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <Award className="w-3.5 h-3.5 text-slate-400" />
                      {q.totalMarks} marks
                    </span>
                    {q.durationMinutes && (
                      <span className="flex items-center gap-1 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {q.durationMinutes} minutes
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400">
                      {q.questions?.length || 0} questions
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {canManage && (
                    <PillButton
                      to={`/quizzes/${q.id}/builder`}
                      variant="outline"
                      size="sm"
                    >
                      Builder
                    </PillButton>
                  )}
                  {canManage && q.status === 'draft' && (
                    <PillButton
                      variant="outline"
                      size="sm"
                      onClick={() => publishMut.mutate(q.id)}
                      loading={publishMut.isPending}
                    >
                      Publish
                    </PillButton>
                  )}
                  {canManage && (
                    <PillButton
                      to={`/quizzes/${q.id}/attempts`}
                      variant="secondary"
                      size="sm"
                    >
                      Attempts
                    </PillButton>
                  )}
                  {q.status === 'published' && (
                    <PillButton
                      to={`/quizzes/${q.id}/take`}
                      variant="primary"
                      size="sm"
                      icon={Play}
                    >
                      Take Quiz
                    </PillButton>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </PageShell>
    </AppLayout>
  );
}
export default QuizzesPage;
