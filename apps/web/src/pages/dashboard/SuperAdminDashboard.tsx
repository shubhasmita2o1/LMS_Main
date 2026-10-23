import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import type { ApiResponse } from '@university-lms/shared';

import {
  ArrowRight,
  Plus,
  Laptop,
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

interface PlatformOverviewStats {
  scope: string;
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  pendingUsers: number;
  totalCourses: number;
  totalStudents: number;
  totalFaculty: number;
}

interface TenantItem {
  id: string;
  name: string;
  slug: string;
  status: string;
  planTier: string;
  createdAt: string;
}

const ADMIN_TEAM = [
  {
    name: 'Alexandra Deff',
    duty: 'Tenant Database Sharding',
    status: 'completed' as const,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
  },
  {
    name: 'Edwin Adenike',
    duty: 'SSO & SAML 2.0 Auth Gate',
    status: 'in_progress' as const,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces',
  },
  {
    name: 'Isaac Oluwademilorun',
    duty: 'Audit Log Archival Engine',
    status: 'pending' as const,
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop&crop=faces',
  },
  {
    name: 'David Oshodi',
    duty: 'Role Matrix Validation',
    status: 'in_progress' as const,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
  },
];

export function SuperAdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'stats', 'overview'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PlatformOverviewStats>>('/admin/stats/overview');
      return data.data;
    },
  });

  const { data: tenantsData, isLoading: tenantsLoading } = useQuery({
    queryKey: ['admin', 'tenants', 'recent'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<TenantItem[]>>('/tenants', {
        params: { limit: 5, page: 1 },
      });
      return data.data || [];
    },
  });

  const tenants = tenantsData || [];

  return (
    <PageShell>
      {/* Platform Header */}
      <SectionHeader
        title="Dashboard"
        description="Plan, prioritize, and accomplish your tasks with ease."
        actions={
          <div className="flex items-center gap-2.5">
            <PillButton to="/tenants" variant="primary" icon={Plus}>
              Add Project
            </PillButton>
            <PillButton to="/settings" variant="secondary">
              Import Data
            </PillButton>
          </div>
        }
      />

      {/* Donezo Primary KPI Metrics Row: 1 Emphasized Deep Green Card + 3 White Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Projects"
          value={statsLoading ? '…' : stats?.activeTenants ?? 24}
          hint="5 Increased from last month"
          variant="emphasis"
          to="/tenants"
        />

        <KpiCard
          title="Ended Projects"
          value={statsLoading ? '…' : (stats?.totalTenants ?? 10)}
          hint="6 Increased from last month"
          variant="default"
          to="/tenants"
        />

        <KpiCard
          title="Running Projects"
          value={statsLoading ? '…' : stats?.totalCourses ?? 12}
          hint="2 Increased from last month"
          variant="default"
          to="/courses"
        />

        <KpiCard
          title="Pending Project"
          value={statsLoading ? '…' : stats?.pendingUsers ?? 2}
          hint="On Discuss"
          variant="default"
          to="/users"
        />
      </div>

      {/* Middle Grid Row: Analytics + Reminders + Projects/Tenants */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Project Analytics Pill Bar Chart */}
        <div className="lg:col-span-5">
          <AnalyticsBarCard
            title="Project Analytics"
            subtitle="Platform operational traffic by weekday"
          />
        </div>

        {/* Reminders Meeting Card */}
        <div className="lg:col-span-3">
          <ReminderCard
            label="Reminders"
            title="Meeting with Arc Company"
            time="Time : 02.00 pm - 04.00 pm"
            actionLabel="Start Meeting"
            to="/communication"
          />
        </div>

        {/* Projects / University Nodes List Card */}
        <div className="lg:col-span-4">
          <SurfaceCard padding="none" className="h-full flex flex-col justify-between">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Project</h3>
              <PillButton to="/tenants" variant="outline" size="sm" icon={Plus}>
                New
              </PillButton>
            </div>

            <div className="p-4 space-y-3.5 flex-1 overflow-y-auto">
              {tenantsLoading ? (
                <div className="py-6 text-center text-xs text-slate-400">Loading university projects…</div>
              ) : tenants.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">No active projects yet.</div>
              ) : (
                tenants.slice(0, 5).map((t, idx) => {
                  const colors = [
                    'bg-indigo-50 text-indigo-600',
                    'bg-emerald-50 text-[#165239]',
                    'bg-amber-50 text-amber-600',
                    'bg-rose-50 text-rose-600',
                    'bg-cyan-50 text-cyan-600',
                  ];
                  const colorClass = colors[idx % colors.length];

                  return (
                    <Link
                      key={t.id}
                      to="/tenants"
                      className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 transition group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl ${colorClass} flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition`}>
                          <Laptop className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-[#165239] transition">
                            {t.name}
                          </h4>
                          <span className="text-[11px] text-slate-400 block">
                            Due date: Nov 28, 2026
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition shrink-0" />
                    </Link>
                  );
                })
              )}
            </div>
          </SurfaceCard>
        </div>
      </div>

      {/* Bottom Grid Row: Team Collaboration + Progress Ring + Time Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Team Collaboration Card */}
        <div className="lg:col-span-5">
          <SurfaceCard padding="none" className="h-full flex flex-col justify-between">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Team Collaboration</h3>
              <PillButton to="/users" variant="outline" size="sm" icon={Plus}>
                Add Member
              </PillButton>
            </div>

            <div className="p-4 space-y-3 divide-y divide-slate-50">
              {ADMIN_TEAM.map((member) => (
                <div key={member.name} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{member.name}</h4>
                      <p className="text-[11px] text-slate-400 truncate">Working on <span className="text-slate-600 font-medium">{member.duty}</span></p>
                    </div>
                  </div>
                  <StatusPill variant={member.status}>
                    {member.status === 'completed'
                      ? 'Completed'
                      : member.status === 'in_progress'
                      ? 'In Progress'
                      : 'Pending'}
                  </StatusPill>
                </div>
              ))}
            </div>
          </SurfaceCard>
        </div>

        {/* Project Progress Gauge Card */}
        <div className="lg:col-span-4">
          <SurfaceCard className="h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-900">Project Progress</h3>
              <span className="text-xs font-bold text-[#165239]">Q4 Milestones</span>
            </div>

            <div className="py-2 flex items-center justify-center">
              <ProgressRing
                percent={41}
                label="Project Ended"
                inProgressPercent={35}
                completedLabel="Completed"
                inProgressLabel="In Progress"
                pendingLabel="Pending"
              />
            </div>
          </SurfaceCard>
        </div>

        {/* Time Tracker Card */}
        <div className="lg:col-span-3">
          <TimeTrackerCard label="Time Tracker" initialSeconds={5048} className="h-full" />
        </div>
      </div>
    </PageShell>
  );
}
export default SuperAdminDashboard;
