import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type {
  ApiResponse,
  AttendanceSessionPublic,
  AttendanceRecordPublic,
} from '@university-lms/shared';
import { AppLayout } from '../../components/layout/AppLayout';
import { PageShell, SurfaceCard, SectionHeader, PillButton, StatusBadge } from '../../components/ui';

type Status = 'present' | 'absent' | 'late' | 'excused' | 'holiday';

export function AttendanceMarkPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [marks, setMarks] = useState<Record<string, Status>>({});
  const [roster, setRoster] = useState<
    Array<{ studentId: string; studentName?: string; studentCode?: string }>
  >([]);

  const { data, isLoading } = useQuery({
    queryKey: ['attendance-session', id],
    queryFn: async () => {
      const { data } = await api.get<
        ApiResponse<{ session: AttendanceSessionPublic; records: AttendanceRecordPublic[] }>
      >(`/attendance/sessions/${id}`);
      return data.data!;
    },
    enabled: !!id,
  });

  // Load enrolled students for the course
  useEffect(() => {
    if (!data?.session?.courseId) return;
    (async () => {
      try {
        const { data: enr } = await api.get<ApiResponse<any[]>>('/courses/enrollments', {
          params: { courseId: data.session.courseId, limit: 200 },
        });
        const items = enr.data ?? [];
        // enrollments may not include names — try students list filtered
        const { data: students } = await api.get<ApiResponse<any[]>>('/students', {
          params: { limit: 200, status: 'active' },
        });
        const studentMap = new Map(
          (students.data ?? []).map((s: any) => [
            s.id,
            {
              name: `${s.firstName || ''} ${s.lastName || ''}`.trim(),
              code: s.rollNumber || s.registrationNumber,
            },
          ])
        );
        const enrolledIds = new Set(
          items.map((e: any) => e.studentId).filter(Boolean)
        );
        const rows =
          enrolledIds.size > 0
            ? [...enrolledIds].map((sid) => ({
                studentId: sid as string,
                studentName: studentMap.get(sid as string)?.name,
                studentCode: studentMap.get(sid as string)?.code,
              }))
            : (students.data ?? []).map((s: any) => ({
                studentId: s.id,
                studentName: `${s.firstName || ''} ${s.lastName || ''}`.trim(),
                studentCode: s.rollNumber || s.registrationNumber,
              }));
        setRoster(rows.sort((a, b) => (a.studentName || '').localeCompare(b.studentName || '')));
      } catch {
        // fallback: only students already marked
        setRoster(
          (data.records || []).map((r) => ({
            studentId: r.studentId,
            studentName: r.studentName,
            studentCode: r.studentCode,
          }))
        );
      }
    })();
  }, [data?.session?.courseId, data?.records]);

  useEffect(() => {
    if (!data?.records) return;
    const initial: Record<string, Status> = {};
    for (const r of data.records) {
      initial[r.studentId] = r.status as Status;
    }
    setMarks((prev) => ({ ...initial, ...prev }));
  }, [data?.records]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const records = Object.entries(marks).map(([studentId, status]) => ({
        studentId,
        status,
      }));
      await api.put(`/attendance/sessions/${id}/records`, { records });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendance-session', id] }),
  });

  const closeMut = useMutation({
    mutationFn: async () => {
      if (!confirm('Close this session?')) return;
      await api.post(`/attendance/sessions/${id}/close`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendance-session', id] }),
  });

  const setAll = (status: Status) => {
    const next: Record<string, Status> = {};
    for (const r of roster) next[r.studentId] = status;
    setMarks(next);
  };

  const session = data?.session;

  return (
    <AppLayout>
      <PageShell>
        <SectionHeader
          title={session ? `${new Date(session.date).toLocaleDateString()} · ${session.sessionType}` : 'Session Attendance'}
          subtitle={session ? `${session.title || session.topic || 'Class Session'} · Method: ${session.method}` : 'Mark and track class attendance'}
          badge={session ? (
            <StatusBadge
              status={session.status === 'open' ? 'success' : 'neutral'}
              label={session.status}
            />
          ) : undefined}
          actions={
            <div className="flex items-center gap-2">
              <PillButton variant="outline" href="/attendance">
                ← Attendance Overview
              </PillButton>
            </div>
          }
        />

        {isLoading ? (
          <SurfaceCard className="py-12 text-center text-xs text-slate-400">
            Loading session roster…
          </SurfaceCard>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <PillButton
                variant="secondary"
                size="sm"
                onClick={() => setAll('present')}
              >
                Mark All Present
              </PillButton>
              <PillButton
                variant="outline"
                size="sm"
                onClick={() => setAll('absent')}
              >
                Mark All Absent
              </PillButton>

              <div className="ml-auto flex items-center gap-2">
                {session?.status === 'open' && (
                  <PillButton
                    variant="outline"
                    size="sm"
                    onClick={() => closeMut.mutate()}
                  >
                    Close Session
                  </PillButton>
                )}
                <PillButton
                  variant="primary"
                  size="sm"
                  disabled={saveMut.isPending || session?.status === 'closed'}
                  loading={saveMut.isPending}
                  onClick={() => saveMut.mutate()}
                >
                  Save Attendance Marks
                </PillButton>
              </div>
            </div>

            <SurfaceCard className="p-0 overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/80 border-b border-slate-200/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Student Name & ID</th>
                    <th className="px-5 py-3.5 text-right">Attendance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {roster.map((r) => (
                    <tr key={r.studentId} className="hover:bg-slate-50/60 transition">
                      <td className="px-5 py-3">
                        <div className="font-bold text-slate-900">{r.studentName || r.studentId}</div>
                        {r.studentCode && (
                          <div className="text-[11px] font-mono text-slate-400">{r.studentCode}</div>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <select
                          className="border border-slate-200 rounded-full px-3 py-1.5 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#165239]/20"
                          value={marks[r.studentId] || 'absent'}
                          disabled={session?.status === 'closed'}
                          onChange={(e) =>
                            setMarks((prev) => ({
                              ...prev,
                              [r.studentId]: e.target.value as Status,
                            }))
                          }
                        >
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                          <option value="late">Late</option>
                          <option value="excused">Excused</option>
                          <option value="holiday">Holiday</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {roster.length === 0 && (
                    <tr>
                      <td colSpan={2} className="p-8 text-center text-slate-400 text-xs">
                        No enrolled students found for this course session.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </SurfaceCard>
          </div>
        )}
      </PageShell>
    </AppLayout>
  );
}

export default AttendanceMarkPage;
