import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { AppLayout } from '../../components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import { getMyTenant } from '../../lib/tenantsApi';
import { listPlans, createCheckout, createPortal, type CreateCheckoutInput } from '../../lib/billingApi';
import { useAuth } from '../../hooks/useAuth';
import type { PlanTier, PlanPublic } from '@university-lms/shared';
import {
  CreditCard,
  ExternalLink,
  Sparkles,
  Clock,
  Check,
} from 'lucide-react';

export function BillingPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [feedback, setFeedback] = useState<{ type: 'success' | 'warning' | 'info'; message: string } | null>(null);

  // Check URL query parameters (?success=1 / ?canceled=1)
  useEffect(() => {
    if (searchParams.get('success') === '1') {
      const plan = searchParams.get('plan');
      setFeedback({
        type: 'success',
        message: plan
          ? `Subscription upgraded to ${plan.toUpperCase()} plan successfully!`
          : 'Checkout completed successfully! Your subscription has been updated.',
      });
      // Clear query params to keep clean URL
      searchParams.delete('success');
      searchParams.delete('session_id');
      searchParams.delete('plan');
      setSearchParams(searchParams, { replace: true });
    } else if (searchParams.get('canceled') === '1') {
      setFeedback({
        type: 'warning',
        message: 'Checkout was cancelled. No charges were made and your current plan remains unchanged.',
      });
      searchParams.delete('canceled');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Current tenant query
  const tenantQuery = useQuery({
    queryKey: ['myTenant', user?.tenantId],
    queryFn: getMyTenant,
    staleTime: 30_000,
  });

  // Plans catalog query
  const plansQuery = useQuery({
    queryKey: ['billingPlans'],
    queryFn: listPlans,
    staleTime: 60_000,
  });

  const tenant = tenantQuery.data;
  const currentPlanTier = tenant?.planTier || 'free';

  // Checkout mutation
  const checkoutMutation = useMutation({
    mutationFn: (input: CreateCheckoutInput) => createCheckout(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['myTenant'] });
      queryClient.invalidateQueries({ queryKey: ['currentTenant'] });

      if (data.mode === 'immediate') {
        // Free tier or local immediate apply
        setFeedback({
          type: 'success',
          message: data.message || `Switched to ${data.planTier.toUpperCase()} plan.`,
        });
      } else if (data.checkoutUrl) {
        // Redirect to provider checkout
        window.location.href = data.checkoutUrl;
      }
    },
    onError: (err: Error) => {
      setFeedback({
        type: 'warning',
        message: err.message || 'Failed to start checkout. Please try again.',
      });
    },
  });

  // Customer Portal mutation
  const portalMutation = useMutation({
    mutationFn: (returnUrl: string) => createPortal(returnUrl),
    onSuccess: (data) => {
      if (data.portalUrl) {
        window.location.href = data.portalUrl;
      }
    },
    onError: (err: Error) => {
      setFeedback({
        type: 'warning',
        message: err.message || 'Customer billing portal is not available for this account.',
      });
    },
  });

  const handleSelectPlan = (tier: PlanTier) => {
    if (tier === currentPlanTier) return;

    const returnBase = window.location.origin + window.location.pathname;
    checkoutMutation.mutate({
      planTier: tier,
      successUrl: `${returnBase}?success=1`,
      cancelUrl: `${returnBase}?canceled=1`,
    });
  };

  const handleOpenPortal = () => {
    portalMutation.mutate(window.location.href);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                Billing &amp; Subscriptions
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <CreditCard className="w-7 h-7 text-purple-600" />
              <span>Subscription &amp; Plans</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Choose the right tier for your university campus, unlock modules, and scale enrolled capacity.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              isLoading={portalMutation.isPending}
              onClick={handleOpenPortal}
              leftIcon={<ExternalLink className="w-4 h-4" />}
            >
              Billing Portal
            </Button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <Alert variant={feedback.type} onClose={() => setFeedback(null)}>
            {feedback.message}
          </Alert>
        )}

        {/* Current Active Plan Overview */}
        {tenant && (
          <Card className="bg-gradient-to-r from-slate-900 via-primary-950 to-indigo-950 text-white border-0 shadow-lg">
            <CardContent className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2.5">
                  <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-primary-500/20 text-primary-300 border border-primary-400/30">
                    Active Plan: {tenant.planTier.toUpperCase()}
                  </span>
                  <Badge variant={tenant.status === 'active' ? 'success' : 'primary'} size="sm">
                    {tenant.status.toUpperCase()}
                  </Badge>
                </div>
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  {tenant.name}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Your campus is equipped with up to{' '}
                  <span className="font-semibold text-white">
                    {tenant.limits?.maxStudents?.toLocaleString()} students
                  </span>
                  ,{' '}
                  <span className="font-semibold text-white">
                    {tenant.limits?.maxFaculty?.toLocaleString()} faculty
                  </span>
                  , and{' '}
                  <span className="font-semibold text-white">
                    {tenant.limits?.maxStorageGB} GB storage
                  </span>
                  .
                </p>
                {tenant.trialEndsAt && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-300 font-medium pt-1">
                    <Clock className="w-4 h-4" />
                    <span>Trial active until {new Date(tenant.trialEndsAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  size="md"
                  onClick={handleOpenPortal}
                  isLoading={portalMutation.isPending}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs sm:text-sm font-semibold"
                  leftIcon={<ExternalLink className="w-4 h-4" />}
                >
                  Manage Subscription
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plan Catalog Grid */}
        <div>
          <div className="text-center max-w-xl mx-auto mb-8 pt-4">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Transparent, Scalable University Pricing
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Upgrade anytime to expand enrollment caps, enable single sign-on (SSO), and deploy advanced analytics.
            </p>
          </div>

          {plansQuery.isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Spinner size="lg" className="text-primary-600" />
              <p className="text-sm text-slate-500">Loading plan catalog...</p>
            </div>
          ) : plansQuery.isError ? (
            <Alert variant="error" title="Failed to load plans">
              {plansQuery.error instanceof Error ? plansQuery.error.message : 'Could not fetch plans.'}
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
              {plansQuery.data?.map((plan: PlanPublic) => {
                const isCurrent = plan.key === currentPlanTier;
                const isPopular = plan.key === 'professional';

                return (
                  <Card
                    key={plan.id || plan.key}
                    className={`flex flex-col justify-between transition-all duration-200 relative ${
                      isPopular
                        ? 'border-primary-500 ring-2 ring-primary-500/20 shadow-md'
                        : isCurrent
                          ? 'border-emerald-400 bg-emerald-50/10'
                          : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-gradient-to-r from-primary-600 to-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Most Popular
                        </span>
                      </div>
                    )}

                    <CardHeader className="pt-6">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl capitalize">{plan.name}</CardTitle>
                        {isCurrent && (
                          <Badge variant="success" size="sm">
                            Current Plan
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="min-h-[40px] text-xs">
                        {plan.description || 'Enterprise LMS features for academic excellence.'}
                      </CardDescription>

                      {/* Pricing */}
                      <div className="pt-4 pb-2 border-b border-slate-100">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-extrabold text-slate-900">
                            ${plan.price}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            / {plan.interval}
                          </span>
                        </div>
                        {plan.trialDays > 0 && !isCurrent && (
                          <span className="text-[11px] text-primary-600 font-medium mt-0.5 block">
                            Includes {plan.trialDays}-day free trial
                          </span>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4 py-4 flex-1">
                      {/* Plan Quotas */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-slate-600">
                          <span>Students Cap:</span>
                          <span className="font-bold text-slate-800">
                            {plan.limits?.maxStudents?.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                          <span>Faculty Cap:</span>
                          <span className="font-bold text-slate-800">
                            {plan.limits?.maxFaculty?.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                          <span>Cloud Storage:</span>
                          <span className="font-bold text-slate-800">
                            {plan.limits?.maxStorageGB} GB
                          </span>
                        </div>
                      </div>

                      {/* Features */}
                      <div className="space-y-2 pt-1 text-xs text-slate-600">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Included Features
                        </span>
                        {plan.features?.map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>

                    <CardFooter className="pt-4 border-t border-slate-100 bg-transparent">
                      <Button
                        variant={isCurrent ? 'outline' : isPopular ? 'primary' : 'secondary'}
                        size="md"
                        disabled={isCurrent || checkoutMutation.isPending}
                        isLoading={
                          checkoutMutation.isPending &&
                          checkoutMutation.variables?.planTier === plan.key
                        }
                        onClick={() => handleSelectPlan(plan.key)}
                        className="w-full justify-center text-xs font-bold"
                      >
                        {isCurrent ? (
                          'Active Subscription'
                        ) : plan.price === 0 ? (
                          'Switch to Free'
                        ) : (
                          `Upgrade to ${plan.name}`
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

export default BillingPage;
