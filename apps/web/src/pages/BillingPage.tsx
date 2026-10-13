import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../lib/api';
import type { ApiResponse, PlanPublic } from '@university-lms/shared';
import { useCurrentTenant } from '../hooks/useFeatureFlag';
import { useAuthStore } from '../stores/authStore';
import { useState } from 'react';

export function BillingPage() {
  const user = useAuthStore((s) => s.user);
  const { data: tenant } = useCurrentTenant();
  const [message, setMessage] = useState<string | null>(null);

  const { data: plans, isLoading } = useQuery({
    queryKey: ['billing', 'plans'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PlanPublic[]>>('/billing/plans');
      return data.data || [];
    },
  });

  const checkoutMut = useMutation({
    mutationFn: async (planTier: string) => {
      const origin = window.location.origin;
      const { data } = await api.post<
        ApiResponse<{
          mode: string;
          checkoutUrl?: string | null;
          message?: string;
          planTier?: string;
        }>
      >('/billing/checkout', {
        planTier,
        successUrl: `${origin}/billing?success=1`,
        cancelUrl: `${origin}/billing?canceled=1`,
      });
      if (!data.success || !data.data) throw new Error(data.error?.message || 'Checkout failed');
      return data.data;
    },
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setMessage(data.message || `Plan ${data.planTier} applied`);
      }
    },
    onError: (e: Error) => setMessage(e.message),
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/settings" className="text-sm text-slate-600 hover:text-slate-900">
            ← Settings
          </Link>
          <span className="font-semibold text-slate-900">Billing</span>
          <span className="text-sm text-slate-500">{user?.email}</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {tenant && (
          <div className="mb-6 bg-white border border-slate-200 rounded-xl p-5">
            <div className="text-sm text-slate-500">Current plan</div>
            <div className="text-xl font-bold text-slate-900 capitalize">{tenant.planTier}</div>
            <div className="text-sm text-slate-500 mt-1">Status: {tenant.status}</div>
          </div>
        )}

        {message && (
          <div className="mb-4 text-sm text-slate-700 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2">
            {message}
          </div>
        )}

        <h1 className="text-2xl font-bold text-slate-900 mb-4">Choose a plan</h1>

        {isLoading && <p className="text-slate-400">Loading plans…</p>}

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(plans || []).map((plan) => {
            const isCurrent = tenant?.planTier === plan.key;
            return (
              <div
                key={plan.id}
                className={`bg-white border rounded-xl p-5 flex flex-col ${
                  isCurrent ? 'border-primary-500 ring-1 ring-primary-200' : 'border-slate-200'
                }`}
              >
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  {plan.name}
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-slate-900">
                    {plan.price === 0 ? 'Free' : `$${plan.price}`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-sm text-slate-400">/{plan.interval}</span>
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-2 min-h-[40px]">{plan.description}</p>
                <ul className="mt-4 space-y-1 text-xs text-slate-600 flex-1">
                  {plan.features.map((f) => (
                    <li key={f}>• {f}</li>
                  ))}
                </ul>
                <button
                  disabled={isCurrent || checkoutMut.isPending}
                  onClick={() => checkoutMut.mutate(plan.key)}
                  className={`mt-5 w-full py-2 rounded-lg text-sm font-medium ${
                    isCurrent
                      ? 'bg-slate-100 text-slate-400 cursor-default'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                  {isCurrent ? 'Current plan' : plan.price === 0 ? 'Downgrade' : 'Upgrade'}
                </button>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
