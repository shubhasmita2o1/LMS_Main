import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import type { ApiResponse } from '@university-lms/shared';
import { useAuthStore } from '../../stores/authStore';
import {
  Building2,
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck2,
  Award,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface DeptStats {
  totalCourses: number;
  totalStudents: number;
  totalFaculty: number;
  totalUsers: number;
}

interface FacultyCourseItem {
  id: string;
  code: string;
  name: string;
  type?: string;
  credits?: number;
  role?: string;
  isPrimary?: boolean;
  modulesCount: number;
  enrollmentsCount: number;
}

export function DepartmentHeadDashboard() {
  const user = useAuthStore((s) => s.user);

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'stats', 'dept-overview'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<DeptStats>>('/admin/stats/overview');
      return data.data;
    },
  });

  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['faculty', 'me', 'courses'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<FacultyCourseItem[]>>('/faculty/me/courses');
      return data.data || [];
    },
  });

  const stats = statsData;
  const myCourses = coursesData || [];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
              <Building2 className="w-3.5 h-3.5" />
              Department Head Portal
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Welcome, {user?.firstName ? `${user.firstName} ${user.lastName}` : 'Department Head'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Oversee departmental academic governance, faculty teaching workloads, syllabus design, and student outcomes.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            to="/courses"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition"
          >
            <BookOpen className="w-4 h-4 text-primary-600" />
            Curriculum &amp; Syllabi
          </Link>
          <Link
            to="/faculty"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-sm transition"
          >
            <Users className="w-4 h-4" />
            Faculty Roster
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Department Faculty</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {statsLoading ? '—' : stats?.totalFaculty ?? 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            <Link to="/faculty" className="text-primary-600 hover:underline">
              View faculty workload →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Department Students</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {statsLoading ? '—' : stats?.totalStudents ?? 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            <Link to="/students" className="text-primary-600 hover:underline">
              Student cohort registry →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Courses</span>
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {statsLoading ? '—' : stats?.totalCourses ?? 0}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            <Link to="/courses" className="text-primary-600 hover:underline">
              Department courses →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">My Teaching Courses</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CalendarCheck2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {coursesLoading ? '—' : myCourses.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            <span>Direct instructional load</span>
          </div>
        </div>
      </div>

      {/* Department Operations Workflows */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary-600" />
          Department Academic Leadership Workflows
        </h2>
        <p className="text-xs text-slate-500 mb-5">
          Execute curriculum approvals, monitor faculty teaching, and track student outcomes.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Link
            to="/courses"
            className="p-3.5 rounded-xl border border-slate-200 hover:border-primary-500 hover:bg-primary-50/30 transition group flex items-start gap-3"
          >
            <div className="p-2 rounded-lg bg-primary-50 text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-primary-700">Course &amp; Curriculum Design</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Define syllabi, learning modules, and OBE CO-PO targets.</p>
            </div>
          </Link>

          <Link
            to="/faculty"
            className="p-3.5 rounded-xl border border-slate-200 hover:border-primary-500 hover:bg-primary-50/30 transition group flex items-start gap-3"
          >
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-primary-700">Faculty Management</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Assign course instructors, review designations &amp; workloads.</p>
            </div>
          </Link>

          <Link
            to="/students"
            className="p-3.5 rounded-xl border border-slate-200 hover:border-primary-500 hover:bg-primary-50/30 transition group flex items-start gap-3"
          >
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition shrink-0">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-primary-700">Student Directory</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Filter students by batch, section, and enrollment status.</p>
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
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-primary-700">Department Attendance</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Monitor session logs, mark registers, flag shortages.</p>
            </div>
          </Link>

          <Link
            to="/gradebook"
            className="p-3.5 rounded-xl border border-slate-200 hover:border-primary-500 hover:bg-primary-50/30 transition group flex items-start gap-3"
          >
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-primary-700">Gradebook &amp; Transcripts</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Verify internal marks distribution and academic standing.</p>
            </div>
          </Link>

          <Link
            to="/academic"
            className="p-3.5 rounded-xl border border-slate-200 hover:border-primary-500 hover:bg-primary-50/30 transition group flex items-start gap-3"
          >
            <div className="p-2 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-slate-800 group-hover:text-white transition shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-primary-700">Academic Hierarchy</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Manage department programs, batches, and class sections.</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Teaching Courses (if any) */}
      {myCourses.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">My Teaching Courses</h2>
            <Link
              to="/courses"
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              All Courses Directory <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myCourses.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-primary-50 text-primary-700">
                      {c.code}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{c.credits ?? 3} Credits</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2">
                    {c.name}
                  </h3>
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                    <div className="bg-slate-50 rounded-lg p-2">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Students</span>
                      <span className="font-bold text-slate-800 text-sm">{c.enrollmentsCount}</span>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Modules</span>
                      <span className="font-bold text-slate-800 text-sm">{c.modulesCount}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <Link
                    to={`/learn/courses/${c.id}`}
                    className="text-primary-600 hover:text-primary-700 font-semibold"
                  >
                    LMS Content →
                  </Link>
                  <Link
                    to={`/attendance?courseId=${c.id}`}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    Attendance
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
