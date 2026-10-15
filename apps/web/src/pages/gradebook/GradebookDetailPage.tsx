import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type {
  ApiResponse,
  GradebookPublic,
  StudentGradeRow,
  ResultPublic,
} from '@university-lms/shared';
import { useAuthStore } from '../../stores/authStore';
import { AppLayout } from '../../components/layout/AppLayout';

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
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
          <Link to="/gradebook" className="text-sm text-slate-500 hover:text-slate-800">
            ← Gradebooks
          </Link>
          {!myResult ? (
            <p className="text-slate-500">No published result for you yet.</p>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm">
              <h1 className="text-xl font-semibold">{myResult.title || 'My grades'}</h1>
              <div className="flex gap-6 text-sm">
                <div>
                  <div className="text-slate-500">Total</div>
                  <div className="text-2xl font-semibold text-slate-900">
                    {myResult.weightedPercent}%
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Letter</div>
                  <div className="text-2xl font-semibold text-indigo-600">
                    {myResult.letterGrade || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">GP</div>
                  <div className="text-2xl font-semibold">{myResult.gradePoint ?? '—'}</div>
                </div>
              </div>
              <table className="w-full text-sm">
                <thead className="text-left text-slate-500 border-b">
                  <tr>
                    <th className="py-2">Component</th>
                    <th className="py-2">Weight</th>
                    <th className="py-2">Marks</th>
                    <th className="py-2">%</th>
                    <th className="py-2">Contribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {myResult.components?.map((c) => (
                    <tr key={c.key}>
                      <td className="py-2">{c.name}</td>
                      <td className="py-2">{c.weightPercent}%</td>
                      <td className="py-2">
                        {c.rawMarks}/{c.maxMarks}
                      </td>
                      <td className="py-2">{c.percent}%</td>
                      <td className="py-2">{c.contribution}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/gradebook" className="text-sm text-slate-500 hover:text-slate-800">
            ← Gradebooks
          </Link>
          <h1 className="text-xl font-semibold text-slate-900">{gb?.title || 'Gradebook'}</h1>
          {gb && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full border ${
                gb.status === 'open'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : gb.status === 'locked'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}
            >
              {gb.status}
            </span>
          )}
        </div>

        {canManage && gb && (
          <div className="flex flex-wrap gap-2">
            {gb.status === 'open' && (
              <>
                <button
                  className="px-3 py-1.5 text-sm rounded-lg bg-indigo-600 text-white disabled:opacity-50"
                  disabled={recomputeMut.isPending}
                  onClick={() => recomputeMut.mutate()}
                >
                  {recomputeMut.isPending ? 'Recomputing…' : 'Recompute from assignments/quizzes'}
                </button>
                <button
                  className="px-3 py-1.5 text-sm rounded-lg border border-amber-300 text-amber-800 bg-amber-50"
                  onClick={() => lockMut.mutate()}
                >
                  Lock
                </button>
              </>
            )}
            {gb.status === 'locked' && (
              <>
                <button
                  className="px-3 py-1.5 text-sm rounded-lg border border-slate-300"
                  onClick={() => unlockMut.mutate()}
                >
                  Unlock
                </button>
                <button
                  className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white"
                  onClick={() => publishMut.mutate()}
                >
                  Publish results
                </button>
              </>
            )}
            {gb.status === 'open' && (
              <button
                className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white"
                onClick={() => publishMut.mutate()}
              >
                Publish results
              </button>
            )}
          </div>
        )}

        {(gbLoading || rosterLoading) && <p className="text-sm text-slate-500">Loading…</p>}

        {gb && (
          <div className="flex flex-wrap gap-2 text-xs text-slate-600">
            {gb.components?.map((c) => (
              <span key={c.key} className="px-2 py-1 bg-slate-100 rounded-md">
                {c.name} ({c.weightPercent}%) · {c.source}
              </span>
            ))}
          </div>
        )}

        {canManage && rows.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
            <table className="w-full text-sm min-w-[800px]">
              <thead className="bg-slate-50 text-slate-600 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium sticky left-0 bg-slate-50">Student</th>
                  {gb?.components?.map((c) => (
                    <th key={c.key} className="px-3 py-2 font-medium whitespace-nowrap">
                      {c.name}
                      <span className="block text-[10px] font-normal text-slate-400">
                        /{c.maxMarks}
                      </span>
                    </th>
                  ))}
                  <th className="px-3 py-2 font-medium">Total %</th>
                  <th className="px-3 py-2 font-medium">Letter</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.studentId} className="hover:bg-slate-50/80">
                    <td className="px-3 py-2 sticky left-0 bg-white">
                      <div className="font-medium text-slate-900">
                        {row.studentName || row.studentId}
                      </div>
                      {row.studentCode && (
                        <div className="text-xs text-slate-400">{row.studentCode}</div>
                      )}
                    </td>
                    {gb?.components?.map((c) => {
                      const e = row.entries[c.key];
                      const marks =
                        e?.overriddenMarks != null ? e.overriddenMarks : e?.rawMarks;
                      return (
                        <td key={c.key} className="px-3 py-2 tabular-nums">
                          {e ? (
                            <span
                              className={
                                e.overriddenMarks != null ? 'text-amber-700 font-medium' : ''
                              }
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
                    <td className="px-3 py-2 font-medium tabular-nums">
                      {row.total?.weightedPercent != null
                        ? `${row.total.weightedPercent}%`
                        : '—'}
                    </td>
                    <td className="px-3 py-2">{row.total?.letterGrade || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {canManage && gb?.status !== 'published' && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 max-w-xl">
            <h3 className="font-medium text-sm text-slate-800">Override marks</h3>
            <div className="grid grid-cols-2 gap-2">
              <select
                className="border rounded-lg px-2 py-1.5 text-sm"
                value={overrideStudent}
                onChange={(e) => setOverrideStudent(e.target.value)}
              >
                <option value="">Student</option>
                {rows.map((r) => (
                  <option key={r.studentId} value={r.studentId}>
                    {r.studentName || r.studentId}
                  </option>
                ))}
              </select>
              <select
                className="border rounded-lg px-2 py-1.5 text-sm"
                value={overrideKey}
                onChange={(e) => setOverrideKey(e.target.value)}
              >
                <option value="">Component</option>
                {gb?.components?.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                className="border rounded-lg px-2 py-1.5 text-sm"
                placeholder="Marks"
                value={overrideMarks}
                onChange={(e) => setOverrideMarks(e.target.value)}
              />
              <input
                className="border rounded-lg px-2 py-1.5 text-sm"
                placeholder="Reason"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
              />
            </div>
            <button
              className="px-3 py-1.5 text-sm rounded-lg bg-slate-800 text-white disabled:opacity-50"
              disabled={!overrideStudent || !overrideKey || overrideMarks === ''}
              onClick={() => overrideMut.mutate()}
            >
              Save override
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default GradebookDetailPage;
