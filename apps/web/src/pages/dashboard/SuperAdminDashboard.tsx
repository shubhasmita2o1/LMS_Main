import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import type { ApiResponse } from '@university-lms/shared';
import { useAuthStore } from '../../stores/authStore';
import {
  Building,
  Users,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  Settings,
  Clock,
} from 'lucide-react';
import {
  PageShell,
  SectionHeader,
  KpiCard,
  SurfaceCard,
  PillButton,
  StatusBadge,
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

export function SuperAdminDashboard() {
  const user = useAuthStore((s) => s.user);

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
        badge={
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#eaf5ee] text-[#165239]">
            <ShieldCheck className="w-3.5 h-3.5" />
            Global Platform Governance
          </span>
        }
        title={`Welcome, ${user?.firstName || 'System Administrator'}`}
        description="Overview of multi-tenant university nodes, platform users, and global infrastructure."
        actions={
          <div className="flex items-center gap-2.5">
            <PillButton to="/tenants" variant="primary" icon={Building}>
              Manage Tenants
            </PillButton>
            <PillButton to="/users" variant="secondary" icon={Users}>
              Review Users
            </PillButton>
          </div>
        }
      />

      {/* Donezo Primary KPI Metrics Row: 1 Emphasized Deep Green Card + 3 White Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Active Universities"
          value={statsLoading ? '…' : stats?.activeTenants ?? 0}
          hint={`/ ${statsLoading ? '…' : stats?.totalTenants ?? 0} total registered`}
          icon={Building}
          variant="primary"
          to="/tenants"
        />

        <KpiCard
          title="Registered Users"
          value={statsLoading ? '…' : stats?.totalUsers ?? 0}
          hint="Admins, faculty & students combined"
          icon={Users}
          variant="default"
          to="/users"
        />

        <KpiCard
          title="Pending Approvals"
          value={statsLoading ? '…' : stats?.pendingUsers ?? 0}
          hint="Review onboarding queue"
          icon={Clock}
          variant="default"
          to="/users"
          badge="Action Needed"
          badgeVariant="warning"
        />

        <KpiCard
          title="Global Courses"
          value={statsLoading ? '…' : stats?.totalCourses ?? 0}
          hint="Catalogued curriculum items"
          icon={BookOpen}
          variant="default"
          to="/courses"
        />
      </div>

      {/* Recent Tenants Section */}
      <SurfaceCard padding="none">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">University Tenants</h2>
            <p className="text-xs text-slate-500 mt-0.5">Recently onboarded institutional clients</p>
          </div>
          <Link
            to="/tenants"
            className="text-xs font-bold text-[#165239] hover:text-[#1f6b4c] flex items-center gap-1.5 transition"
          >
            <span>View All Tenants</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {tenantsLoading && (
            <div className="p-8 text-center text-xs text-slate-400">Loading university tenants…</div>
          )}

          {!tenantsLoading && tenants.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400">
              No tenants provisioned yet. Click "Manage Tenants" to create one.
            </div>
          )}

          {tenants.map((t) => (
            <div
              key={t.id}
              className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-[#eaf5ee] text-[#165239] font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                  <Building className="w-5 h-5 text-[#165239]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{t.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 font-mono">
                    <span>{t.slug}</span>
                    <span>•</span>
                    <span className="capitalize">{t.planTier || 'professional'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <StatusBadge
                  label={t.status}
                  variant={
                    t.status === 'active'
                      ? 'success'
                      : t.status === 'suspended'
                      ? 'danger'
                      : 'warning'
                  }
                  size="sm"
                />
                <PillButton to="/tenants" variant="outline" size="sm">
                  Configure
                </PillButton>
              </div>
            </div>
          ))}
        </div>
      </SurfaceCard>

      {/* Platform Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SurfaceCard interactive={true} className="group">
          <Link to="/users" className="block">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#165239] transition">
              User Approvals &amp; Directory
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Review signups across all tenant universities and manage role authorizations.
            </p>
          </Link>
        </SurfaceCard>

        <SurfaceCard interactive={true} className="group">
          <Link to="/roles" className="block">
            <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-105 transition">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#165239] transition">
              Roles &amp; RBAC Matrix
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Inspect role permissions across 25 academic resources and capabilities.
            </p>
          </Link>
        </SurfaceCard>

        <SurfaceCard interactive={true} className="group">
          <Link to="/settings" className="block">
            <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mb-3 group-hover:scale-105 transition">
              <Settings className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#165239] transition">
              System Settings
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Configure system rate limits, token lifecycles, and storage attachments.
            </p>
          </Link>
        </SurfaceCard>
      </div>
    </PageShell>
  );
}
export default SuperAdminDashboard;
