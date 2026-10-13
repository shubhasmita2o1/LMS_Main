import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type { ApiResponse, TenantPublic } from '@university-lms/shared';
import { useCurrentTenant, useTenantUsage } from '../hooks/useFeatureFlag';
import { useAuthStore } from '../stores/authStore';

interface SettingsForm {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  customDomain: string;
}

export function TenantSettingsPage() {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { data: tenant, isLoading } = useCurrentTenant();
  const { data: usage } = useTenantUsage();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, reset } = useForm<SettingsForm>();

  useEffect(() => {
    if (tenant) {
      reset({
        name: tenant.name,
        primaryColor: tenant.branding?.primaryColor || '#4f46e5',
        secondaryColor: tenant.branding?.secondaryColor || '#0f172a',
        logoUrl: tenant.branding?.logoUrl || '',
        customDomain: tenant.customDomain || '',
      });
    }
  }, [tenant, reset]);

  const saveMut = useMutation({
    mutationFn: async (values: SettingsForm) => {
      const { data } = await api.patch<ApiResponse<TenantPublic>>('/tenants/me', {
        name: values.name,
        branding: {
          name: values.name,
          primaryColor: values.primaryColor || undefined,
          secondaryColor: values.secondaryColor || undefined,
          logoUrl: values.logoUrl || undefined,
        },
        customDomain: values.customDomain || null,
      });
      if (!data.success) throw new Error(data.error?.message || 'Save failed');
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant'] });
      setMessage('Settings saved');
      setError(null);
    },
    onError: (e: Error) => {
      setError(e.message);
      setMessage(null);
    },
  });

  const portalMut = useMutation({
    mutationFn: async () => {
      const returnUrl = window.location.href;
      const { data } = await api.post<ApiResponse<{ url: string; message?: string }>>(
        '/billing/portal',
        { returnUrl }
      );
      if (!data.success || !data.data?.url) throw new Error('Portal unavailable');
      return data.data;
    },
    onSuccess: (data) => {
      if (data.url) window.open(data.url, '_blank');
    },
  });

  if (isLoading) {
    return <div className="p-10 text-center text-slate-400">Loading settings…</div>;
  }

  if (!tenant) {
    return (
      <div className="p-10 text-center">
        <p className="text-slate-600 mb-4">No tenant associated with this account.</p>
        <Link to="/dashboard" className="text-primary-600 text-sm">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl text-white flex items-center justify-center font-bold text-sm"
              style={{ backgroundColor: tenant.branding?.primaryColor || '#4f46e5' }}
            >
              UL
            </div>
            <span className="font-semibold text-slate-900">Tenant Settings</span>
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

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {message && (
          <div className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
            {message}
          </div>
        )}
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit((v) => saveMut.mutate(v))}
          className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
        >
          <h2 className="font-semibold text-slate-900">Branding</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input
                {...register('name')}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Primary color</label>
              <input
                type="color"
                {...register('primaryColor')}
                className="w-full h-10 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Secondary color</label>
              <input
                type="color"
                {...register('secondaryColor')}
                className="w-full h-10 border border-slate-200 rounded-lg"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Logo URL (placeholder)
              </label>
              <input
                {...register('logoUrl')}
                placeholder="https://…"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Custom domain</label>
              <input
                {...register('customDomain')}
                placeholder="lms.youruniversity.edu"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
              <p className="text-xs text-slate-400 mt-1">
                DNS verification will be added in a later phase. Architecture is ready.
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saveMut.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-60"
            >
              {saveMut.isPending ? 'Saving…' : 'Save settings'}
            </button>
          </div>
        </form>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-semibold text-slate-900 mb-1">Current plan</h2>
          <p className="text-sm text-slate-500 mb-4 capitalize">
            {tenant.planTier} · status: {tenant.status}
          </p>

          {usage && (
            <div className="space-y-3 mb-6">
              {usage.usage
                .filter((u) => u.limit > 0 || u.metric === 'activeStudents')
                .map((u) => (
                  <div key={u.metric}>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>{u.metric}</span>
                      <span>
                        {u.value} / {u.limit || '∞'}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          u.percent >= 90 ? 'bg-red-500' : u.percent >= 70 ? 'bg-amber-500' : 'bg-primary-500'
                        }`}
                        style={{ width: `${Math.min(100, u.percent)}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Link
              to="/billing"
              className="inline-flex px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              Upgrade plan
            </Link>
            <button
              onClick={() => portalMut.mutate()}
              disabled={portalMut.isPending}
              className="inline-flex px-4 py-2 text-sm font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
            >
              Manage subscription
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-semibold text-slate-900 mb-3">Feature flags</h2>
          <ul className="grid sm:grid-cols-2 gap-2">
            {Object.entries(tenant.featureFlags || {}).map(([k, v]) => (
              <li
                key={k}
                className="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-slate-50"
              >
                <span className="font-mono text-xs text-slate-600">{k}</span>
                <span
                  className={`text-xs font-medium ${v ? 'text-emerald-600' : 'text-slate-400'}`}
                >
                  {v ? 'Enabled' : 'Disabled'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
