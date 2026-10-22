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
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-primary-100 text-primary-800">
              <GraduationCap className="w-3.5 h-3.5" />
              Student Academic Workspace
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Hello, {user?.firstName ? `${user.firstName} ${user.lastName}` : 'Student'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Track your course progress, attend scheduled lectures, and stay ahead of assignments.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            to="/gradebook/transcript"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition"
          >
            <Award className="w-4 h-4 text-amber-600" />
            My Transcript
          </Link>
          <Link
            to="/attendance"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-sm transition"
          >
            <CalendarCheck2 className="w-4 h-4" />
            Attendance Record
          </Link>
        </div>
      </div>

      {/* Continue Learning Hero Banner (if courses exist) */}
      {resumeCourse && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-900 via-primary-800 to-slate-900 text-white p-6 sm:p-8 shadow-sm">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 text-primary-200 backdrop-blur-sm mb-3">
              <PlayCircle className="w-3.5 h-3.5" />
              Continue Learning
            </div>
            <p className="text-xs font-mono text-primary-200 font-semibold uppercase tracking-wider">
              {resumeCourse.course.code}
            </p>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
              {resumeCourse.course.name}
            </h2>
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-full sm:w-64">
                <div className="flex justify-between text-xs text-primary-200 mb-1 font-medium">
                  <span>Progress</span>
                  <span>{resumeCourse.progress.progressPercent}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/20 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-400 transition-all"
                    style={{ width: `${resumeCourse.progress.progressPercent}%` }}
                  />
                </div>
              </div>
              <Link
                to={`/learn/courses/${resumeCourse.course.id}`}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-primary-50 text-xs font-bold transition shadow-sm"
              >
                Resume Course <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Enrolled Courses</span>
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {summaryLoading ? '—' : summaryData?.enrolledCoursesCount ?? courses.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {summaryData?.completedCoursesCount ? `${summaryData.completedCoursesCount} completed` : 'Active term courses'}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Attendance</span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              avgAttendance !== null && avgAttendance < 75
                ? 'bg-rose-50 text-rose-600'
                : 'bg-emerald-50 text-emerald-600'
            }`}>
              <CalendarCheck2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {attendanceLoading ? '—' : avgAttendance !== null ? `${avgAttendance}%` : 'N/A'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {avgAttendance !== null && avgAttendance < 75 ? (
              <span className="text-rose-600 font-semibold">Below 75% requirement</span>
            ) : (
              <span className="text-emerald-700">Good attendance standing</span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assignments</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {summaryLoading ? '—' : summaryData?.pendingAssignmentsCount ?? 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            <Link to="/assignments" className="text-primary-600 hover:underline">
              Pending submissions →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quizzes &amp; Tests</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {summaryLoading ? '—' : summaryData?.availableQuizzesCount ?? 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            <Link to="/quizzes" className="text-primary-600 hover:underline">
              Available to take →
            </Link>
          </div>
        </div>
      </div>

      {/* Main Section: My Enrolled Courses */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Enrolled Courses</h2>
            <p className="text-xs text-slate-500">
              Your registered curriculum subjects with lesson progress tracking.
            </p>
          </div>
          <Link
            to="/learn/my-courses"
            className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            All Courses <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {coursesLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
            Loading your courses…
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Course Enrollments Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              You are not actively enrolled in any courses. Check with your university registrar
              or ensure your student enrollment is active.
            </p>
            <div className="mt-4">
              <Link
                to="/students/me"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
              >
                View Student Profile
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((item) => (
              <div
                key={item.enrollment.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-primary-50 text-primary-700">
                      {item.course.code}
                    </span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">
                      {item.enrollment.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2">
                    {item.course.name}
                  </h3>

                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-slate-500 mb-1 font-medium">
                      <span>{item.progress.completedLessons} of {item.progress.totalLessons} lessons</span>
                      <span className="font-bold text-slate-800">{item.progress.progressPercent}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary-600 transition-all"
                        style={{ width: `${item.progress.progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <Link
                    to={`/learn/courses/${item.course.id}`}
                    className="text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1"
                  >
                    Open LMS Content →
                  </Link>
                  <Link
                    to={`/attendance?courseId=${item.course.id}`}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    Attendance
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Grid: Quick Study Workflows & Attendance Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Academic Hub */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary-600" />
            Learning &amp; Academic Hub
          </h2>
          <p className="text-xs text-slate-500 mb-5">
            Quick links to study tasks, grading, and assessments.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              to="/assignments"
              className="p-3.5 rounded-xl border border-slate-200 hover:border-primary-500 hover:bg-primary-50/30 transition group flex items-start gap-3"
            >
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition shrink-0">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-primary-700">Assignments</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Submit homework and projects.</p>
              </div>
            </Link>

            <Link
              to="/quizzes"
              className="p-3.5 rounded-xl border border-slate-200 hover:border-primary-500 hover:bg-primary-50/30 transition group flex items-start gap-3"
            >
              <div className="p-2 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition shrink-0">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-primary-700">Quizzes &amp; Tests</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Take self-assessment quizzes.</p>
              </div>
            </Link>

            <Link
              to="/gradebook/transcript"
              className="p-3.5 rounded-xl border border-slate-200 hover:border-primary-500 hover:bg-primary-50/30 transition group flex items-start gap-3"
            >
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-primary-700">Grade Transcript</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">View credits, GPA, and grades.</p>
              </div>
            </Link>

            <Link
              to="/attendance"
              className="p-3.5 rounded-xl border border-slate-200 hover:border-primary-500 hover:bg-primary-50/30 transition group flex items-start gap-3"
            >
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition shrink-0">
                <CalendarCheck2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-primary-700">Attendance Log</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Check session attendance stats.</p>
              </div>
            </Link>

            <Link
              to="/students/me"
              className="p-3.5 rounded-xl border border-slate-200 hover:border-primary-500 hover:bg-primary-50/30 transition group flex items-start gap-3"
            >
              <div className="p-2 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-slate-800 group-hover:text-white transition shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-primary-700">My Student Profile</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Enrollment ID, batch &amp; program.</p>
              </div>
            </Link>

            <Link
              to="/learn/my-courses"
              className="p-3.5 rounded-xl border border-slate-200 hover:border-primary-500 hover:bg-primary-50/30 transition group flex items-start gap-3"
            >
              <div className="p-2 rounded-lg bg-primary-50 text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-primary-700">Course Materials</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Review slides &amp; lecture notes.</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Attendance & Standing */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <CalendarCheck2 className="w-4 h-4 text-emerald-600" />
              Course Attendance Breakdown
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Real-time attendance record per course. Minimum required: 75%.
            </p>

            {attendanceSummaries.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 text-center text-xs text-slate-500">
                No attendance sessions recorded yet for this semester.
              </div>
            ) : (
              <div className="space-y-3">
                {attendanceSummaries.slice(0, 4).map((att) => (
                  <div
                    key={att.courseId}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between"
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
                        att.isShortage ? 'text-rose-600' : 'text-emerald-700'
                      }`}>
                        {att.percent}%
                      </span>
                      {att.isShortage && (
                        <span className="text-[10px] text-rose-500 font-semibold block flex items-center gap-0.5 justify-end">
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
            <Link to="/attendance" className="text-primary-600 hover:text-primary-700 font-semibold">
              View Complete Attendance Record →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
