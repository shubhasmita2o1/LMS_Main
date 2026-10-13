import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type { ApiResponse, TenantPublic } from '@university-lms/shared';

export function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: tenant, isLoading, error } = useQuery({
    queryKey: ['admin', 'tenant', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<TenantPublic>>(`/admin/tenants/${id}`);
      return data.data!;
    },
    enabled: Boolean(id),
  });

  const suspendMut = useMutation({
    mutationFn: () => api.post(`/admin/tenants/${id}/suspend`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'tenant', id] }),
  });

  const activateMut = useMutation({
    mutationFn: () => api.post(`/admin/tenants/${id}/activate`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'tenant', id] }),
  });

  if (isLoading) {
    return <div className="p-10 text-center text-slate-400">Loading…</div>;
  }
  if (error || !tenant) {
    return (
      <div className="p-10 text-center">
        <p className="text-red-600 mb-4">Tenant not found</p>
        <Link to="/admin/tenants" className="text-primary-600 text-sm">
          Back to list
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/admin/tenants" className="text-sm text-slate-600 hover:text-slate-900">
            ← Tenants
          </Link>
          <span className="font-semibold text-slate-900">{tenant.name}</span>
          <span className="text-xs font-mono text-slate-400">{tenant.id}</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{tenant.name}</h1>
            <p className="text-sm text-slate-500 font-mono">{tenant.slug}</p>
          </div>
          <div className="flex gap-2">
            {tenant.status === 'suspended' ? (
              <button
                onClick={() => activateMut.mutate()}
                className="px-3 py-1.5 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Activate
              </button>
            ) : (
              <button
                onClick={() => suspendMut.mutate()}
                className="px-3 py-1.5 text-sm rounded-lg bg-amber-600 text-white hover:bg-amber-700"
              >
                Suspend
              </button>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Card title="Status & plan">
            <Row label="Status" value={tenant.status} />
            <Row label="Plan" value={tenant.planTier} />
            <Row
              label="Trial ends"
              value={
                tenant.trialEndsAt
                  ? new Date(tenant.trialEndsAt).toLocaleString()
                  : '—'
              }
            />
            <Row
              label="Period end"
              value={
                tenant.currentPeriodEnd
                  ? new Date(tenant.currentPeriodEnd).toLocaleString()
                  : '—'
              }
            />
          </Card>

          <Card title="Branding">
            <Row label="Display name" value={tenant.branding?.name || tenant.name} />
            <Row label="Primary color" value={tenant.branding?.primaryColor || '—'} />
            <Row label="Custom domain" value={tenant.customDomain || '—'} />
            <Row label="Logo" value={tenant.branding?.logoUrl ? 'Set' : '—'} />
          </Card>

          <Card title="Limits">
            <Row label="Max students" value={String(tenant.limits?.maxStudents ?? '—')} />
            <Row label="Max faculty" value={String(tenant.limits?.maxFaculty ?? '—')} />
            <Row label="Max courses" value={String(tenant.limits?.maxCourses ?? '—')} />
            <Row label="Storage (GB)" value={String(tenant.limits?.maxStorageGB ?? '—')} />
          </Card>

          <Card title="Feature flags">
            <ul className="space-y-1 max-h-40 overflow-y-auto">
              {Object.entries(tenant.featureFlags || {}).map(([k, v]) => (
                <li key={k} className="flex justify-between text-sm">
                  <span className="font-mono text-xs text-slate-600">{k}</span>
                  <span className={v ? 'text-emerald-600' : 'text-slate-400'}>
                    {v ? 'on' : 'off'}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <Card title="Billing">
          <Row label="Provider" value={tenant.subscription?.provider || 'none'} />
          <Row label="Customer ID" value={tenant.subscription?.customerId || '—'} />
          <Row label="Subscription ID" value={tenant.subscription?.subscriptionId || '—'} />
        </Card>
      </main>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <h2 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900 text-right truncate">{value}</span>
    </div>
  );
}
