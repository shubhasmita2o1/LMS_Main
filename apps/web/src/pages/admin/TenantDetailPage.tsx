import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import api from '../../lib/api';
import type { ApiResponse, TenantPublic } from '@university-lms/shared';
import { AppLayout } from '../../components/layout/AppLayout';
import { PageShell, SectionHeader, SurfaceCard, PillButton, StatusBadge } from '../../components/ui';

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
    return (
      <AppLayout>
        <PageShell>
          <div className="py-20 text-center text-slate-400 font-medium">Loading institutional tenant…</div>
        </PageShell>
      </AppLayout>
    );
  }
  if (error || !tenant) {
    return (
      <AppLayout>
        <PageShell>
          <SurfaceCard className="text-center py-12">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Tenant Not Found</h2>
            <p className="text-sm text-slate-500 mb-4">The requested university tenant could not be found.</p>
            <PillButton variant="outline" href="/admin/tenants" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Tenants Directory
            </PillButton>
          </SurfaceCard>
        </PageShell>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageShell>
        <SectionHeader
          title={tenant.name}
          subtitle={`Slug: ${tenant.slug} · ID: ${tenant.id}`}
          badge={
            <StatusBadge
              status={tenant.status === 'active' ? 'success' : tenant.status === 'suspended' ? 'danger' : 'neutral'}
              label={tenant.status}
            />
          }
          actions={
            <div className="flex items-center gap-2">
              <PillButton variant="outline" href="/admin/tenants" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Directory
              </PillButton>
              {tenant.status === 'suspended' ? (
                <PillButton
                  variant="secondary"
                  onClick={() => activateMut.mutate()}
                  loading={activateMut.isPending}
                >
                  Activate Tenant
                </PillButton>
              ) : (
                <PillButton
                  variant="danger"
                  onClick={() => suspendMut.mutate()}
                  loading={suspendMut.isPending}
                >
                  Suspend Tenant
                </PillButton>
              )}
            </div>
          }
        />

        <div className="grid sm:grid-cols-2 gap-6">
          <SurfaceCard title="Subscription & Lifecycle">
            <div className="space-y-3">
              <Row label="Status" value={tenant.status} />
              <Row label="Plan Tier" value={tenant.planTier} />
              <Row
                label="Trial Expiration"
                value={tenant.trialEndsAt ? new Date(tenant.trialEndsAt).toLocaleString() : '—'}
              />
              <Row
                label="Billing Period End"
                value={tenant.currentPeriodEnd ? new Date(tenant.currentPeriodEnd).toLocaleString() : '—'}
              />
            </div>
          </SurfaceCard>

          <SurfaceCard title="Institutional Branding">
            <div className="space-y-3">
              <Row label="Display Name" value={tenant.branding?.name || tenant.name} />
              <Row label="Primary Accent Color" value={tenant.branding?.primaryColor || '—'} />
              <Row label="Custom Domain" value={tenant.customDomain || '—'} />
              <Row label="Institutional Logo" value={tenant.branding?.logoUrl ? 'Configured' : '—'} />
            </div>
          </SurfaceCard>

          <SurfaceCard title="Resource Quotas & Limits">
            <div className="space-y-3">
              <Row label="Max Student Enrollment" value={String(tenant.limits?.maxStudents ?? 'Unlimited')} />
              <Row label="Max Faculty Members" value={String(tenant.limits?.maxFaculty ?? 'Unlimited')} />
              <Row label="Max Active Courses" value={String(tenant.limits?.maxCourses ?? 'Unlimited')} />
              <Row label="Allocated Cloud Storage (GB)" value={String(tenant.limits?.maxStorageGB ?? 'Unlimited')} />
            </div>
          </SurfaceCard>

          <SurfaceCard title="Active Feature Flags">
            <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
              {Object.entries(tenant.featureFlags || {}).map(([k, v]) => (
                <div key={k} className="flex justify-between items-center py-2 text-xs">
                  <span className="font-mono text-[11px] text-slate-600">{k}</span>
                  <span
                    className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                      v ? 'bg-emerald-50 text-[#165239]' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {v ? 'Active' : 'Disabled'}
                  </span>
                </div>
              ))}
            </div>
          </SurfaceCard>
        </div>

        <SurfaceCard title="Billing Provider & Account">
          <div className="grid sm:grid-cols-3 gap-4">
            <Row label="Payment Provider" value={tenant.subscription?.provider || 'Direct Invoice'} />
            <Row label="Customer ID" value={tenant.subscription?.customerId || '—'} />
            <Row label="Subscription ID" value={tenant.subscription?.subscriptionId || '—'} />
          </div>
        </SurfaceCard>
      </PageShell>
    </AppLayout>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-xs py-1 gap-4">
      <span className="text-slate-500 font-medium">{label}</span>
      <span className="font-semibold text-slate-900 text-right truncate">{value}</span>
    </div>
  );
}

export default TenantDetailPage;
