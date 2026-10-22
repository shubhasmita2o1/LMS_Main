import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import type { ApiResponse, EnrolledCourseWithProgress } from '@university-lms/shared';
import { useAuthStore } from '../../stores/authStore';
import {
  BookOpen,
  CalendarCheck2,
  FileCheck2,
  HelpCircle,
  Award,
  PlayCircle,
  GraduationCap,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';
import {
  PageShell,
  SectionHeader,
  KpiCard,
  SurfaceCard,
  PillButton,
  StatusBadge,
  EmptyState,
} from '../../components/ui';

interface StudentDashboardSummary {
  enrolledCoursesCount: number;
  completedCoursesCount: number;
  pendingAssignmentsCount: number;
  availableQuizzesCount: number;
}

interface AttendanceCourseSummary {
  courseId: string;
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  percent: number;
  isShortage: boolean;
  minimumPercent: number;
}

interface AttendanceMeResponse {
  summaries?: AttendanceCourseSummary[];
}

export function StudentDashboard() {
  const user = useAuthStore((s) => s.user);

  // 1. Summary stats
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['students', 'me', 'dashboard-summary'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<StudentDashboardSummary>>('/students/me/dashboard-summary');
      return data.data;
    },
  });

  // 2. Enrolled courses with lesson progress
  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['learn', 'my-courses'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<EnrolledCourseWithProgress[]>>('/learn/my-courses');
      return data.data || [];
    },
  });

  // 3. Attendance summaries
  const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: ['attendance', 'me', 'summary'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<AttendanceMeResponse>>('/attendance/me');
      return data.data;
    },
  });

  const courses = coursesData || [];
  const attendanceSummaries = attendanceData?.summaries || [];

  // Compute overall attendance average
  const avgAttendance = attendanceSummaries.length > 0
    ? Math.round(
        attendanceSummaries.reduce((sum, s) => sum + s.percent, 0) / attendanceSummaries.length
      )
    : null;

  // In-progress course for continue learning banner
  const resumeCourse = courses.find((c) => c.progress.progressPercent < 100) || courses[0];

  return (
    <PageShell>
      {/* Header */}
      <SectionHeader
        badge={
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#eaf5ee] text-[#165239]">
            <GraduationCap className="w-3.5 h-3.5" />
            Student Academic Workspace
          </span>
        }
        title={`Hello, ${user?.firstName ? `${user.firstName} ${user.lastName}` : 'Student'}`}
        description="Track your course progress, attend scheduled lectures, and stay ahead of assignments."
        actions={
          <div className="flex items-center gap-2.5">
            <PillButton to="/gradebook/transcript" variant="secondary" icon={Award}>
              My Transcript
            </PillButton>
            <PillButton to="/attendance" variant="primary" icon={CalendarCheck2}>
              Attendance Record
            </PillButton>
          </div>
        }
      />

      {/* Donezo Continue Learning Hero Banner (if courses exist) */}
      {resumeCourse && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#165239] via-[#11402c] to-[#0a271b] text-white p-6 sm:p-8 shadow-card">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/10 text-emerald-300 backdrop-blur-sm mb-3">
              <PlayCircle className="w-3.5 h-3.5 text-emerald-300" />
              Continue Learning
            </div>
            <p className="text-xs font-mono text-emerald-200/90 font-semibold uppercase tracking-wider">
              {resumeCourse.course.code}
            </p>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
              {resumeCourse.course.name}
            </h2>
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-full sm:w-64">
                <div className="flex justify-between text-xs text-emerald-100 mb-1.5 font-medium">
                  <span>Progress</span>
                  <span className="font-bold">{resumeCourse.progress.progressPercent}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-white/20 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#4ade80] transition-all duration-300"
                    style={{ width: `${resumeCourse.progress.progressPercent}%` }}
                  />
                </div>
              </div>
              <Link
                to={`/learn/courses/${resumeCourse.course.id}`}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white text-slate-900 hover:bg-emerald-50 text-xs font-bold transition shadow-cardHover"
              >
                <span>Resume Course</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#165239]" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Donezo Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Enrolled Courses"
          value={summaryLoading ? '—' : summaryData?.enrolledCoursesCount ?? courses.length}
          hint={summaryData?.completedCoursesCount ? `${summaryData.completedCoursesCount} completed` : 'Active term courses'}
          icon={BookOpen}
          variant="primary"
          to="/learn/my-courses"
        />

        <KpiCard
          title="Overall Attendance"
          value={attendanceLoading ? '—' : avgAttendance !== null ? `${avgAttendance}%` : 'N/A'}
          hint={avgAttendance !== null && avgAttendance < 75 ? 'Below 75% requirement' : 'Good attendance standing'}
          icon={CalendarCheck2}
          variant="default"
          to="/attendance"
          badge={avgAttendance !== null && avgAttendance < 75 ? 'Shortage Warning' : 'Good Standing'}
          badgeVariant={avgAttendance !== null && avgAttendance < 75 ? 'danger' : 'success'}
        />

        <KpiCard
          title="Assignments"
          value={summaryLoading ? '—' : summaryData?.pendingAssignmentsCount ?? 0}
          hint="Pending submissions"
          icon={FileCheck2}
          variant="default"
          to="/assignments"
          badge={summaryData?.pendingAssignmentsCount ? `${summaryData.pendingAssignmentsCount} Due` : undefined}
          badgeVariant="warning"
        />

        <KpiCard
          title="Quizzes &amp; Tests"
          value={summaryLoading ? '—' : summaryData?.availableQuizzesCount ?? 0}
          hint="Available to attempt"
          icon={HelpCircle}
          variant="default"
          to="/quizzes"
        />
      </div>

      {/* Main Section: My Enrolled Courses */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-base font-bold text-slate-900">Enrolled Courses</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Your registered curriculum subjects with lesson progress tracking.
            </p>
          </div>
          <Link
            to="/learn/my-courses"
            className="text-xs font-semibold text-[#165239] hover:text-[#1f6b4c] flex items-center gap-1.5 transition"
          >
            <span>All Courses</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {coursesLoading ? (
          <SurfaceCard className="text-center py-12 text-slate-400 text-sm">
            Loading your courses…
          </SurfaceCard>
        ) : courses.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No Course Enrollments Yet"
            description="You are not actively enrolled in any courses. Check with your university registrar or ensure your student enrollment is active."
            action={
              <PillButton to="/students/me" variant="primary">
                View Student Profile
              </PillButton>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((item) => (
              <SurfaceCard
                key={item.enrollment.id}
                interactive={true}
                className="flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#eaf5ee] text-[#165239]">
                      {item.course.code}
                    </span>
                    <StatusBadge
                      label={item.enrollment.status}
                      variant="neutral"
                      size="sm"
                    />
                  </div>

                  <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2">
                    {item.course.name}
                  </h3>

                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-slate-500 mb-1.5 font-medium">
                      <span>{item.progress.completedLessons} of {item.progress.totalLessons} lessons</span>
                      <span className="font-bold text-slate-800">{item.progress.progressPercent}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#165239] transition-all duration-300"
                        style={{ width: `${item.progress.progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <PillButton to={`/learn/courses/${item.course.id}`} variant="primary" size="sm">
                    Open LMS
                  </PillButton>
                  <PillButton to={`/attendance?courseId=${item.course.id}`} variant="outline" size="sm">
                    Attendance
                  </PillButton>
                </div>
              </SurfaceCard>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Grid: Quick Study Workflows & Attendance Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Academic Hub */}
        <SurfaceCard>
          <div className="mb-5">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#165239]" />
              Learning &amp; Academic Hub
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Quick links to study tasks, grading, and assessments.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              to="/assignments"
              className="p-3.5 rounded-2xl border border-slate-200/80 hover:border-[#165239] hover:bg-[#eaf5ee]/30 transition group flex items-start gap-3"
            >
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-[#165239] group-hover:text-white transition shrink-0">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#165239]">Assignments</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">Submit homework and projects.</p>
              </div>
            </Link>

            <Link
              to="/quizzes"
              className="p-3.5 rounded-2xl border border-slate-200/80 hover:border-[#165239] hover:bg-[#eaf5ee]/30 transition group flex items-start gap-3"
            >
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-[#165239] group-hover:text-white transition shrink-0">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#165239]">Quizzes &amp; Tests</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">Take self-assessment quizzes.</p>
              </div>
            </Link>

            <Link
              to="/gradebook/transcript"
              className="p-3.5 rounded-2xl border border-slate-200/80 hover:border-[#165239] hover:bg-[#eaf5ee]/30 transition group flex items-start gap-3"
            >
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-[#165239] group-hover:text-white transition shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#165239]">Grade Transcript</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">View credits, GPA, and grades.</p>
              </div>
            </Link>

            <Link
              to="/attendance"
              className="p-3.5 rounded-2xl border border-slate-200/80 hover:border-[#165239] hover:bg-[#eaf5ee]/30 transition group flex items-start gap-3"
            >
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-[#165239] group-hover:text-white transition shrink-0">
                <CalendarCheck2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#165239]">Attendance Log</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">Check session attendance stats.</p>
              </div>
            </Link>

            <Link
              to="/students/me"
              className="p-3.5 rounded-2xl border border-slate-200/80 hover:border-[#165239] hover:bg-[#eaf5ee]/30 transition group flex items-start gap-3"
            >
              <div className="p-2 rounded-xl bg-slate-100 text-slate-700 group-hover:bg-slate-800 group-hover:text-white transition shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#165239]">My Student Profile</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">Enrollment ID, batch &amp; program.</p>
              </div>
            </Link>

            <Link
              to="/learn/my-courses"
              className="p-3.5 rounded-2xl border border-slate-200/80 hover:border-[#165239] hover:bg-[#eaf5ee]/30 transition group flex items-start gap-3"
            >
              <div className="p-2 rounded-xl bg-emerald-50 text-[#165239] group-hover:bg-[#165239] group-hover:text-white transition shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#165239]">Course Materials</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">Review slides &amp; lecture notes.</p>
              </div>
            </Link>
          </div>
        </SurfaceCard>

        {/* Attendance & Standing */}
        <SurfaceCard className="flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CalendarCheck2 className="w-4 h-4 text-[#165239]" />
                Course Attendance Breakdown
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time attendance record per course. Minimum required: 75%.
              </p>
            </div>

            {attendanceSummaries.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center text-xs text-slate-500">
                No attendance sessions recorded yet for this semester.
              </div>
            ) : (
              <div className="space-y-3">
                {attendanceSummaries.slice(0, 4).map((att) => (
                  <div
                    key={att.courseId}
                    className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-mono text-xs font-bold text-slate-800">
                        Course #{att.courseId.slice(-6)}
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        {att.presentCount} attended / {att.totalSessions} sessions
                      </span>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-extrabold font-mono ${
                        att.isShortage ? 'text-rose-600' : 'text-[#165239]'
                      }`}>
                        {att.percent}%
                      </span>
                      {att.isShortage && (
                        <span className="text-[10px] text-rose-500 font-semibold block flex items-center gap-0.5 justify-end mt-0.5">
                          <AlertTriangle className="w-2.5 h-2.5" /> Shortage
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Need attendance correction?</span>
            <Link to="/attendance" className="text-[#165239] hover:text-[#1f6b4c] font-semibold">
              View Complete Attendance Record →
            </Link>
          </div>
        </SurfaceCard>
      </div>
    </PageShell>
  );
}
export default StudentDashboard;
