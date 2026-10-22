import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type { ApiResponse } from '@university-lms/shared';
import { useAuthStore } from '../../stores/authStore';
import { useTenantStore } from '../../stores/tenantStore';
import {
  Users,
  UserCheck,
  BookOpen,
  CalendarCheck2,
  Award,
  Layers,
  Clock,
  ArrowRight,
  Building,
  CheckCircle2,
  XCircle,
  ShieldCheck,
} from 'lucide-react';

interface TenantOverviewStats {
  scope: string;
  tenantId: string;
  totalStudents: number;
  activeStudents: number;
  totalFaculty: number;
  activeFaculty: number;
  totalCourses: number;
  activeCourses: number;
  pendingUsers: number;
  totalUsers: number;
  totalDepartments: number;
  totalPrograms: number;
}

interface PendingUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  createdAt: string;
}

export function TenantAdminDashboard() {
  const user = useAuthStore((s) => s.user);
  const { currentTenant, currentCampus, academicYear, currentTerm } = useTenantStore();
  const qc = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'stats', 'overview', currentTenant?.id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<TenantOverviewStats>>('/admin/stats/overview');
      return data.data;
    },
  });

  const { data: pendingUsersData, isLoading: pendingLoading } = useQuery({
    queryKey: ['users', 'pending'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PendingUser[]>>('/users/pending', {
        params: { limit: 5 },
      });
      return data.data || [];
    },
  });

  const approveMut = useMutation({
    mutationFn: async (userId: string) => {
      await api.post(`/users/${userId}/approve`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users', 'pending'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats', 'overview'] });
    },
  });

  const rejectMut = useMutation({
    mutationFn: async (userId: string) => {
      await api.post(`/users/${userId}/reject`, { reason: 'Rejected from dashboard' });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users', 'pending'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats', 'overview'] });
    },
  });

  const pendingUsers = pendingUsersData || [];

  return (
    <div className="space-y-8 pb-12">
      {/* Executive Welcome & Institutional Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <Building className="w-3.5 h-3.5" />
              {currentTenant?.name || 'University'} ({currentTenant?.code || 'MAIN'})
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
              {currentCampus?.name || 'Main Campus'}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
              <Clock className="w-3.5 h-3.5" />
              {academicYear} • {currentTerm}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Welcome, {user?.firstName} {user?.lastName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Academic Operations & Institutional Administration Dashboard
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/academic"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-sm transition"
          >
            <Layers className="w-4 h-4" />
            <span>Academic Tree</span>
          </Link>
          <Link
            to="/students"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition bg-white"
          >
            <Users className="w-4 h-4" />
            <span>Student SIS</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/students"
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-primary-400 transition group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Enrolled Students
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">
              {statsLoading ? '…' : stats?.activeStudents ?? stats?.totalStudents ?? 0}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              / {statsLoading ? '…' : stats?.totalStudents ?? 0} total
            </span>
          </div>
          <span className="text-[11px] font-semibold text-primary-600 group-hover:underline mt-1 block">
            Manage SIS directory →
          </span>
        </Link>

        <Link
          to="/faculty"
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-primary-400 transition group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Teaching Faculty
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">
              {statsLoading ? '…' : stats?.activeFaculty ?? stats?.totalFaculty ?? 0}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              / {statsLoading ? '…' : stats?.totalFaculty ?? 0} total
            </span>
          </div>
          <span className="text-[11px] font-semibold text-primary-600 group-hover:underline mt-1 block">
            Manage faculty directory →
          </span>
        </Link>

        <Link
          to="/courses"
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-primary-400 transition group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Courses
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">
              {statsLoading ? '…' : stats?.activeCourses ?? stats?.totalCourses ?? 0}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              / {statsLoading ? '…' : stats?.totalCourses ?? 0} total
            </span>
          </div>
          <span className="text-[11px] font-semibold text-primary-600 group-hover:underline mt-1 block">
            Curriculum & offerings →
          </span>
        </Link>

        <Link
          to="/users"
          className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-amber-400 transition group block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending Approvals
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">
              {statsLoading ? '…' : stats?.pendingUsers ?? 0}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-amber-700 group-hover:underline mt-1 block">
            Review registration requests →
          </span>
        </Link>
      </div>

      {/* Pending Approvals Widget */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Pending User Approvals</h2>
            <p className="text-xs text-slate-500">
              Institutional registrations awaiting verification and role assignment
            </p>
          </div>
          <Link
            to="/users"
            className="text-xs font-bold text-primary-700 hover:text-primary-800 flex items-center gap-1"
          >
            <span>View All Approvals</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {pendingLoading && (
            <div className="p-8 text-center text-xs text-slate-400">Loading pending requests…</div>
          )}

          {!pendingLoading && pendingUsers.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400">
              No pending user approvals at this time. All campus registrations are up to date!
            </div>
          )}

          {pendingUsers.map((p) => (
            <div key={p.id} className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                    {p.firstName} {p.lastName}
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {p.roles?.[0] || 'User'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{p.email}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => approveMut.mutate(p.id)}
                  disabled={approveMut.isPending}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve</span>
                </button>
                <button
                  type="button"
                  onClick={() => rejectMut.mutate(p.id)}
                  disabled={rejectMut.isPending}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1 disabled:opacity-50"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Core Academic Operations Shortcuts */}
      <div>
        <h2 className="text-sm font-bold text-slate-900 mb-3">Academic Management Suites</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/academic"
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-primary-400 transition shadow-xs group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-primary-700 transition">
              Academic Hierarchy
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Campuses, schools, departments, degree programs, batches, and sections.
            </p>
          </Link>

          <Link
            to="/courses"
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-primary-400 transition shadow-xs group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-primary-700 transition">
              Curriculum & Courses
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Manage course codes, OBE outcome mappings, syllabus modules, and running offerings.
            </p>
          </Link>

          <Link
            to="/attendance"
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-primary-400 transition shadow-xs group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <CalendarCheck2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-primary-700 transition">
              Attendance Register
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Course attendance registers, session marking, percentage summaries, and shortage lists.
            </p>
          </Link>

          <Link
            to="/gradebook"
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-primary-400 transition shadow-xs group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-primary-700 transition">
              Gradebook & Results
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Course gradebooks, score sheets, 10-point letter grading, and publishing transcripts.
            </p>
          </Link>

          <Link
            to="/question-bank"
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-primary-400 transition shadow-xs group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-primary-700 transition">
              Question Bank
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Repository of MCQ, true/false, subjective, and numerical questions with Bloom rubrics.
            </p>
          </Link>

          <Link
            to="/settings"
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-primary-400 transition shadow-xs group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-primary-700 transition">
              Tenant Settings & Governance
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Tenant academic policies, minimum attendance percentage, grading scale, and terms.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
