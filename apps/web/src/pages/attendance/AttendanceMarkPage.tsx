import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type {
  ApiResponse,
  AttendanceSessionPublic,
  AttendanceRecordPublic,
  StudentGradeRow,
} from '@university-lms/shared';
import { AppLayout } from '../../components/layout/AppLayout';

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
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/attendance" className="text-sm text-slate-500 hover:text-slate-800">
            ← Attendance
          </Link>
          <h1 className="text-xl font-semibold text-slate-900">
            {session
              ? `${new Date(session.date).toLocaleDateString()} · ${session.sessionType}`
              : 'Mark attendance'}
          </h1>
          {session && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full border ${
                session.status === 'open'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-50 text-slate-600'
              }`}
            >
              {session.status}
            </span>
          )}
        </div>

        {session && (
          <p className="text-sm text-slate-600">
            {session.title || session.topic || 'Session'} · method: {session.method}
          </p>
        )}

        {isLoading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              <button
                className="px-3 py-1 text-xs rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200"
                onClick={() => setAll('present')}
              >
                All present
              </button>
              <button
                className="px-3 py-1 text-xs rounded-md bg-red-50 text-red-700 border border-red-200"
                onClick={() => setAll('absent')}
              >
                All absent
              </button>
              <button
                className="ml-auto px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white disabled:opacity-50"
                disabled={saveMut.isPending || session?.status === 'closed'}
                onClick={() => saveMut.mutate()}
              >
                {saveMut.isPending ? 'Saving…' : 'Save marks'}
              </button>
              {session?.status === 'open' && (
                <button
                  className="px-4 py-2 text-sm rounded-lg border border-slate-300"
                  onClick={() => closeMut.mutate()}
                >
                  Close session
                </button>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Student</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {roster.map((r) => (
                    <tr key={r.studentId} className="hover:bg-slate-50/80">
                      <td className="px-4 py-2">
                        <div className="font-medium">{r.studentName || r.studentId}</div>
                        {r.studentCode && (
                          <div className="text-xs text-slate-400">{r.studentCode}</div>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <select
                          className="border rounded-lg px-2 py-1.5 text-sm"
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
                </tbody>
              </table>
              {roster.length === 0 && (
                <p className="p-6 text-sm text-slate-500 text-center">
                  No enrolled students found for this course.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}

export default AttendanceMarkPage;
