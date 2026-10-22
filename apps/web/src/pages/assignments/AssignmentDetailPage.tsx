import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Clock, Award, Users, Send, Save, CheckCircle2 } from 'lucide-react';
import api from '../../lib/api';
import type {
  ApiResponse,
  AssignmentPublic,
  AssignmentSubmissionPublic,
} from '@university-lms/shared';
import { useAuthStore } from '../../stores/authStore';
import { AppLayout } from '../../components/layout/AppLayout';
import { PageShell, SurfaceCard, SectionHeader, PillButton, StatusBadge } from '../../components/ui';

export function AssignmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [body, setBody] = useState('');
  const isStudent = user?.roles?.includes('student');
  const canManage = user?.roles?.some((r) =>
    ['faculty', 'tenant_admin', 'university_admin', 'super_admin'].includes(r)
  );

  const { data: assignment, isLoading } = useQuery({
    queryKey: ['assignment', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<AssignmentPublic>>(`/assignments/${id}`);
      return data.data!;
    },
  });

  const { data: mySubs = [] } = useQuery({
    queryKey: ['assignment', id, 'my'],
    enabled: !!id && !!isStudent,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<AssignmentSubmissionPublic[]>>(
        `/assignments/${id}/my-submission`
      );
      return data.data ?? [];
    },
  });

  const submitMut = useMutation({
    mutationFn: async (asDraft: boolean) => {
      await api.post(`/assignments/${id}/submissions`, { body, asDraft });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignment', id] });
      setBody('');
    },
  });

  if (isLoading || !assignment) {
    return (
      <AppLayout>
        <PageShell>
          <div className="py-20 text-center text-slate-400 font-medium">
            Loading assignment details…
          </div>
        </PageShell>
      </AppLayout>
    );
  }

  const latest = mySubs[0];

  return (
    <AppLayout>
      <PageShell>
        <SectionHeader
          title={assignment.title}
          subtitle={`Maximum Marks: ${assignment.maxMarks} pts`}
          badge={
            <StatusBadge
              status={assignment.status === 'published' ? 'success' : 'neutral'}
              label={assignment.status}
            />
          }
          actions={
            <div className="flex items-center gap-2">
              <PillButton variant="outline" href="/assignments" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Assignments
              </PillButton>
              {canManage && (
                <PillButton
                  variant="primary"
                  href={`/assignments/${id}/submissions`}
                  leftIcon={<Users className="w-4 h-4" />}
                >
                  Review Submissions
                </PillButton>
              )}
            </div>
          }
        />

        {/* Assignment Brief Card */}
        <SurfaceCard>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
              <Award className="w-3.5 h-3.5 text-slate-500" />
              {assignment.maxMarks} Total Marks
            </span>
            {assignment.dueAt && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/60">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Due {new Date(assignment.dueAt).toLocaleString()}
              </span>
            )}
          </div>

          {assignment.description && (
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap mb-4">
              {assignment.description}
            </div>
          )}

          {assignment.instructions && (
            <div className="pt-4 border-t border-slate-100 mt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Submission Guidelines & Instructions
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                {assignment.instructions}
              </p>
            </div>
          )}
        </SurfaceCard>

        {/* Student Submission Card */}
        {isStudent && assignment.status === 'published' && (
          <SurfaceCard title="Your Assignment Submission">
            {latest && (
              <div className="mb-6 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">
                    Submission Status:{' '}
                    <span className="capitalize font-bold text-slate-900">{latest.status}</span>
                    {latest.isLate && <span className="ml-2 text-rose-600 font-bold">(Late)</span>}
                  </span>
                  {latest.submittedAt && (
                    <span className="text-slate-400 font-mono text-[11px]">
                      {new Date(latest.submittedAt).toLocaleString()}
                    </span>
                  )}
                </div>

                {latest.body && (
                  <p className="text-xs text-slate-700 whitespace-pre-wrap pt-2 border-t border-slate-200/60">
                    {latest.body}
                  </p>
                )}

                {latest.marksAwarded != null && (
                  <div className="flex items-center gap-2 pt-2 text-xs font-bold text-[#165239]">
                    <CheckCircle2 className="w-4 h-4 text-[#165239]" />
                    <span>
                      Score: {latest.marksAwarded} / {assignment.maxMarks} marks
                    </span>
                  </div>
                )}

                {latest.feedback && (
                  <p className="text-xs text-slate-500 italic mt-1">Instructor Feedback: "{latest.feedback}"</p>
                )}
              </div>
            )}

            {(!latest || latest.status === 'draft' || assignment.allowResubmission) && (
              <div className="space-y-4">
                <textarea
                  className="w-full border border-slate-200 rounded-2xl p-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#165239]/20"
                  rows={6}
                  placeholder="Enter your response, code, or submission narrative here…"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
                <div className="flex items-center justify-end gap-3">
                  <PillButton
                    variant="outline"
                    onClick={() => submitMut.mutate(true)}
                    loading={submitMut.isPending}
                    leftIcon={<Save className="w-3.5 h-3.5" />}
                  >
                    Save Draft
                  </PillButton>
                  <PillButton
                    variant="primary"
                    onClick={() => submitMut.mutate(false)}
                    loading={submitMut.isPending}
                    disabled={!body.trim()}
                    leftIcon={<Send className="w-3.5 h-3.5" />}
                  >
                    Final Submit
                  </PillButton>
                </div>
              </div>
            )}
          </SurfaceCard>
        )}
      </PageShell>
    </AppLayout>
  );
}
