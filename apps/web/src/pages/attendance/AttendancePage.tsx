import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type {
  ApiResponse,
  AttendanceSessionPublic,
  AttendanceSummaryPublic,
  CourseListItem,
} from '@university-lms/shared';
import { useAuthStore } from '../../stores/authStore';
import { AppLayout } from '../../components/layout/AppLayout';

export function AttendancePage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [courseId, setCourseId] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [sessionType, setSessionType] = useState('lecture');
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [showShortage, setShowShortage] = useState(false);

  const canManage = user?.roles?.some((r) =>
    ['faculty', 'tenant_admin', 'university_admin', 'super_admin'].includes(r)
  );
  const isStudent =
    user?.roles?.includes('student') &&
    !user?.roles?.some((r) =>
      ['faculty', 'tenant_admin', 'university_admin', 'super_admin'].includes(r)
    );

  const { data: courses = [] } = useQuery({
    queryKey: ['courses', 'for-att'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CourseListItem[]>>('/courses', {
        params: { limit: 100 },
      });
      return data.data ?? [];
    },
  });

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['attendance-sessions', courseId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<AttendanceSessionPublic[]>>(
        '/attendance/sessions',
        { params: { limit: 50, courseId: courseId || undefined } }
      );
      return data.data ?? [];
    },
    enabled: !isStudent,
  });

  const { data: shortage = [] } = useQuery({
    queryKey: ['attendance-shortage', courseId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<AttendanceSummaryPublic[]>>(
        '/attendance/shortage-report',
        { params: { courseId } }
      );
      return data.data ?? [];
    },
    enabled: !!courseId && !!canManage && showShortage,
  });

  const { data: myAtt } = useQuery({
    queryKey: ['my-attendance', courseId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<any>>('/attendance/me', {
        params: { courseId: courseId || undefined },
      });
      return data.data;
    },
    enabled: !!isStudent,
  });

  const createMut = useMutation({
    mutationFn: async () => {
      if (!courseId) throw new Error('Select course');
      await api.post('/attendance/sessions', {
        courseId,
        date,
        sessionType,
        title: title || undefined,
        topic: topic || undefined,
        method: 'manual',
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance-sessions'] });
      setShowCreate(false);
      setTitle('');
      setTopic('');
    },
  });

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold text-slate-900">Attendance</h1>
          <select
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm min-w-[200px]"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
          >
            <option value="">{isStudent ? 'All enrolled' : 'All courses'}</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {(c as any).code || ''} — {c.name}
              </option>
            ))}
          </select>
          {canManage && (
            <>
              <button
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200"
                disabled={!courseId}
                onClick={() => setShowShortage((v) => !v)}
              >
                {showShortage ? 'Hide shortage' : 'Shortage report'}
              </button>
              <button
                className="ml-auto px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white"
                onClick={() => setShowCreate((v) => !v)}
              >
                {showCreate ? 'Cancel' : 'New session'}
              </button>
            </>
          )}
        </div>

        {isStudent && myAtt && (
          <div className="space-y-4">
            {myAtt.summary && !Array.isArray(myAtt.summaries) && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex gap-8">
                  <div>
                    <div className="text-xs text-slate-500">Attendance</div>
                    <div
                      className={`text-3xl font-semibold ${
                        myAtt.summary.isShortage ? 'text-red-600' : 'text-emerald-600'
                      }`}
                    >
                      {myAtt.summary.percent}%
                    </div>
                  </div>
                  <div className="text-sm text-slate-600 space-y-1">
                    <div>Present: {myAtt.summary.presentCount}</div>
                    <div>Late: {myAtt.summary.lateCount}</div>
                    <div>Absent: {myAtt.summary.absentCount}</div>
                    <div>Sessions: {myAtt.summary.totalSessions}</div>
                    <div>Minimum: {myAtt.summary.minimumPercent}%</div>
                  </div>
                </div>
              </div>
            )}
            {Array.isArray(myAtt.summaries) && (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-slate-600">
                    <tr>
                      <th className="px-4 py-2">Course</th>
                      <th className="px-4 py-2">%</th>
                      <th className="px-4 py-2">Present</th>
                      <th className="px-4 py-2">Absent</th>
                      <th className="px-4 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {myAtt.summaries.map((s: AttendanceSummaryPublic) => (
                      <tr key={s.courseId}>
                        <td className="px-4 py-2">{s.courseId}</td>
                        <td className="px-4 py-2 font-medium">{s.percent}%</td>
                        <td className="px-4 py-2">{s.presentCount + s.lateCount}</td>
                        <td className="px-4 py-2">{s.absentCount}</td>
                        <td className="px-4 py-2">
                          {s.isShortage ? (
                            <span className="text-red-600 text-xs font-medium">Shortage</span>
                          ) : (
                            <span className="text-emerald-600 text-xs">OK</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {Array.isArray(myAtt.sessions) && myAtt.sessions.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-slate-600">
                    <tr>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Type</th>
                      <th className="px-4 py-2">Title</th>
                      <th className="px-4 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {myAtt.sessions.map((s: AttendanceSessionPublic) => {
                      const rec = (myAtt.records || []).find(
                        (r: any) => r.sessionId === s.id
                      );
                      return (
                        <tr key={s.id}>
                          <td className="px-4 py-2">
                            {new Date(s.date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2">{s.sessionType}</td>
                          <td className="px-4 py-2">{s.title || s.topic || '—'}</td>
                          <td className="px-4 py-2 capitalize">{rec?.status || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {showCreate && canManage && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3 shadow-sm max-w-lg">
            <h2 className="font-medium">Create attendance session</h2>
            {!courseId && <p className="text-sm text-amber-600">Select a course first.</p>}
            <input
              type="date"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value)}
            >
              <option value="lecture">Lecture</option>
              <option value="lab">Lab</option>
              <option value="tutorial">Tutorial</option>
              <option value="other">Other</option>
            </select>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="Title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="Topic (optional)"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <button
              className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white disabled:opacity-50"
              disabled={!courseId || createMut.isPending}
              onClick={() => createMut.mutate()}
            >
              Create session
            </button>
          </div>
        )}

        {showShortage && canManage && courseId && (
          <div className="bg-white border border-red-100 rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-red-50 text-red-800 text-sm font-medium">
              Students below minimum attendance
            </div>
            {shortage.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">No students in shortage.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-600">
                  <tr>
                    <th className="px-4 py-2">Student</th>
                    <th className="px-4 py-2">%</th>
                    <th className="px-4 py-2">Present</th>
                    <th className="px-4 py-2">Absent</th>
                    <th className="px-4 py-2">Min</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {shortage.map((s) => (
                    <tr key={s.studentId}>
                      <td className="px-4 py-2">
                        {s.studentName || s.studentId}
                        {s.studentCode && (
                          <span className="text-xs text-slate-400 ml-2">{s.studentCode}</span>
                        )}
                      </td>
                      <td className="px-4 py-2 font-medium text-red-600">{s.percent}%</td>
                      <td className="px-4 py-2">{s.presentCount + s.lateCount}</td>
                      <td className="px-4 py-2">{s.absentCount}</td>
                      <td className="px-4 py-2">{s.minimumPercent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {!isStudent && (
          <>
            {isLoading ? (
              <p className="text-sm text-slate-500">Loading…</p>
            ) : sessions.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-200 rounded-xl p-12 text-center text-slate-500">
                No attendance sessions yet.
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600 text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium">Title / Topic</th>
                      <th className="px-4 py-3 font-medium">Marked</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sessions.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3">
                          {new Date(s.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 capitalize">{s.sessionType}</td>
                        <td className="px-4 py-3">{s.title || s.topic || '—'}</td>
                        <td className="px-4 py-3 text-slate-500">
                          {s.presentCount ?? 0}P / {s.absentCount ?? 0}A
                          {s.totalMarked != null ? ` (${s.totalMarked})` : ''}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full border ${
                              s.status === 'open'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            className="text-indigo-600 hover:underline"
                            onClick={() => navigate(`/attendance/sessions/${s.id}`)}
                          >
                            Mark
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        <Link to="/gradebook" className="text-sm text-indigo-600 hover:underline">
          Gradebooks →
        </Link>
      </div>
    </AppLayout>
  );
}

export default AttendancePage;
