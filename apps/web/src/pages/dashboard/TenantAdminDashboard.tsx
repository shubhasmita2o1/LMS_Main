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
import {
  PageShell,
  SectionHeader,
  KpiCard,
  SurfaceCard,
  PillButton,
  StatusBadge,
} from '../../components/ui';

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
    <PageShell>
      {/* Executive Welcome & Institutional Context */}
      <SectionHeader
        badge={
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#eaf5ee] text-[#165239] border border-emerald-200/50">
              <Building className="w-3.5 h-3.5" />
              {currentTenant?.name || 'University'} ({currentTenant?.code || 'MAIN'})
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
              {currentCampus?.name || 'Main Campus'}
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#165239]">
              <Clock className="w-3.5 h-3.5 text-[#165239]" />
              {academicYear} • {currentTerm}
            </span>
          </div>
        }
        title={`Welcome, ${user?.firstName || 'Administrator'} ${user?.lastName || ''}`}
        description="Academic Operations & Institutional Administration Dashboard"
        actions={
          <div className="flex items-center gap-2.5">
            <PillButton to="/academic" variant="primary" icon={Layers}>
              Academic Tree
            </PillButton>
            <PillButton to="/students" variant="secondary" icon={Users}>
              Student SIS
            </PillButton>
          </div>
        }
      />

      {/* Donezo Primary KPI Row: 1 Emphasized Deep Green Card + 3 White Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Enrolled Students"
          value={statsLoading ? '…' : stats?.activeStudents ?? stats?.totalStudents ?? 0}
          hint={`/ ${statsLoading ? '…' : stats?.totalStudents ?? 0} total enrolled`}
          icon={Users}
          variant="primary"
          to="/students"
        />

        <KpiCard
          title="Teaching Faculty"
          value={statsLoading ? '…' : stats?.activeFaculty ?? stats?.totalFaculty ?? 0}
          hint={`/ ${statsLoading ? '…' : stats?.totalFaculty ?? 0} total active`}
          icon={UserCheck}
          variant="default"
          to="/faculty"
        />

        <KpiCard
          title="Active Courses"
          value={statsLoading ? '…' : stats?.activeCourses ?? stats?.totalCourses ?? 0}
          hint={`/ ${statsLoading ? '…' : stats?.totalCourses ?? 0} total offerings`}
          icon={BookOpen}
          variant="default"
          to="/courses"
        />

        <KpiCard
          title="Pending Approvals"
          value={statsLoading ? '…' : stats?.pendingUsers ?? 0}
          hint="Review registration requests"
          icon={Clock}
          variant="default"
          to="/users"
          badge={stats?.pendingUsers ? `${stats.pendingUsers} Pending` : undefined}
          badgeVariant="warning"
        />
      </div>

      {/* Pending Approvals Widget */}
      <SurfaceCard padding="none">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Pending User Approvals</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Institutional registrations awaiting verification and role assignment
            </p>
          </div>
          <Link
            to="/users"
            className="text-xs font-bold text-[#165239] hover:text-[#1f6b4c] flex items-center gap-1.5 transition"
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
            <div
              key={p.id}
              className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                    {p.firstName} {p.lastName}
                  </span>
                  <StatusBadge
                    label={p.roles?.[0] || 'User'}
                    variant="neutral"
                    size="sm"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{p.email}</p>
              </div>

              <div className="flex items-center gap-2">
                <PillButton
                  variant="primary"
                  size="sm"
                  icon={CheckCircle2}
                  onClick={() => approveMut.mutate(p.id)}
                  loading={approveMut.isPending}
                >
                  Approve
                </PillButton>
                <PillButton
                  variant="outline"
                  size="sm"
                  icon={XCircle}
                  onClick={() => rejectMut.mutate(p.id)}
                  loading={rejectMut.isPending}
                >
                  Reject
                </PillButton>
              </div>
            </div>
          ))}
        </div>
      </SurfaceCard>

      {/* Core Academic Operations Suites */}
      <div>
        <h2 className="text-sm font-bold text-slate-900 mb-3 px-1">Academic Management Suites</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SurfaceCard interactive={true} className="group">
            <Link to="/academic" className="block">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <Layers className="w-5 h-5 text-[#165239]" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#165239] transition">
                Academic Hierarchy
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Campuses, schools, departments, degree programs, batches, and sections.
              </p>
            </Link>
          </SurfaceCard>

          <SurfaceCard interactive={true} className="group">
            <Link to="/courses" className="block">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#165239] transition">
                Curriculum &amp; Courses
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Manage course codes, OBE outcome mappings, syllabus modules, and running offerings.
              </p>
            </Link>
          </SurfaceCard>

          <SurfaceCard interactive={true} className="group">
            <Link to="/attendance" className="block">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <CalendarCheck2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#165239] transition">
                Attendance Register
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Course attendance registers, session marking, percentage summaries, and shortage lists.
              </p>
            </Link>
          </SurfaceCard>

          <SurfaceCard interactive={true} className="group">
            <Link to="/gradebook" className="block">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#165239] transition">
                Gradebook &amp; Results
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Course gradebooks, score sheets, 10-point letter grading, and publishing transcripts.
              </p>
            </Link>
          </SurfaceCard>

          <SurfaceCard interactive={true} className="group">
            <Link to="/question-bank" className="block">
              <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#165239] transition">
                Question Bank
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Repository of MCQ, true/false, subjective, and numerical questions with Bloom rubrics.
              </p>
            </Link>
          </SurfaceCard>

          <SurfaceCard interactive={true} className="group">
            <Link to="/settings" className="block">
              <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#165239] transition">
                Tenant Settings &amp; Governance
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Tenant academic policies, minimum attendance percentage, grading scale, and terms.
              </p>
            </Link>
          </SurfaceCard>
        </div>
      </div>
    </PageShell>
  );
}
export default TenantAdminDashboard;
