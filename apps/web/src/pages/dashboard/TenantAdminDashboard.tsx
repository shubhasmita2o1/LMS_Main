import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type { ApiResponse } from '@university-lms/shared';
import { useTenantStore } from '../../stores/tenantStore';
import {
  CheckCircle2,
  XCircle,
  Plus,
} from 'lucide-react';
import {
  PageShell,
  SectionHeader,
  KpiCard,
  SurfaceCard,
  PillButton,
  StatusPill,
  AnalyticsBarCard,
  ReminderCard,
  TimeTrackerCard,
  ProgressRing,
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

const DEPT_LEADS = [
  {
    name: 'Dr. Sarah Jenkins',
    duty: 'CSE 2026 Curriculum Review',
    status: 'completed' as const,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=faces',
  },
  {
    name: 'Prof. Ramesh Rao',
    duty: 'OBE Accreditation Mapping',
    status: 'in_progress' as const,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces',
  },
  {
    name: 'Dr. Elena Rostova',
    duty: 'Mid-term Exam Timetable',
    status: 'pending' as const,
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=faces',
  },
  {
    name: 'Marcus Sterling',
    duty: 'Laboratory Equipment Audit',
    status: 'in_progress' as const,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces',
  },
];

export function TenantAdminDashboard() {
  const { currentTenant } = useTenantStore();
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
      {/* Header */}
      <SectionHeader
        title="Dashboard"
        description={`${currentTenant?.name || 'University'} • Plan, prioritize, and accomplish your academic operations.`}
        actions={
          <div className="flex items-center gap-2.5">
            <PillButton to="/courses" variant="primary" icon={Plus}>
              Add Course
            </PillButton>
            <PillButton to="/academic" variant="secondary">
              Academic Tree
            </PillButton>
          </div>
        }
      />

      {/* Donezo Primary KPI Row: 1 Emphasized Deep Green Card + 3 White Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Students"
          value={statsLoading ? '…' : stats?.activeStudents ?? 1240}
          hint="12% Increased from last term"
          variant="emphasis"
          to="/students"
        />

        <KpiCard
          title="Teaching Faculty"
          value={statsLoading ? '…' : stats?.activeFaculty ?? 84}
          hint="4 Joined this month"
          variant="default"
          to="/faculty"
        />

        <KpiCard
          title="Active Courses"
          value={statsLoading ? '…' : stats?.totalCourses ?? 36}
          hint="Curriculum Units live"
          variant="default"
          to="/courses"
        />

        <KpiCard
          title="Pending Approvals"
          value={statsLoading ? '…' : stats?.pendingUsers ?? pendingUsers.length}
          hint="Requires Attention"
          variant="default"
          to="/users"
        />
      </div>

      {/* Middle Grid Row: Analytics + Reminders + Pending Work */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Campus Analytics Pill Bar Chart */}
        <div className="lg:col-span-5">
          <AnalyticsBarCard
            title="Campus Attendance & Activity"
            subtitle="Daily student lecture attendance rate"
          />
        </div>

        {/* Reminders / Senate Meeting Card */}
        <div className="lg:col-span-3">
          <ReminderCard
            label="Reminders"
            title="Academic Senate Board Review"
            time="Time : 02.00 pm - 04.00 pm"
            actionLabel="Start Meeting"
            to="/communication"
          />
        </div>

        {/* Pending Approvals List */}
        <div className="lg:col-span-4">
          <SurfaceCard padding="none" className="h-full flex flex-col justify-between">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Pending Approvals</h3>
                <p className="text-xs text-slate-500">Student & faculty signups</p>
              </div>
              <PillButton to="/users" variant="outline" size="sm">
                View All
              </PillButton>
            </div>

            <div className="p-4 space-y-3 flex-1 overflow-y-auto">
              {pendingLoading ? (
                <div className="py-6 text-center text-xs text-slate-400">Loading pending requests…</div>
              ) : pendingUsers.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  All onboarding requests are cleared.
                </div>
              ) : (
                pendingUsers.slice(0, 4).map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 transition gap-2"
                  >
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {u.firstName} {u.lastName}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                        <span className="font-mono truncate">{u.email}</span>
                        <span>•</span>
                        <span className="capitalize text-slate-600 font-semibold">
                          {u.roles?.[0] || 'Student'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => approveMut.mutate(u.id)}
                        disabled={approveMut.isPending}
                        className="p-1.5 rounded-full text-emerald-600 hover:bg-emerald-50 transition"
                        title="Approve User"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => rejectMut.mutate(u.id)}
                        disabled={rejectMut.isPending}
                        className="p-1.5 rounded-full text-rose-500 hover:bg-rose-50 transition"
                        title="Reject User"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </SurfaceCard>
        </div>
      </div>

      {/* Bottom Grid Row: Team Collaboration + Progress Ring + Time Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Department Leads Team Card */}
        <div className="lg:col-span-5">
          <SurfaceCard padding="none" className="h-full flex flex-col justify-between">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Team Collaboration</h3>
              <PillButton to="/faculty" variant="outline" size="sm" icon={Plus}>
                Add Member
              </PillButton>
            </div>

            <div className="p-4 space-y-3 divide-y divide-slate-50">
              {DEPT_LEADS.map((lead) => (
                <div key={lead.name} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={lead.avatar}
                      alt={lead.name}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{lead.name}</h4>
                      <p className="text-[11px] text-slate-400 truncate">Working on <span className="text-slate-600 font-medium">{lead.duty}</span></p>
                    </div>
                  </div>
                  <StatusPill variant={lead.status}>
                    {lead.status === 'completed'
                      ? 'Completed'
                      : lead.status === 'in_progress'
                      ? 'In Progress'
                      : 'Pending'}
                  </StatusPill>
                </div>
              ))}
            </div>
          </SurfaceCard>
        </div>

        {/* Academic Progress Ring Card */}
        <div className="lg:col-span-4">
          <SurfaceCard className="h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-900">Semester Progress</h3>
              <span className="text-xs font-bold text-[#165239]">Fall 2026</span>
            </div>

            <div className="py-2 flex items-center justify-center">
              <ProgressRing
                percent={68}
                label="Term Ended"
                inProgressPercent={22}
                completedLabel="Delivered"
                inProgressLabel="Ongoing"
                pendingLabel="Scheduled"
              />
            </div>
          </SurfaceCard>
        </div>

        {/* Operations Clock / Time Tracker */}
        <div className="lg:col-span-3">
          <TimeTrackerCard label="Time Tracker" initialSeconds={4890} className="h-full" />
        </div>
      </div>
    </PageShell>
  );
}
export default TenantAdminDashboard;
