import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AppLayout } from '../../components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import { getMyTenant, updateMyTenant, type UpdateTenantMeInput } from '../../lib/tenantsApi';
import { useTenantUsage } from '../../hooks/useTenantUsage';
import { useAuth } from '../../hooks/useAuth';
import { FEATURE_FLAGS, type TenantStatus, type PlanTier } from '@university-lms/shared';
import {
  Building,
  Palette,
  CreditCard,
  HardDrive,
  Users,
  UserCheck,
  BookOpen,
  Globe,
  Save,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Lock,
} from 'lucide-react';

const settingsSchema = z.object({
  name: z.string().min(2, 'Institution name must be at least 2 characters').max(200),
  primaryColor: z
    .string()
    .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Invalid hex color (e.g. #2563eb)')
    .optional()
    .or(z.literal('')),
  secondaryColor: z
    .string()
    .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Invalid hex color (e.g. #1e40af)')
    .optional()
    .or(z.literal('')),
  logoUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  customDomain: z.string().max(253).optional().or(z.literal('')),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export function TenantSettingsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Tenant profile query
  const tenantQuery = useQuery({
    queryKey: ['myTenant', user?.tenantId],
    queryFn: getMyTenant,
    staleTime: 30_000,
  });

  // Usage query
  const usageQuery = useTenantUsage();

  const tenant = tenantQuery.data;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: '',
      primaryColor: '#2563eb',
      secondaryColor: '#1e40af',
      logoUrl: '',
      customDomain: '',
    },
  });

  // Watch color inputs for live preview
  const watchedPrimary = watch('primaryColor');
  const watchedSecondary = watch('secondaryColor');
  const watchedLogo = watch('logoUrl');

  useEffect(() => {
    if (tenant) {
      reset({
        name: tenant.name || '',
        primaryColor: tenant.branding?.primaryColor || '#2563eb',
        secondaryColor: tenant.branding?.secondaryColor || '#1e40af',
        logoUrl: tenant.branding?.logoUrl || '',
        customDomain: tenant.customDomain || '',
      });
    }
  }, [tenant, reset]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (input: UpdateTenantMeInput) => updateMyTenant(input),
    onSuccess: (data) => {
      queryClient.setQueryData(['myTenant', user?.tenantId], data);
      queryClient.invalidateQueries({ queryKey: ['currentTenant'] });
      setFeedback({ type: 'success', message: 'Institution settings updated successfully.' });
    },
    onError: (err: Error) => {
      setFeedback({ type: 'error', message: err.message || 'Failed to update settings.' });
    },
  });

  const onSubmit = (data: SettingsFormData) => {
    setFeedback(null);
    updateMutation.mutate({
      name: data.name.trim(),
      branding: {
        name: data.name.trim(),
        primaryColor: data.primaryColor || undefined,
        secondaryColor: data.secondaryColor || undefined,
        logoUrl: data.logoUrl || undefined,
        customDomain: data.customDomain?.trim() || undefined,
      },
      customDomain: data.customDomain?.trim() || null,
    });
  };

  const getStatusBadge = (status?: TenantStatus) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'trialing':
        return <Badge variant="primary">Trial Period</Badge>;
      case 'suspended':
        return <Badge variant="danger">Suspended</Badge>;
      case 'past_due':
        return <Badge variant="warning">Past Due</Badge>;
      default:
        return <Badge variant="default">{status || 'Active'}</Badge>;
    }
  };

  const getPlanBadge = (tier?: PlanTier) => {
    switch (tier) {
      case 'enterprise':
        return <Badge variant="purple">Enterprise</Badge>;
      case 'professional':
        return <Badge variant="primary">Professional</Badge>;
      case 'starter':
        return <Badge variant="default">Starter</Badge>;
      case 'free':
        return <Badge variant="default">Free Tier</Badge>;
      default:
        return <Badge variant="default">{tier || 'Free'}</Badge>;
    }
  };

  // Helper for usage bar styling
  const getUsageColor = (percent: number) => {
    if (percent >= 90) return { bar: 'bg-red-500', text: 'text-red-700', badge: 'danger' as const };
    if (percent >= 70) return { bar: 'bg-amber-500', text: 'text-amber-700', badge: 'warning' as const };
    return { bar: 'bg-primary-600', text: 'text-slate-700', badge: 'default' as const };
  };

  if (tenantQuery.isLoading) {
    return (
      <AppLayout>
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" className="text-primary-600" />
          <p className="text-sm text-slate-500">Loading institution settings...</p>
        </div>
      </AppLayout>
    );
  }

  if (tenantQuery.isError || !tenant) {
    return (
      <AppLayout>
        <div className="max-w-xl mx-auto py-12 space-y-4">
          <Alert variant="error" title="Settings Unavailable">
            {tenantQuery.error instanceof Error
              ? tenantQuery.error.message
              : 'Could not load your institution profile. Make sure your account is assigned to an active tenant.'}
          </Alert>
          <Link to="/dashboard">
            <Button variant="outline" size="sm">
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-2.5 py-0.5 rounded-full border border-primary-200">
                Tenant Administration
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Building className="w-7 h-7 text-primary-600" />
              <span>Institution Settings</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Configure your university branding, custom domain routing, and monitor plan usage limits.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/billing">
              <Button variant="outline" size="sm" leftIcon={<CreditCard className="w-4 h-4 text-purple-600" />}>
                Manage Subscription
              </Button>
            </Link>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <Alert variant={feedback.type} onClose={() => setFeedback(null)}>
            {feedback.message}
          </Alert>
        )}

        {/* Top Grid: Plan Summary & Usage */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Plan Card */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-600" />
                <span>Current Plan &amp; Status</span>
              </CardTitle>
              <CardDescription>
                Subscription tier assigned to your campus
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Plan Tier</span>
                  {getPlanBadge(tenant.planTier)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Tenant Status</span>
                  {getStatusBadge(tenant.status)}
                </div>
                {tenant.trialEndsAt && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Trial Period</span>
                    <span className="font-semibold text-primary-700">
                      Ends {new Date(tenant.trialEndsAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <Link to="/billing">
                  <Button variant="primary" size="sm" className="w-full justify-center" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                    View Plans &amp; Upgrade
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Usage Bars Card */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-emerald-600" />
                <span>Resource Usage vs. Plan Quotas</span>
              </CardTitle>
              <CardDescription>
                Live usage tracked in your institutional tenant database partition
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usageQuery.isLoading ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2">
                  <Spinner size="sm" className="text-emerald-600" />
                  <span className="text-xs text-slate-400">Loading resource metrics...</span>
                </div>
              ) : usageQuery.data?.usage ? (
                <div className="space-y-4">
                  {usageQuery.data.usage.map((item) => {
                    const style = getUsageColor(item.percent);
                    const isNearLimit = item.percent >= 70;
                    const isAtLimit = item.percent >= 90;

                    let label = item.metric as string;
                    let icon = <Users className="w-4 h-4 text-slate-400" />;
                    let unitDisplay = `${item.value} / ${item.limit}`;

                    if (item.metric === 'activeStudents') {
                      label = 'Active Students';
                      icon = <Users className="w-4 h-4 text-primary-600" />;
                    } else if (item.metric === 'activeFaculty') {
                      label = 'Active Faculty';
                      icon = <UserCheck className="w-4 h-4 text-indigo-600" />;
                    } else if (item.metric === 'activeAdmins') {
                      label = 'Institution Admins';
                      icon = <Building className="w-4 h-4 text-purple-600" />;
                    } else if (item.metric === 'courses') {
                      label = 'Active Courses';
                      icon = <BookOpen className="w-4 h-4 text-emerald-600" />;
                    } else if (item.metric === 'storageBytes') {
                      label = 'Storage (GB)';
                      icon = <HardDrive className="w-4 h-4 text-amber-600" />;
                      const valGB = (item.value / (1024 * 1024 * 1024)).toFixed(1);
                      const limGB = (item.limit / (1024 * 1024 * 1024)).toFixed(0);
                      unitDisplay = `${valGB} GB / ${limGB} GB`;
                    }

                    return (
                      <div key={item.metric} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                            {icon}
                            <span>{label}</span>
                            {isAtLimit && (
                              <span className="text-[10px] text-red-600 font-bold bg-red-50 px-1.5 py-0.2 rounded border border-red-200">
                                Danger
                              </span>
                            )}
                            {isNearLimit && !isAtLimit && (
                              <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                Warning ≥70%
                              </span>
                            )}
                          </div>
                          <span className={`font-mono text-xs ${style.text}`}>
                            {unitDisplay} ({item.percent}%)
                          </span>
                        </div>
                        {/* Bar */}
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${style.bar}`}
                            style={{ width: `${Math.min(100, item.percent)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No usage metrics found.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Branding & Custom Domain Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="w-5 h-5 text-indigo-600" />
                <span>Campus Branding &amp; Custom Domain</span>
              </CardTitle>
              <CardDescription>
                Customize how your institution appears to students, faculty, and administrators
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Institution Display Name"
                  placeholder="e.g. Stanford University"
                  required
                  error={errors.name?.message}
                  {...register('name')}
                />

                <Input
                  label="Custom Domain"
                  placeholder="e.g. lms.stanford.edu"
                  helperText="Requires DNS CNAME pointing to this LMS cluster (Professional or Enterprise plan)"
                  leftIcon={<Globe className="w-4 h-4" />}
                  error={errors.customDomain?.message}
                  {...register('customDomain')}
                />
              </div>

              {/* Color themes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Primary Accent Color"
                    placeholder="#2563eb"
                    error={errors.primaryColor?.message}
                    {...register('primaryColor')}
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className="w-5 h-5 rounded-md border border-slate-300 shadow-2xs"
                      style={{ backgroundColor: watchedPrimary || '#2563eb' }}
                    />
                    <span className="text-xs text-slate-500">Live preview of primary accent</span>
                  </div>
                </div>

                <div>
                  <Input
                    label="Secondary Brand Color"
                    placeholder="#1e40af"
                    error={errors.secondaryColor?.message}
                    {...register('secondaryColor')}
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className="w-5 h-5 rounded-md border border-slate-300 shadow-2xs"
                      style={{ backgroundColor: watchedSecondary || '#1e40af' }}
                    />
                    <span className="text-xs text-slate-500">Live preview of secondary color</span>
                  </div>
                </div>
              </div>

              {/* Logo URL with preview */}
              <div className="space-y-2">
                <Input
                  label="Institution Logo URL"
                  placeholder="https://example.com/logo.png"
                  helperText="Public image link (PNG, SVG, JPG) displayed on login and navigation headers"
                  error={errors.logoUrl?.message}
                  {...register('logoUrl')}
                />
                {watchedLogo && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 inline-flex items-center gap-3">
                    <img
                      src={watchedLogo}
                      alt="Logo Preview"
                      className="h-10 w-auto max-w-[120px] object-contain rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <span className="text-xs text-slate-500">Logo preview</span>
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="justify-end gap-3">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={updateMutation.isPending}
                disabled={!isDirty}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save Settings
              </Button>
            </CardFooter>
          </Card>
        </form>

        {/* Feature Flags Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary-600" />
                  <span>Platform Modules &amp; Feature Flags</span>
                </CardTitle>
                <CardDescription>
                  Capabilities unlocked by your current subscription tier
                </CardDescription>
              </div>
              <Link to="/billing">
                <span className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
                  <span>Upgrade to unlock all</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(FEATURE_FLAGS).map(([label, flagKey]) => {
                const isEnabled = Boolean(tenant.featureFlags?.[flagKey]);
                return (
                  <div
                    key={flagKey}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                      isEnabled
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                        : 'bg-slate-50/80 border-slate-200 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {isEnabled ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Lock className="w-4 h-4 text-slate-300 shrink-0" />
                      )}
                      <span className="font-medium truncate">{label.replace(/_/g, ' ')}</span>
                    </div>

                    {isEnabled ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                        ACTIVE
                      </span>
                    ) : (
                      <Link to="/billing">
                        <span className="text-[10px] font-semibold text-primary-600 hover:text-primary-700 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                          Upgrade
                        </span>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

export default TenantSettingsPage;
