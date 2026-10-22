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
import {
  PageShell,
  SectionHeader,
  SurfaceCard,
  PillButton,
  StatusBadge,
  KpiCard,
  EmptyState,
} from '../../components/ui';
import { CalendarCheck2, Plus, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';

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
      <PageShell>
        {/* Header */}
        <SectionHeader
          title="Attendance Register"
          subtitle="Session registers, real-time classroom check-ins, and mandatory 75% shortage monitoring"
          actions={
            canManage && (
              <div className="flex items-center gap-2.5">
                <PillButton
                  variant="outline"
                  disabled={!courseId}
                  onClick={() => setShowShortage((v) => !v)}
                >
                  {showShortage ? 'Hide Shortage' : 'Shortage Report'}
                </PillButton>
                <PillButton
                  variant={showCreate ? 'secondary' : 'primary'}
                  icon={Plus}
                  onClick={() => setShowCreate((v) => !v)}
                >
                  {showCreate ? 'Cancel' : 'New Session'}
                </PillButton>
              </div>
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
              <option value="">{isStudent ? 'All enrolled courses' : 'All courses'}</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {(c as any).code || ''} — {c.name}
                </option>
              ))}
            </select>
          </div>
        </SurfaceCard>

        {/* Student Attendance Overview Cards */}
        {isStudent && myAtt && (
          <div className="space-y-4">
            {myAtt.summary && !Array.isArray(myAtt.summaries) && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <KpiCard
                  title="My Attendance"
                  value={`${myAtt.summary.percent}%`}
                  hint={myAtt.summary.isShortage ? 'Below minimum threshold' : 'Good attendance status'}
                  icon={CalendarCheck2}
                  variant={myAtt.summary.isShortage ? 'default' : 'primary'}
                  badge={myAtt.summary.isShortage ? 'Shortage Alert' : 'Compliant'}
                  badgeVariant={myAtt.summary.isShortage ? 'danger' : 'success'}
                />
                <KpiCard
                  title="Present & Late"
                  value={myAtt.summary.presentCount + (myAtt.summary.lateCount || 0)}
                  hint="Attended lectures"
                  icon={CheckCircle2}
                  variant="default"
                />
                <KpiCard
                  title="Absent Sessions"
                  value={myAtt.summary.absentCount}
                  hint="Missed lecture sessions"
                  icon={AlertTriangle}
                  variant="default"
                />
                <KpiCard
                  title="Total Sessions"
                  value={myAtt.summary.totalSessions}
                  hint={`Min requirement: ${myAtt.summary.minimumPercent}%`}
                  icon={CalendarCheck2}
                  variant="default"
                />
              </div>
            )}

            {Array.isArray(myAtt.summaries) && (
              <SurfaceCard padding="none">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Per-Course Attendance Breakdown</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="px-5 py-3.5">Course Code</th>
                        <th className="px-5 py-3.5">Percentage</th>
                        <th className="px-5 py-3.5">Present</th>
                        <th className="px-5 py-3.5">Absent</th>
                        <th className="px-5 py-3.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {myAtt.summaries.map((s: AttendanceSummaryPublic) => (
                        <tr key={s.courseId} className="hover:bg-slate-50/70 transition">
                          <td className="px-5 py-3.5 font-mono font-bold text-slate-800">
                            {s.courseId.slice(-6)}
                          </td>
                          <td className="px-5 py-3.5 font-bold font-mono text-sm">
                            <span className={s.isShortage ? 'text-rose-600' : 'text-[#165239]'}>
                              {s.percent}%
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-slate-700">
                            {s.presentCount + s.lateCount}
                          </td>
                          <td className="px-5 py-3.5 text-slate-700">{s.absentCount}</td>
                          <td className="px-5 py-3.5">
                            <StatusBadge
                              label={s.isShortage ? 'Shortage' : 'Compliant'}
                              variant={s.isShortage ? 'danger' : 'success'}
                              size="sm"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SurfaceCard>
            )}
          </div>
        )}

        {/* Creation Form */}
        {showCreate && canManage && (
          <SurfaceCard className="border-[#165239]/30 bg-[#eaf5ee]/20 space-y-4 max-w-xl">
            <h3 className="text-sm font-bold text-slate-900">Create New Attendance Session</h3>
            {!courseId && (
              <p className="text-xs text-amber-700 font-semibold">Please select a course filter first.</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Session Date
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-2 border border-slate-200/80 rounded-full text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#165239]/20 transition"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Session Type
                </label>
                <select
                  className="w-full px-4 py-2 border border-slate-200/80 rounded-full text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#165239]/20 transition"
                  value={sessionType}
                  onChange={(e) => setSessionType(e.target.value)}
                >
                  <option value="lecture">Lecture</option>
                  <option value="lab">Lab</option>
                  <option value="tutorial">Tutorial</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <input
              className="w-full px-4 py-2 border border-slate-200/80 rounded-2xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#165239]/20 transition"
              placeholder="Session Title (optional)…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <input
              className="w-full px-4 py-2 border border-slate-200/80 rounded-2xl text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#165239]/20 transition"
              placeholder="Delivered Syllabus Topic (optional)…"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />

            <div className="pt-2 flex justify-end">
              <PillButton
                variant="primary"
                disabled={!courseId || createMut.isPending}
                loading={createMut.isPending}
                onClick={() => createMut.mutate()}
              >
                Create Session
              </PillButton>
            </div>
          </SurfaceCard>
        )}

        {/* Shortage Report */}
        {showShortage && canManage && courseId && (
          <SurfaceCard padding="none" className="border-rose-200">
            <div className="px-5 py-3.5 bg-rose-50/70 border-b border-rose-100 flex items-center justify-between text-rose-800 text-xs font-bold">
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Students Below 75% Minimum Attendance Requirement
              </span>
              <span className="text-[11px] font-mono">{shortage.length} Students Flagged</span>
            </div>
            {shortage.length === 0 ? (
              <p className="p-6 text-xs text-slate-500 text-center">
                All students currently meet attendance requirements for this course.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-5 py-3">Student</th>
                      <th className="px-5 py-3">Attendance %</th>
                      <th className="px-5 py-3">Attended</th>
                      <th className="px-5 py-3">Absent</th>
                      <th className="px-5 py-3">Required</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {shortage.map((s) => (
                      <tr key={s.studentId} className="hover:bg-slate-50/70 transition">
                        <td className="px-5 py-3 font-bold text-slate-900">
                          {s.studentName || s.studentId}
                          {s.studentCode && (
                            <span className="text-xs text-slate-400 font-mono ml-2 font-normal">
                              ({s.studentCode})
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 font-bold font-mono text-rose-600">
                          {s.percent}%
                        </td>
                        <td className="px-5 py-3 text-slate-700">
                          {s.presentCount + s.lateCount}
                        </td>
                        <td className="px-5 py-3 text-slate-700">{s.absentCount}</td>
                        <td className="px-5 py-3 text-slate-500 font-mono">
                          {s.minimumPercent}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SurfaceCard>
        )}

        {/* Sessions Roster for Faculty/Admin */}
        {!isStudent && (
          <SurfaceCard padding="none">
            {isLoading && (
              <div className="p-8 text-center text-xs text-slate-400">Loading sessions…</div>
            )}

            {!isLoading && sessions.length === 0 && (
              <EmptyState
                icon={CalendarCheck2}
                title="No Attendance Sessions"
                description="No sessions have been scheduled or marked for this course yet."
              />
            )}

            {!isLoading && sessions.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Date</th>
                      <th className="px-5 py-3.5">Type</th>
                      <th className="px-5 py-3.5">Title / Topic</th>
                      <th className="px-5 py-3.5">Marked Summary</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sessions.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-5 py-3.5 font-bold text-slate-900">
                          {new Date(s.date).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3.5 capitalize text-slate-600">
                          {s.sessionType}
                        </td>
                        <td className="px-5 py-3.5 text-slate-800">
                          {s.title || s.topic || '—'}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px]">
                          {s.presentCount ?? 0} Present / {s.absentCount ?? 0} Absent
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge
                            label={s.status}
                            variant={s.status === 'open' ? 'success' : 'neutral'}
                            size="sm"
                          />
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <PillButton
                            variant="primary"
                            size="sm"
                            onClick={() => navigate(`/attendance/sessions/${s.id}`)}
                          >
                            Mark Register
                          </PillButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SurfaceCard>
        )}

        <div className="pt-2 flex justify-end">
          <Link
            to="/gradebook"
            className="text-xs font-bold text-[#165239] hover:text-[#1f6b4c] flex items-center gap-1.5 transition"
          >
            <span>Proceed to Course Gradebooks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </PageShell>
    </AppLayout>
  );
}
export default AttendancePage;
