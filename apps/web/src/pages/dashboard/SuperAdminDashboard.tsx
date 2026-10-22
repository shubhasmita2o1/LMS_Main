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
    <div className="space-y-8 pb-12">
      {/* Platform Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5" />
              Global Platform Governance
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Welcome, {user?.firstName || 'System Administrator'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Overview of multi-tenant university nodes, platform users, and global infrastructure.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/tenants"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-sm transition"
          >
            <Building className="w-4 h-4" />
            <span>Manage Tenants</span>
          </Link>
          <Link
            to="/users"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition bg-white"
          >
            <Users className="w-4 h-4" />
            <span>Review Users</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Universities
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">
              {statsLoading ? '…' : stats?.activeTenants ?? 0}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              / {statsLoading ? '…' : stats?.totalTenants ?? 0} total
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Multi-tenant institutional instances</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Registered Users
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">
              {statsLoading ? '…' : stats?.totalUsers ?? 0}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Admins, faculty & students combined</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending Approvals
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">
              {statsLoading ? '…' : stats?.pendingUsers ?? 0}
            </span>
          </div>
          <Link
            to="/users"
            className="text-[11px] font-semibold text-amber-700 hover:underline mt-1 inline-block"
          >
            Review pending queue →
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Global Courses
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">
              {statsLoading ? '…' : stats?.totalCourses ?? 0}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Catalogued curriculum items</p>
        </div>
      </div>

      {/* Recent Tenants Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900">University Tenants</h2>
            <p className="text-xs text-slate-500">Recently onboarded institutional clients</p>
          </div>
          <Link
            to="/tenants"
            className="text-xs font-bold text-primary-700 hover:text-primary-800 flex items-center gap-1"
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
            <div key={t.id} className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 font-bold flex items-center justify-center text-xs shrink-0 border border-primary-100">
                  <Building className="w-5 h-5 text-primary-600" />
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
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    t.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : t.status === 'suspended'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {t.status}
                </span>
                <Link
                  to="/tenants"
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-white"
                >
                  Configure
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Platform Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/users"
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-primary-400 transition shadow-xs group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 group-hover:text-primary-700 transition">
            User Approvals & Directory
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Review signups across all tenant universities and manage role authorizations.
          </p>
        </Link>

        <Link
          to="/roles"
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-primary-400 transition shadow-xs group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 group-hover:text-primary-700 transition">
            Roles & RBAC Matrix
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Inspect role permissions across 25 academic resources and capabilities.
          </p>
        </Link>

        <Link
          to="/settings"
          className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-primary-400 transition shadow-xs group"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-3">
            <Settings className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 group-hover:text-primary-700 transition">
            System Settings
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Configure system rate limits, token lifecycles, and storage attachments.
          </p>
        </Link>
      </div>
    </div>
  );
}
