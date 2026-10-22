import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, RefreshCw, Lock, Unlock, Send, Award } from 'lucide-react';
import api from '../../lib/api';
import type {
  ApiResponse,
  GradebookPublic,
  StudentGradeRow,
  ResultPublic,
} from '@university-lms/shared';
import { useAuthStore } from '../../stores/authStore';
import { AppLayout } from '../../components/layout/AppLayout';
import { PageShell, SurfaceCard, SectionHeader, PillButton, StatusBadge } from '../../components/ui';

export function GradebookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [overrideStudent, setOverrideStudent] = useState('');
  const [overrideKey, setOverrideKey] = useState('');
  const [overrideMarks, setOverrideMarks] = useState('');
  const [overrideReason, setOverrideReason] = useState('');

  const canManage = user?.roles?.some((r) =>
    ['faculty', 'tenant_admin', 'university_admin', 'super_admin'].includes(r)
  );
  const isStudent =
    user?.roles?.includes('student') &&
    !user?.roles?.some((r) =>
      ['faculty', 'tenant_admin', 'university_admin', 'super_admin'].includes(r)
    );

  const { data: gradebook, isLoading: gbLoading } = useQuery({
    queryKey: ['gradebook', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<GradebookPublic>>(`/gradebook/${id}`);
      return data.data!;
    },
    enabled: !!id && !isStudent,
  });

  const { data: roster, isLoading: rosterLoading } = useQuery({
    queryKey: ['gradebook-roster', id],
    queryFn: async () => {
      const { data } = await api.get<
        ApiResponse<{ gradebook: GradebookPublic; rows: StudentGradeRow[] }>
      >(`/gradebook/${id}/roster`);
      return data.data!;
    },
    enabled: !!id && !!canManage,
  });

  const { data: myResult } = useQuery({
    queryKey: ['my-grades', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ResultPublic>>(`/gradebook/${id}/my-grades`);
      return data.data!;
    },
    enabled: !!id && !!isStudent,
  });

  const recomputeMut = useMutation({
    mutationFn: async () => {
      await api.post(`/gradebook/${id}/recompute`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gradebook-roster', id] });
      qc.invalidateQueries({ queryKey: ['gradebook', id] });
    },
  });

  const lockMut = useMutation({
    mutationFn: async () => {
      if (!confirm('Lock this gradebook? Auto-sync will stop until unlocked.')) return;
      await api.post(`/gradebook/${id}/lock`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gradebook', id] }),
  });

  const unlockMut = useMutation({
    mutationFn: async () => {
      await api.post(`/gradebook/${id}/unlock`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gradebook', id] }),
  });

  const publishMut = useMutation({
    mutationFn: async () => {
      if (!confirm('Publish results to students? This creates immutable snapshots.')) return;
      await api.post(`/gradebook/${id}/publish-results`, {});
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gradebook', id] });
      qc.invalidateQueries({ queryKey: ['gradebook-roster', id] });
    },
  });

  const overrideMut = useMutation({
    mutationFn: async () => {
      await api.patch(`/gradebook/${id}/entries`, {
        entries: [
          {
            studentId: overrideStudent,
            componentKey: overrideKey,
            overriddenMarks: Number(overrideMarks),
            overrideReason: overrideReason || null,
          },
        ],
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gradebook-roster', id] });
      setOverrideMarks('');
      setOverrideReason('');
    },
  });

  const gb = roster?.gradebook || gradebook;
  const rows = roster?.rows || [];

  if (isStudent) {
    return (
      <AppLayout>
        <PageShell>
          <SectionHeader
            title={myResult?.title || 'Academic Performance & Grades'}
            subtitle="Published grade breakdown and component contributions"
            actions={
              <PillButton variant="outline" href="/gradebook" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Gradebooks
              </PillButton>
            }
          />

          {!myResult ? (
            <SurfaceCard className="py-12 text-center text-xs text-slate-400">
              No published grades available for your account yet.
            </SurfaceCard>
          ) : (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-3 gap-6">
                <SurfaceCard className="bg-[#165239] text-white">
                  <span className="text-emerald-200 text-xs font-semibold uppercase tracking-wider">
                    Cumulative Weighted Total
                  </span>
                  <div className="text-3xl font-extrabold mt-1">{myResult.weightedPercent}%</div>
                </SurfaceCard>
                <SurfaceCard>
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    Letter Grade
                  </span>
                  <div className="text-3xl font-extrabold text-[#165239] mt-1">
                    {myResult.letterGrade || '—'}
                  </div>
                </SurfaceCard>
                <SurfaceCard>
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    Grade Points
                  </span>
                  <div className="text-3xl font-extrabold text-slate-900 mt-1">
                    {myResult.gradePoint ?? '—'}
                  </div>
                </SurfaceCard>
              </div>

              <SurfaceCard title="Evaluation Components & Breakdown" className="p-0 overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50/80 border-b border-slate-200/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Component</th>
                      <th className="px-5 py-3.5">Weight</th>
                      <th className="px-5 py-3.5">Marks Obtained</th>
                      <th className="px-5 py-3.5">Percentage</th>
                      <th className="px-5 py-3.5 text-right">Contribution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {myResult.components?.map((c) => (
                      <tr key={c.key} className="hover:bg-slate-50/60 transition">
                        <td className="px-5 py-3 font-semibold text-slate-900">{c.name}</td>
                        <td className="px-5 py-3 text-slate-500 font-mono">{c.weightPercent}%</td>
                        <td className="px-5 py-3 font-medium text-slate-800">
                          {c.rawMarks} / {c.maxMarks}
                        </td>
                        <td className="px-5 py-3 font-semibold text-slate-900">{c.percent}%</td>
                        <td className="px-5 py-3 font-bold text-[#165239] text-right">
                          {c.contribution} pts
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </SurfaceCard>
            </div>
          )}
        </PageShell>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageShell>
        <SectionHeader
          title={gb?.title || 'Course Gradebook'}
          subtitle={gb ? `Course ID: ${gb.courseId || '—'} · Term Offering: ${gb.offeringId || '—'}` : 'Evaluation matrix'}
          badge={
            gb ? (
              <StatusBadge
                status={gb.status === 'published' ? 'success' : gb.status === 'locked' ? 'warning' : 'primary'}
                label={gb.status}
              />
            ) : undefined
          }
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <PillButton variant="outline" href="/gradebook" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Gradebooks
              </PillButton>
              {canManage && gb && (
                <>
                  {gb.status === 'open' && (
                    <>
                      <PillButton
                        variant="secondary"
                        onClick={() => recomputeMut.mutate()}
                        loading={recomputeMut.isPending}
                        leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                      >
                        Recompute Scores
                      </PillButton>
                      <PillButton
                        variant="outline"
                        onClick={() => lockMut.mutate()}
                        leftIcon={<Lock className="w-3.5 h-3.5" />}
                      >
                        Lock
                      </PillButton>
                    </>
                  )}
                  {gb.status === 'locked' && (
                    <>
                      <PillButton
                        variant="outline"
                        onClick={() => unlockMut.mutate()}
                        leftIcon={<Unlock className="w-3.5 h-3.5" />}
                      >
                        Unlock
                      </PillButton>
                      <PillButton
                        variant="primary"
                        onClick={() => publishMut.mutate()}
                        leftIcon={<Send className="w-3.5 h-3.5" />}
                      >
                        Publish Results
                      </PillButton>
                    </>
                  )}
                  {gb.status === 'open' && (
                    <PillButton
                      variant="primary"
                      onClick={() => publishMut.mutate()}
                      leftIcon={<Send className="w-3.5 h-3.5" />}
                    >
                      Publish Results
                    </PillButton>
                  )}
                </>
              )}
            </div>
          }
        />

        {(gbLoading || rosterLoading) && (
          <SurfaceCard className="py-12 text-center text-xs text-slate-400">
            Loading gradebook ledger…
          </SurfaceCard>
        )}

        {gb && gb.components && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Grading Schema:
            </span>
            {gb.components.map((c) => (
              <span
                key={c.key}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-white border border-slate-200/80 text-slate-700 shadow-2xs"
              >
                <Award className="w-3.5 h-3.5 text-[#165239]" />
                {c.name} ({c.weightPercent}%) · {c.source}
              </span>
            ))}
          </div>
        )}

        {canManage && rows.length > 0 && (
          <SurfaceCard className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left min-w-[700px]">
                <thead className="bg-slate-50/80 border-b border-slate-200/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5 sticky left-0 bg-slate-50/90 backdrop-blur-xs">Student</th>
                    {gb?.components?.map((c) => (
                      <th key={c.key} className="px-4 py-3.5 whitespace-nowrap">
                        {c.name}
                        <span className="block text-[10px] font-normal text-slate-400">
                          Max {c.maxMarks}
                        </span>
                      </th>
                    ))}
                    <th className="px-4 py-3.5 font-bold text-[#165239]">Total %</th>
                    <th className="px-4 py-3.5">Letter</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row) => (
                    <tr key={row.studentId} className="hover:bg-slate-50/60 transition">
                      <td className="px-5 py-3 sticky left-0 bg-white">
                        <div className="font-bold text-slate-900">{row.studentName || row.studentId}</div>
                        {row.studentCode && (
                          <div className="text-[10px] font-mono text-slate-400">{row.studentCode}</div>
                        )}
                      </td>
                      {gb?.components?.map((c) => {
                        const e = row.entries[c.key];
                        const marks = e?.overriddenMarks != null ? e.overriddenMarks : e?.rawMarks;
                        return (
                          <td key={c.key} className="px-4 py-3 tabular-nums">
                            {e ? (
                              <span
                                className={e.overriddenMarks != null ? 'text-amber-700 font-bold' : 'font-medium text-slate-800'}
                                title={e.overrideReason || undefined}
                              >
                                {marks != null ? Number(marks).toFixed(1) : '—'}
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 font-bold text-[#165239] tabular-nums">
                        {row.total?.weightedPercent != null ? `${row.total.weightedPercent}%` : '—'}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-800">{row.total?.letterGrade || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SurfaceCard>
        )}

        {canManage && gb?.status !== 'published' && (
          <SurfaceCard title="Manual Grade Override & Adjustment">
            <p className="text-xs text-slate-500 mb-4">
              Directly override a student's component score with mandatory audit justification.
            </p>
            <div className="grid sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Target Student</label>
                <select
                  className="w-full border border-slate-200 rounded-full px-3 py-2 text-xs bg-white text-slate-800"
                  value={overrideStudent}
                  onChange={(e) => setOverrideStudent(e.target.value)}
                >
                  <option value="">Select Student</option>
                  {rows.map((r) => (
                    <option key={r.studentId} value={r.studentId}>
                      {r.studentName || r.studentId}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Component</label>
                <select
                  className="w-full border border-slate-200 rounded-full px-3 py-2 text-xs bg-white text-slate-800"
                  value={overrideKey}
                  onChange={(e) => setOverrideKey(e.target.value)}
                >
                  <option value="">Select Component</option>
                  {gb?.components?.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">New Marks</label>
                <input
                  type="number"
                  className="w-full border border-slate-200 rounded-full px-3 py-2 text-xs bg-white text-slate-800"
                  placeholder="e.g. 18.5"
                  value={overrideMarks}
                  onChange={(e) => setOverrideMarks(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">Audit Justification</label>
                <input
                  className="w-full border border-slate-200 rounded-full px-4 py-2 text-xs bg-white text-slate-800"
                  placeholder="Medical excuse / re-eval"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <PillButton
                variant="primary"
                disabled={!overrideStudent || !overrideKey || overrideMarks === '' || overrideMut.isPending}
                loading={overrideMut.isPending}
                onClick={() => overrideMut.mutate()}
              >
                Save Score Override
              </PillButton>
            </div>
          </SurfaceCard>
        )}
      </PageShell>
    </AppLayout>
  );
}

export default GradebookDetailPage;

