import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Plus, Search } from 'lucide-react';
import api from '../../lib/api';
import type { ApiResponse, TenantPublic, PlatformStats } from '@university-lms/shared';
import { AppLayout } from '../../components/layout/AppLayout';
import { PageShell, SectionHeader, KpiCard, SurfaceCard, PillButton, StatusBadge } from '../../components/ui';

export function AdminTenantsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PlatformStats>>('/admin/stats');
      return data.data!;
    },
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'tenants', search, status],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (status) params.status = status;
      const { data } = await api.get<ApiResponse<TenantPublic[]>>('/admin/tenants', { params });
      return { items: data.data || [], meta: data.meta };
    },
  });

  const suspendMut = useMutation({
    mutationFn: (id: string) => api.post(`/admin/tenants/${id}/suspend`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] }),
  });

  const activateMut = useMutation({
    mutationFn: (id: string) => api.post(`/admin/tenants/${id}/activate`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] }),
  });

  return (
    <AppLayout>
      <PageShell>
        <SectionHeader
          title="Institutional Tenants"
          subtitle="Super Admin multi-tenant control plane and university provisioning"
          actions={
            <PillButton
              variant="primary"
              href="/admin/tenants/new"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Provision New Tenant
            </PillButton>
          }
        />

        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              variant="primary"
              label="Active Universities"
              value={stats.activeTenants}
              change={`${stats.totalTenants} total tenants`}
              trend="up"
            />
            <KpiCard
              label="Evaluation Trials"
              value={stats.trialingTenants}
              change="Active sandboxes"
              trend="neutral"
            />
            <KpiCard
              label="Platform Users"
              value={stats.totalUsers}
              change="Accounts across tenants"
              trend="up"
            />
            <KpiCard
              label="Total Deployments"
              value={stats.totalTenants}
              change="Multi-tenant shards"
              trend="neutral"
            />
          </div>
        )}

        <SurfaceCard className="p-0 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tenant name or slug…"
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#165239]/20"
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-full text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#165239]/20"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="trialing">Trialing</option>
              <option value="past_due">Past Due</option>
              <option value="suspended">Suspended</option>
              <option value="canceled">Canceled</option>
            </select>
          </div>

          {isLoading && <div className="p-10 text-center text-xs text-slate-400">Loading university tenants…</div>}
          {error && (
            <div className="p-10 text-center text-rose-600 text-xs">Failed to load institutional tenants</div>
          )}

          {data && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/80 border-b border-slate-200/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Institution Name</th>
                    <th className="px-5 py-3.5">Tenant Slug</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Plan Tier</th>
                    <th className="px-5 py-3.5">Created Date</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.items.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                        No tenants matching criteria
                      </td>
                    </tr>
                  )}
                  {data.items.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-5 py-3">
                        <Link
                          to={`/admin/tenants/${t.id}`}
                          className="font-bold text-slate-900 hover:text-[#165239] transition flex items-center gap-2"
                        >
                          <Building2 className="w-3.5 h-3.5 text-[#165239]" />
                          <span>{t.name}</span>
                        </Link>
                      </td>
                      <td className="px-5 py-3 font-mono text-[11px] text-slate-500">{t.slug}</td>
                      <td className="px-5 py-3">
                        <StatusBadge
                          status={t.status === 'active' ? 'success' : t.status === 'suspended' ? 'danger' : 'neutral'}
                          label={t.status}
                        />
                      </td>
                      <td className="px-5 py-3 font-semibold capitalize text-slate-700">{t.planTier}</td>
                      <td className="px-5 py-3 text-slate-400 text-[11px]">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3 text-right space-x-2">
                        {t.status === 'suspended' ? (
                          <PillButton
                            variant="secondary"
                            size="sm"
                            onClick={() => activateMut.mutate(t.id)}
                            loading={activateMut.isPending}
                          >
                            Activate
                          </PillButton>
                        ) : (
                          <PillButton
                            variant="outline"
                            size="sm"
                            onClick={() => suspendMut.mutate(t.id)}
                            loading={suspendMut.isPending}
                          >
                            Suspend
                          </PillButton>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SurfaceCard>
      </PageShell>
    </AppLayout>
  );
}

export default AdminTenantsPage;
