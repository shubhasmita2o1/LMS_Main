import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '../../components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';
import {
  getPlatformStats,
  listTenants,
  suspendTenant,
  activateTenant,
  type ListTenantsParams,
} from '../../lib/adminApi';
import type { TenantStatus, PlanTier } from '@university-lms/shared';
import {
  Building,
  Plus,
  Search,
  Users,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  PauseCircle,
  PlayCircle,
  Eye,
  RefreshCw,
  Clock,
  Globe,
} from 'lucide-react';

export function AdminTenantsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Stats query
  const statsQuery = useQuery({
    queryKey: ['adminStats'],
    queryFn: getPlatformStats,
    staleTime: 30_000,
  });

  // Tenants query
  const queryParams: ListTenantsParams = {
    page,
    limit: 15,
    search: search.trim() || undefined,
    status: statusFilter !== 'all' ? (statusFilter as TenantStatus) : undefined,
    planTier: planFilter !== 'all' ? (planFilter as PlanTier) : undefined,
  };

  const tenantsQuery = useQuery({
    queryKey: ['adminTenants', queryParams],
    queryFn: () => listTenants(queryParams),
    staleTime: 15_000,
  });

  // Suspend mutation
  const suspendMutation = useMutation({
    mutationFn: (id: string) => suspendTenant(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['adminTenants'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      setFeedback({ type: 'success', message: `Tenant "${data.name}" has been suspended.` });
    },
    onError: (err: Error) => {
      setFeedback({ type: 'error', message: err.message || 'Failed to suspend tenant' });
    },
  });

  // Activate mutation
  const activateMutation = useMutation({
    mutationFn: (id: string) => activateTenant(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['adminTenants'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      setFeedback({ type: 'success', message: `Tenant "${data.name}" has been activated.` });
    },
    onError: (err: Error) => {
      setFeedback({ type: 'error', message: err.message || 'Failed to activate tenant' });
    },
  });

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
        return <Badge variant="default">Free Tier</Badge>;
      default:
        return <Badge variant="default">{tier}</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                Super Admin Control Plane
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Building className="w-7 h-7 text-primary-600" />
              <span>Multi-Tenant Management</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Oversee all provisioned university tenants, subscription plans, usage caps, and institutional statuses.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['adminTenants'] });
                queryClient.invalidateQueries({ queryKey: ['adminStats'] });
              }}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Refresh
            </Button>
            <Link to="/admin/tenants/new">
              <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                Create Tenant
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

        {/* Platform Overview Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* Total Tenants */}
          <Card className="p-4 bg-white">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total</span>
              <Building className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {statsQuery.isLoading ? <Spinner size="sm" /> : statsQuery.data?.totalTenants ?? 0}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">All registered institutions</p>
          </Card>

          {/* Active Tenants */}
          <Card className="p-4 bg-white border-l-4 border-l-emerald-500">
            <div className="flex items-center justify-between text-emerald-700 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Active</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-emerald-900">
              {statsQuery.isLoading ? <Spinner size="sm" /> : statsQuery.data?.activeTenants ?? 0}
            </div>
            <p className="text-[11px] text-emerald-600 mt-1">Healthy subscriptions</p>
          </Card>

          {/* Trialing */}
          <Card className="p-4 bg-white border-l-4 border-l-primary-500">
            <div className="flex items-center justify-between text-primary-700 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Trialing</span>
              <Clock className="w-4 h-4 text-primary-500" />
            </div>
            <div className="text-2xl font-bold text-primary-900">
              {statsQuery.isLoading ? <Spinner size="sm" /> : statsQuery.data?.trialingTenants ?? 0}
            </div>
            <p className="text-[11px] text-primary-600 mt-1">In active evaluation</p>
          </Card>

          {/* Suspended */}
          <Card className="p-4 bg-white border-l-4 border-l-red-500">
            <div className="flex items-center justify-between text-red-700 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Suspended</span>
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-red-900">
              {statsQuery.isLoading ? <Spinner size="sm" /> : statsQuery.data?.suspendedTenants ?? 0}
            </div>
            <p className="text-[11px] text-red-600 mt-1">Action required</p>
          </Card>

          {/* Total Platform Users */}
          <Card className="p-4 bg-white">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Users</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900">
              {statsQuery.isLoading ? <Spinner size="sm" /> : statsQuery.data?.totalUsers ?? 0}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Across all campuses</p>
          </Card>

          {/* MRR Estimate */}
          <Card className="p-4 bg-white border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between text-purple-700 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Est. MRR</span>
              <CreditCard className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {statsQuery.isLoading ? (
                <Spinner size="sm" />
              ) : (
                `$${statsQuery.data?.revenueSkeleton?.mrrEstimate ?? 0}`
              )}
            </div>
            <p className="text-[11px] text-purple-600 mt-1">Monthly run rate</p>
          </Card>
        </div>

        {/* Filter & Search Bar */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search by institution name, slug, or domain..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="w-40">
                <Select
                  options={[
                    { value: 'all', label: 'All Statuses' },
                    { value: 'active', label: 'Active' },
                    { value: 'trialing', label: 'Trialing' },
                    { value: 'past_due', label: 'Past Due' },
                    { value: 'suspended', label: 'Suspended' },
                    { value: 'canceled', label: 'Canceled' },
                  ]}
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                />
              </div>

              <div className="w-40">
                <Select
                  options={[
                    { value: 'all', label: 'All Plan Tiers' },
                    { value: 'free', label: 'Free' },
                    { value: 'starter', label: 'Starter' },
                    { value: 'professional', label: 'Professional' },
                    { value: 'enterprise', label: 'Enterprise' },
                  ]}
                  value={planFilter}
                  onChange={(e) => {
                    setPlanFilter(e.target.value);
                    setPage(1);
                  }}
                />
              </div>

              {(search || statusFilter !== 'all' || planFilter !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('all');
                    setPlanFilter('all');
                    setPage(1);
                  }}
                  className="text-xs text-slate-500"
                >
                  Reset filters
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Tenants Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <span>Institutions &amp; Campuses</span>
                <span className="text-xs font-normal text-slate-400">
                  ({tenantsQuery.data?.total ?? 0} total)
                </span>
              </CardTitle>
              <CardDescription>
                Live multi-tenant instances isolated under database tenant scoping
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {tenantsQuery.isLoading ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3">
                <Spinner size="lg" className="text-primary-600" />
                <p className="text-sm text-slate-500">Loading university tenants...</p>
              </div>
            ) : tenantsQuery.isError ? (
              <div className="p-6">
                <Alert variant="error" title="Failed to load tenants">
                  {tenantsQuery.error instanceof Error
                    ? tenantsQuery.error.message
                    : 'An unexpected error occurred while fetching tenants.'}
                </Alert>
              </div>
            ) : tenantsQuery.data?.items.length === 0 ? (
              <div className="py-16 text-center px-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
                  <Building className="w-6 h-6" />
                </div>
                <h4 className="text-base font-semibold text-slate-800">No tenants found</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                  {search || statusFilter !== 'all' || planFilter !== 'all'
                    ? 'No institutions matched your filter query. Try adjusting your search keywords.'
                    : 'Get started by creating your first university tenant on the platform.'}
                </p>
                <Link to="/admin/tenants/new">
                  <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                    Create Tenant
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-y border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-4">Institution Name</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Plan Tier</th>
                      <th className="py-3 px-4">Domain / Slug</th>
                      <th className="py-3 px-4">Created Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {tenantsQuery.data?.items.map((tenant) => (
                      <tr
                        key={tenant.id}
                        className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                        onClick={() => navigate(`/admin/tenants/${tenant.id}`)}
                      >
                        {/* Name & ID */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors flex items-center gap-2">
                            {tenant.branding?.logoUrl ? (
                              <img
                                src={tenant.branding.logoUrl}
                                alt=""
                                className="w-6 h-6 rounded object-cover border border-slate-200"
                              />
                            ) : (
                              <div
                                className="w-6 h-6 rounded flex items-center justify-center text-white text-[10px] font-bold"
                                style={{
                                  backgroundColor: tenant.branding?.primaryColor || '#2563eb',
                                }}
                              >
                                {tenant.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <span>{tenant.name}</span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                            ID: {tenant.id}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">{getStatusBadge(tenant.status)}</td>

                        {/* Plan */}
                        <td className="py-3.5 px-4">{getPlanBadge(tenant.planTier)}</td>

                        {/* Domain / Slug */}
                        <td className="py-3.5 px-4">
                          <div className="font-mono text-xs text-slate-700">{tenant.slug}</div>
                          {tenant.customDomain ? (
                            <div className="text-[11px] text-primary-600 flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              <span>{tenant.customDomain}</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">Default subdomain</span>
                          )}
                        </td>

                        {/* Created */}
                        <td className="py-3.5 px-4 text-xs text-slate-500">
                          {new Date(tenant.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>

                        {/* Actions */}
                        <td
                          className="py-3.5 px-4 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/admin/tenants/${tenant.id}`)}
                              title="View full tenant details"
                              leftIcon={<Eye className="w-3.5 h-3.5" />}
                              className="text-xs"
                            >
                              View
                            </Button>

                            {tenant.status === 'suspended' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                isLoading={
                                  activateMutation.isPending &&
                                  activateMutation.variables === tenant.id
                                }
                                onClick={() => activateMutation.mutate(tenant.id)}
                                leftIcon={<PlayCircle className="w-3.5 h-3.5 text-emerald-600" />}
                                className="text-xs text-emerald-700 hover:bg-emerald-50"
                              >
                                Activate
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                isLoading={
                                  suspendMutation.isPending &&
                                  suspendMutation.variables === tenant.id
                                }
                                onClick={() => {
                                  if (
                                    confirm(
                                      `Are you sure you want to suspend tenant "${tenant.name}"? Users from this institution will be blocked from logging in.`
                                    )
                                  ) {
                                    suspendMutation.mutate(tenant.id);
                                  }
                                }}
                                leftIcon={<PauseCircle className="w-3.5 h-3.5 text-amber-600" />}
                                className="text-xs text-slate-600 hover:text-red-600 hover:border-red-200"
                              >
                                Suspend
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {tenantsQuery.data && tenantsQuery.data.totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Showing page {tenantsQuery.data.page} of {tenantsQuery.data.totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= tenantsQuery.data.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

export default AdminTenantsPage;
