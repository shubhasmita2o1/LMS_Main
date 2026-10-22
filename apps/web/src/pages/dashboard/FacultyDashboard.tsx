import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import type { ApiResponse } from '@university-lms/shared';
import { useAuthStore } from '../../stores/authStore';
import {
  BookOpen,
  Users,
  GraduationCap,
  CalendarCheck2,
  FileCheck2,
  HelpCircle,
  Award,
  Layers,
  ArrowRight,
  Plus,
  Clock,
  Sparkles,
  UserCheck,
} from 'lucide-react';

interface FacultyCourseItem {
  id: string;
  code: string;
  name: string;
  type?: string;
  credits?: number;
  status?: string;
  role?: string;
  isPrimary?: boolean;
  modulesCount: number;
  enrollmentsCount: number;
}

export function FacultyDashboard() {
  const user = useAuthStore((s) => s.user);

  const { data: coursesData, isLoading, error } = useQuery({
    queryKey: ['faculty', 'me', 'courses'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<FacultyCourseItem[]>>('/faculty/me/courses');
      return data.data || [];
    },
  });

  const courses = coursesData || [];
  const totalStudents = courses.reduce((acc, c) => acc + (c.enrollmentsCount || 0), 0);
  const totalModules = courses.reduce((acc, c) => acc + (c.modulesCount || 0), 0);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              <GraduationCap className="w-3.5 h-3.5" />
              Faculty Academic Portal
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {user?.firstName ? `${user.firstName} ${user.lastName}` : 'Professor'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage course curriculum delivery, track student attendance, and evaluate submissions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            to="/attendance"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition"
          >
            <CalendarCheck2 className="w-4 h-4 text-emerald-600" />
            Mark Attendance
          </Link>
          <Link
            to="/assignments"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Create Assignment
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Courses Teaching</span>
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {isLoading ? '—' : courses.length}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span>Assigned instructional load</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Enrolled Students</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {isLoading ? '—' : totalStudents}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span>Across all active sections</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Curriculum Modules</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {isLoading ? '—' : totalModules}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span>Active learning syllabus units</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Instructional Quality</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            OBE
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span>CO-PO Outcomes Mapped</span>
          </div>
        </div>
      </div>

      {/* Main Section: Assigned Courses */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">My Teaching Courses</h2>
            <p className="text-xs text-slate-500">
              Live courses assigned to you for teaching, syllabus management, and student assessments.
            </p>
          </div>
          <Link
            to="/courses"
            className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            All Courses Directory <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
            Loading your assigned courses…
          </div>
        ) : error ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-900 text-sm">
            <p className="font-semibold">Unable to load assigned courses</p>
            <p className="text-xs mt-1 text-amber-700">
              Make sure your user account ({user?.email}) is linked to an active faculty record in your institution.
            </p>
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Courses Assigned Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              You haven't been assigned as an instructor to any courses for the current term.
              Contact your Department Head or Academic Administrator to map your teaching workload.
            </p>
            <div className="mt-4">
              <Link
                to="/courses"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
              >
                Browse University Curriculum
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-primary-50 text-primary-700">
                      {course.code}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {course.isPrimary && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Primary
                        </span>
                      )}
                      {course.credits !== undefined && (
                        <span className="text-xs text-slate-400 font-medium">
                          {course.credits} Credits
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2">
                    {course.name}
                  </h3>
                  {course.type && (
                    <p className="text-xs text-slate-500 mt-0.5 capitalize">
                      {course.type} Course
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                    <div className="bg-slate-50 rounded-lg p-2">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Students</span>
                      <span className="font-bold text-slate-800 text-sm">{course.enrollmentsCount}</span>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Modules</span>
                      <span className="font-bold text-slate-800 text-sm">{course.modulesCount}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap gap-2 justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/learn/courses/${course.id}`}
                      className="text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1"
                    >
                      LMS Lessons →
                    </Link>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Link
                      to={`/attendance?courseId=${course.id}`}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                      title="Mark Attendance"
                    >
                      Attendance
                    </Link>
                    <Link
                      to={`/assignments?courseId=${course.id}`}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                      title="Assignments"
                    >
                      Tasks
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fast Shortcuts & Instructional Guidance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Academic Actions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary-600" />
            Instructional Workflows
          </h2>
          <p className="text-xs text-slate-500 mb-5">
            Key daily operations for academic delivery and assessment tracking.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              to="/attendance"
              className="p-3.5 rounded-xl border border-slate-200 hover:border-primary-500 hover:bg-primary-50/30 transition group flex items-start gap-3"
            >
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition shrink-0">
                <CalendarCheck2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-primary-700">Attendance Register</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Take daily attendance by lecture section.</p>
              </div>
            </Link>

            <Link
              to="/assignments"
              className="p-3.5 rounded-xl border border-slate-200 hover:border-primary-500 hover:bg-primary-50/30 transition group flex items-start gap-3"
            >
              <div className="p-2 rounded-lg bg-primary-50 text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition shrink-0">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-primary-700">Assignments &amp; Tasks</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Review submissions &amp; grade homework.</p>
              </div>
            </Link>

            <Link
              to="/quizzes"
              className="p-3.5 rounded-xl border border-slate-200 hover:border-primary-500 hover:bg-primary-50/30 transition group flex items-start gap-3"
            >
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition shrink-0">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-primary-700">Quiz &amp; Tests</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Build auto-graded quizzes and exams.</p>
              </div>
            </Link>

            <Link
              to="/question-bank"
              className="p-3.5 rounded-xl border border-slate-200 hover:border-primary-500 hover:bg-primary-50/30 transition group flex items-start gap-3"
            >
              <div className="p-2 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-primary-700">Question Repository</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Curate Bloom-taxonomy tagged questions.</p>
              </div>
            </Link>

            <Link
              to="/gradebook"
              className="p-3.5 rounded-xl border border-slate-200 hover:border-primary-500 hover:bg-primary-50/30 transition group flex items-start gap-3"
            >
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-primary-700">Gradebook Matrix</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Compute continuous internal assessment.</p>
              </div>
            </Link>

            <Link
              to="/faculty/me"
              className="p-3.5 rounded-xl border border-slate-200 hover:border-primary-500 hover:bg-primary-50/30 transition group flex items-start gap-3"
            >
              <div className="p-2 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-slate-800 group-hover:text-white transition shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-primary-700">My Faculty Profile</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">View employee ID &amp; department details.</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Academic Compliance & Guidelines */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              Academic Term Reminders
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Institutional quality and OBE compliance benchmarks.
            </p>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>Attendance Threshold</span>
                  <span className="text-emerald-700 font-mono">75% Mandatory</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Students below 75% aggregate attendance will be barred from mid-term examinations. Please ensure daily session registers are marked on time.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>OBE Course Outcomes (COs)</span>
                  <span className="text-primary-700 font-mono">Active</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  All assignments and quizzes should be mapped to Course Outcomes (CO1–CO5) for NAAC / NBA direct attainment computation.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>Continuous Assessment Weightage</span>
                  <span className="text-slate-700 font-mono">40% Internal</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Internal marks are automatically calculated based on attendance, quiz attempts, and submitted assignments in the gradebook module.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Need syllabus updates or lab assistance?</span>
            <Link to="/support" className="text-primary-600 hover:text-primary-700 font-semibold">
              Contact Dean's Office →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
