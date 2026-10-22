import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import api from '../../lib/api';
import type {
  ApiResponse,
  AssignmentPublic,
  AssignmentSubmissionPublic,
} from '@university-lms/shared';
import { AppLayout } from '../../components/layout/AppLayout';
import { PageShell, SurfaceCard, SectionHeader, PillButton, StatusBadge } from '../../components/ui';

export function AssignmentSubmissionsPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [marks, setMarks] = useState(0);
  const [feedback, setFeedback] = useState('');

  const { data: assignment } = useQuery({
    queryKey: ['assignment', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<AssignmentPublic>>(`/assignments/${id}`);
      return data.data!;
    },
  });

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['assignment', id, 'subs'],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<AssignmentSubmissionPublic[]>>(
        `/assignments/${id}/submissions`,
        { params: { limit: 100 } }
      );
      return data.data ?? [];
    },
  });

  const gradeMut = useMutation({
    mutationFn: async () => {
      if (!gradingId) return;
      await api.post(`/assignments/submissions/${gradingId}/grade`, {
        marksAwarded: marks,
        feedback,
        status: 'graded',
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignment', id, 'subs'] });
      setGradingId(null);
      setFeedback('');
    },
  });

  return (
    <AppLayout>
      <PageShell>
        <SectionHeader
          title="Student Submissions"
          subtitle={assignment ? `Assignment: ${assignment.title} (Max: ${assignment.maxMarks} pts)` : 'Grading & Review'}
          actions={
            <PillButton
              variant="outline"
              href={`/assignments/${id}`}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Assignment Details
            </PillButton>
          }
        />

        <SurfaceCard>
          {isLoading && <p className="py-8 text-center text-xs text-slate-400">Loading submissions…</p>}
          {!isLoading && submissions.length === 0 && (
            <p className="py-8 text-center text-xs text-slate-400">No submissions received for this assignment yet.</p>
          )}

          <div className="divide-y divide-slate-100">
            {submissions.map((s) => (
              <div key={s.id} className="py-4 space-y-3 first:pt-0 last:pb-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{s.studentName || s.studentId}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <StatusBadge
                        status={s.status === 'graded' ? 'success' : s.status === 'submitted' ? 'primary' : 'neutral'}
                        label={s.status}
                      />
                      <span className="text-[11px] text-slate-400">Attempt {s.attemptNumber}</span>
                      {s.isLate && (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                          Late Submission
                        </span>
                      )}
                      {s.submittedAt && (
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(s.submittedAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {s.marksAwarded != null ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f0f7f4] text-[#165239] font-bold text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#165239]" />
                        <span>
                          {s.marksAwarded} / {assignment?.maxMarks} pts
                        </span>
                      </div>
                    ) : (
                      <PillButton
                        variant="secondary"
                        onClick={() => {
                          setGradingId(s.id);
                          setMarks(0);
                          setFeedback('');
                        }}
                      >
                        Grade Submission
                      </PillButton>
                    )}
                  </div>
                </div>

                {s.body && (
                  <p className="text-xs text-slate-700 whitespace-pre-wrap bg-slate-50/80 rounded-2xl p-4 border border-slate-200/60">
                    {s.body}
                  </p>
                )}

                {gradingId === s.id && (
                  <div className="mt-3 p-4 rounded-2xl bg-[#f0f7f4]/60 border border-[#c2decf]/80 space-y-3">
                    <h4 className="text-xs font-bold text-[#165239] uppercase tracking-wider">
                      Evaluate & Provide Feedback
                    </h4>
                    <div className="grid sm:grid-cols-4 gap-3 items-end">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Marks (Max: {assignment?.maxMarks})
                        </label>
                        <input
                          type="number"
                          className="w-full border border-slate-200 rounded-full px-3 py-1.5 text-xs bg-white text-slate-800"
                          value={marks}
                          max={assignment?.maxMarks}
                          min={0}
                          onChange={(e) => setMarks(Number(e.target.value))}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Evaluation Comments & Feedback
                        </label>
                        <input
                          className="w-full border border-slate-200 rounded-full px-4 py-1.5 text-xs bg-white text-slate-800"
                          value={feedback}
                          placeholder="Good work, well analyzed..."
                          onChange={(e) => setFeedback(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <PillButton
                          variant="primary"
                          onClick={() => gradeMut.mutate()}
                          loading={gradeMut.isPending}
                        >
                          Save Grade
                        </PillButton>
                        <PillButton
                          variant="ghost"
                          onClick={() => setGradingId(null)}
                        >
                          Cancel
                        </PillButton>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </SurfaceCard>
      </PageShell>
    </AppLayout>
  );
}
