import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppLayout } from '../../components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import {
  getTenantById,
  updateTenant,
  suspendTenant,
  activateTenant,
  type UpdateTenantInput,
} from '../../lib/adminApi';
import type { TenantStatus, PlanTier } from '@university-lms/shared';
import { FEATURE_FLAGS } from '@university-lms/shared';
import {
  Building,
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  Palette,
  Layers,
  PauseCircle,
  PlayCircle,
  Globe,
  Users,
  HardDrive,
  BookOpen,
  UserCheck,
  Calendar,
  CheckCircle2,
  XCircle,
  Edit,
  Save,
  X,
} from 'lucide-react';

export function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editPlan, setEditPlan] = useState<PlanTier>('free');
  const [editStatus, setEditStatus] = useState<TenantStatus>('active');
  const [editName, setEditName] = useState('');
  const [editCustomDomain, setEditCustomDomain] = useState('');

  const tenantQuery = useQuery({
    queryKey: ['adminTenant', id],
    queryFn: () => getTenantById(id!),
    enabled: Boolean(id),
    staleTime: 15_000,
  });

  const tenant = tenantQuery.data;

  // Initialize edit form when opening editor
  const handleOpenEdit = () => {
    if (tenant) {
      setEditName(tenant.name);
      setEditPlan(tenant.planTier);
      setEditStatus(tenant.status);
      setEditCustomDomain(tenant.customDomain || '');
      setIsEditing(true);
    }
  };

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (input: UpdateTenantInput) => updateTenant(id!, input),
    onSuccess: (data) => {
      queryClient.setQueryData(['adminTenant', id], data);
      queryClient.invalidateQueries({ queryKey: ['adminTenants'] });
      setIsEditing(false);
      setFeedback({ type: 'success', message: 'Tenant updated successfully.' });
    },
    onError: (err: Error) => {
      setFeedback({ type: 'error', message: err.message || 'Failed to update tenant.' });
    },
  });

  // Suspend mutation
  const suspendMutation = useMutation({
    mutationFn: () => suspendTenant(id!),
    onSuccess: (data) => {
      queryClient.setQueryData(['adminTenant', id], data);
      queryClient.invalidateQueries({ queryKey: ['adminTenants'] });
      setFeedback({ type: 'success', message: `Tenant "${data.name}" has been suspended.` });
    },
    onError: (err: Error) => {
      setFeedback({ type: 'error', message: err.message || 'Failed to suspend tenant.' });
    },
  });

  // Activate mutation
  const activateMutation = useMutation({
    mutationFn: () => activateTenant(id!),
    onSuccess: (data) => {
      queryClient.setQueryData(['adminTenant', id], data);
      queryClient.invalidateQueries({ queryKey: ['adminTenants'] });
      setFeedback({ type: 'success', message: `Tenant "${data.name}" has been activated.` });
    },
    onError: (err: Error) => {
      setFeedback({ type: 'error', message: err.message || 'Failed to activate tenant.' });
    },
  });

  const handleSaveEdit = () => {
    updateMutation.mutate({
      name: editName.trim(),
      planTier: editPlan,
      status: editStatus,
      customDomain: editCustomDomain.trim() || null,
    });
  };

  const getStatusBadge = (status: TenantStatus) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'trialing':
        return <Badge variant="primary">Trialing</Badge>;
      case 'suspended':
        return <Badge variant="danger">Suspended</Badge>;
      case 'past_due':
        return <Badge variant="warning">Past Due</Badge>;
      case 'canceled':
        return <Badge variant="default">Canceled</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getPlanBadge = (tier: PlanTier) => {
    switch (tier) {
      case 'enterprise':
        return <Badge variant="purple">Enterprise</Badge>;
      case 'professional':
        return <Badge variant="primary">Professional</Badge>;
      case 'starter':
        return <Badge variant="default">Starter</Badge>;
      case 'free':
        return <Badge variant="default">Free</Badge>;
      default:
        return <Badge variant="default">{tier}</Badge>;
    }
  };

  if (tenantQuery.isLoading) {
    return (
      <AppLayout>
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" className="text-primary-600" />
          <p className="text-sm text-slate-500">Loading institution details...</p>
        </div>
      </AppLayout>
    );
  }

  if (tenantQuery.isError || !tenant) {
    return (
      <AppLayout>
        <div className="space-y-4 max-w-xl mx-auto py-12">
          <Alert variant="error" title="Tenant Not Found">
            {tenantQuery.error instanceof Error
              ? tenantQuery.error.message
              : 'Could not load details for this tenant.'}
          </Alert>
          <Link to="/admin/tenants">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to All Tenants
            </Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between pb-2">
          <Link
            to="/admin/tenants"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Tenants</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">ID: {tenant.id}</span>
          </div>
        </div>

        {/* Header Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-start gap-4">
            {tenant.branding?.logoUrl ? (
              <img
                src={tenant.branding.logoUrl}
                alt=""
                className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-sm shrink-0"
              />
            ) : (
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-sm shrink-0"
                style={{ backgroundColor: tenant.branding?.primaryColor || '#2563eb' }}
              >
                {tenant.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {tenant.name}
                </h1>
                {getStatusBadge(tenant.status)}
                {getPlanBadge(tenant.planTier)}
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                <span className="font-mono">slug: {tenant.slug}</span>
                {tenant.customDomain && (
                  <span className="text-primary-600 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5" />
                    <span>{tenant.customDomain}</span>
                  </span>
                )}
                <span>Created {new Date(tenant.createdAt).toLocaleDateString()}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenEdit}
                leftIcon={<Edit className="w-4 h-4" />}
              >
                Edit Tenant
              </Button>
            )}

            {tenant.status === 'suspended' ? (
              <Button
                variant="primary"
                size="sm"
                isLoading={activateMutation.isPending}
                onClick={() => activateMutation.mutate()}
                leftIcon={<PlayCircle className="w-4 h-4" />}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Activate Instance
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                isLoading={suspendMutation.isPending}
                onClick={() => {
                  if (
                    confirm(
                      `Are you sure you want to suspend "${tenant.name}"? Users will be blocked from logging in.`
                    )
                  ) {
                    suspendMutation.mutate();
                  }
                }}
                leftIcon={<PauseCircle className="w-4 h-4 text-amber-600" />}
                className="text-slate-700 hover:text-red-600 hover:border-red-200"
              >
                Suspend Instance
              </Button>
            )}
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <Alert variant={feedback.type} onClose={() => setFeedback(null)}>
            {feedback.message}
          </Alert>
        )}

        {/* Quick Edit Drawer / Panel */}
        {isEditing && (
          <Card className="border-primary-200 bg-primary-50/20">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2 text-primary-950">
                  <Edit className="w-4 h-4 text-primary-600" />
                  <span>Edit Tenant Configuration</span>
                </CardTitle>
                <CardDescription>
                  Modify subscription plan tier, status override, or custom domain routing
                </CardDescription>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <Input
                  label="Institution Name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />

                <Select
                  label="Plan Tier"
                  options={[
                    { value: 'free', label: 'Free' },
                    { value: 'starter', label: 'Starter' },
                    { value: 'professional', label: 'Professional' },
                    { value: 'enterprise', label: 'Enterprise' },
                  ]}
                  value={editPlan}
                  onChange={(e) => setEditPlan(e.target.value as PlanTier)}
                />

                <Select
                  label="Status Override"
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'trialing', label: 'Trialing' },
                    { value: 'past_due', label: 'Past Due' },
                    { value: 'suspended', label: 'Suspended' },
                    { value: 'canceled', label: 'Canceled' },
                  ]}
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as TenantStatus)}
                />

                <Input
                  label="Custom Domain"
                  placeholder="e.g. lms.stanford.edu"
                  value={editCustomDomain}
                  onChange={(e) => setEditCustomDomain(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="justify-end gap-2.5 bg-white/70">
              <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={updateMutation.isPending}
                onClick={handleSaveEdit}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Subscription & Billing Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-600" />
                <span>Subscription &amp; Billing State</span>
              </CardTitle>
              <CardDescription>
                Payment gateway customer mapping and renewal lifecycle
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Billing Provider</span>
                  <span className="font-semibold text-slate-800 uppercase">
                    {tenant.subscription?.provider || 'none'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Customer Identifier</span>
                  <span className="font-mono text-slate-700">
                    {tenant.subscription?.customerId || 'None (Unbilled)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Subscription ID</span>
                  <span className="font-mono text-slate-700">
                    {tenant.subscription?.subscriptionId || 'None'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Trial Status</span>
                  <span className="font-medium text-slate-700">
                    {tenant.trialEndsAt
                      ? `Ends ${new Date(tenant.trialEndsAt).toLocaleDateString()}`
                      : 'No active trial'}
                  </span>
                </div>
              </div>

              {tenant.currentPeriodEnd && (
                <div className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Current billing period ends: {new Date(tenant.currentPeriodEnd).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 2: Branding & Domain Routing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="w-5 h-5 text-indigo-600" />
                <span>Branding &amp; Institutional Domain</span>
              </CardTitle>
              <CardDescription>
                Campus colors and white-label asset links
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Custom Domain</span>
                  <span className="font-mono font-medium text-slate-800">
                    {tenant.customDomain || 'Not configured'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Primary Brand Color</span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-4 h-4 rounded-full border border-slate-300"
                      style={{ backgroundColor: tenant.branding?.primaryColor || '#2563eb' }}
                    />
                    <span className="font-mono text-slate-700">
                      {tenant.branding?.primaryColor || '#2563eb'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Secondary Brand Color</span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-4 h-4 rounded-full border border-slate-300"
                      style={{ backgroundColor: tenant.branding?.secondaryColor || '#1e40af' }}
                    />
                    <span className="font-mono text-slate-700">
                      {tenant.branding?.secondaryColor || '#1e40af'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Campus Logo Asset</span>
                  <span className="text-slate-700 truncate max-w-[200px]">
                    {tenant.branding?.logoUrl ? (
                      <a
                        href={tenant.branding.logoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary-600 underline"
                      >
                        {tenant.branding.logoUrl}
                      </a>
                    ) : (
                      'None provided'
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Plan Resource Quotas & Limits */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                <span>Enforced Resource Quotas (Limits)</span>
              </CardTitle>
              <CardDescription>
                Tier-governed limits enforced by the tenant authorization engine
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>Max Students</span>
                  </div>
                  <div className="text-lg font-bold text-slate-800">
                    {tenant.limits?.maxStudents?.toLocaleString() ?? 'Unlimited'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Max Faculty</span>
                  </div>
                  <div className="text-lg font-bold text-slate-800">
                    {tenant.limits?.maxFaculty?.toLocaleString() ?? 'Unlimited'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Building className="w-3.5 h-3.5" />
                    <span>Max Admins</span>
                  </div>
                  <div className="text-lg font-bold text-slate-800">
                    {tenant.limits?.maxAdmins?.toLocaleString() ?? 'Unlimited'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Max Courses</span>
                  </div>
                  <div className="text-lg font-bold text-slate-800">
                    {tenant.limits?.maxCourses?.toLocaleString() ?? 'Unlimited'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 sm:col-span-2">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <HardDrive className="w-3.5 h-3.5" />
                    <span>Storage Cap</span>
                  </div>
                  <div className="text-lg font-bold text-slate-800">
                    {tenant.limits?.maxStorageGB ?? 0} GB
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Feature Flags Matrix */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary-600" />
                <span>Feature Flags Matrix</span>
              </CardTitle>
              <CardDescription>
                Capability toggles driving frontend modules and backend middleware
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {Object.entries(FEATURE_FLAGS).map(([label, flagKey]) => {
                  const isEnabled = Boolean(tenant.featureFlags?.[flagKey]);
                  return (
                    <div
                      key={flagKey}
                      className={`p-2.5 rounded-xl border flex items-center justify-between ${
                        isEnabled
                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                          : 'bg-slate-50/80 border-slate-200 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {isEnabled ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-slate-300 shrink-0" />
                        )}
                        <span className="font-medium truncate">{label.replace(/_/g, ' ')}</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded uppercase">
                        {isEnabled ? 'ON' : 'OFF'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

export default TenantDetailPage;
