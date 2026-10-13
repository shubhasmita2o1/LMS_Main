import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type { ApiResponse, TenantPublic, PlatformStats } from '@university-lms/shared';
import { useAuthStore } from '../../stores/authStore';

export function AdminTenantsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const user = useAuthStore((s) => s.user);

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
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold text-sm">
              UL
            </div>
            <span className="font-semibold text-slate-900">Platform Admin</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/dashboard" className="text-slate-600 hover:text-slate-900">
              Dashboard
            </Link>
            <span className="text-slate-500">{user?.email}</span>
            <button
              onClick={() => clearAuth()}
              className="text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Tenants</h1>
            <p className="text-slate-500 text-sm">Super Admin control plane</p>
          </div>
          <Link
            to="/admin/tenants/new"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
          >
            + Create Tenant
          </Link>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total tenants', value: stats.totalTenants },
              { label: 'Active', value: stats.activeTenants },
              { label: 'Trialing', value: stats.trialingTenants },
              { label: 'Users', value: stats.totalUsers },
            ].map((c) => (
              <div key={c.label} className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="text-xs text-slate-400 uppercase tracking-wide">{c.label}</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">{c.value}</div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or slug…"
              className="flex-1 min-w-[180px] px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="trialing">Trialing</option>
              <option value="past_due">Past due</option>
              <option value="suspended">Suspended</option>
              <option value="canceled">Canceled</option>
            </select>
          </div>

          {isLoading && <div className="p-8 text-center text-slate-400">Loading…</div>}
          {error && (
            <div className="p-8 text-center text-red-600 text-sm">Failed to load tenants</div>
          )}

          {data && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Slug</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Plan</th>
                    <th className="px-4 py-3 font-medium">Created</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.items.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        No tenants yet
                      </td>
                    </tr>
                  )}
                  {data.items.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        <Link
                          to={`/admin/tenants/${t.id}`}
                          className="font-medium text-primary-600 hover:underline"
                        >
                          {t.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{t.slug}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="px-4 py-3 capitalize">{t.planTier}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 space-x-2">
                        {t.status === 'suspended' ? (
                          <button
                            onClick={() => activateMut.mutate(t.id)}
                            className="text-xs font-medium text-emerald-700 hover:underline"
                          >
                            Activate
                          </button>
                        ) : (
                          <button
                            onClick={() => suspendMut.mutate(t.id)}
                            className="text-xs font-medium text-amber-700 hover:underline"
                          >
                            Suspend
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    trialing: 'bg-sky-50 text-sky-700 border-sky-100',
    past_due: 'bg-amber-50 text-amber-800 border-amber-100',
    suspended: 'bg-red-50 text-red-700 border-red-100',
    canceled: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${colors[status] || colors.canceled}`}
    >
      {status}
    </span>
  );
}
