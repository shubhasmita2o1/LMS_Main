import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePermission } from '../hooks/usePermission';
import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { Can } from '../components/auth/Can';
import { Feature } from '../components/features/Feature';
import { api } from '../lib/api';
import {
  User,
  Shield,
  Key,
  Building,
  RefreshCw,
  LogOut,
  Smartphone,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  BarChart3,
  TrendingUp,
  Settings,
  CreditCard,
  ArrowRight,
  Plus,
  Users,
  GraduationCap,
} from 'lucide-react';
import type { ApiResponse, AuthUser } from '@university-lms/shared';

export function DashboardPage() {
  const { user, refreshUser, logout, logoutAll } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const canManageUsers = usePermission('user', 'manage');
  const canReadCourses = usePermission('course', 'read');
  const canManageGrades = usePermission('grade', 'manage');

  const isSuperAdmin = Boolean(user?.roles?.includes('super_admin'));
  const isTenantAdmin = Boolean(
    user?.roles?.some((r) => r === 'tenant_admin' || r === 'university_admin')
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setFeedback(null);
    try {
      await refreshUser();
      setFeedback({ type: 'success', message: 'User profile refreshed successfully from server (/auth/me).' });
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Failed to refresh profile.' });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTestProtectedApi = async () => {
    setIsRefreshing(true);
    setFeedback(null);
    try {
      const res = await api.get<ApiResponse<AuthUser>>('/auth/me');
      setFeedback({
        type: 'success',
        message: `Protected API call successful! User ID: ${res.data.data?.id}. Bearer token was attached automatically.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Protected API call failed.',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLogoutAll = async () => {
    if (confirm('Are you sure you want to log out from all devices?')) {
      setIsLoggingOut(true);
      try {
        await logoutAll();
      } finally {
        setIsLoggingOut(false);
      }
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <span>Welcome, {user?.firstName || 'User'}!</span>
              <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500/20" />
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Phase 2 Authentication, RBAC &amp; Multi-Tenant context is active and working.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              isLoading={isRefreshing}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Refresh Profile
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestProtectedApi}
              isLoading={isRefreshing}
              leftIcon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            >
              Test Protected API
            </Button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <Alert
            variant={feedback.type}
            onClose={() => setFeedback(null)}
          >
            {feedback.message}
          </Alert>
        )}

        {/* Phase 3 Super Admin Quick Launch */}
        {isSuperAdmin && (
          <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-md">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge variant="purple" size="sm" className="bg-purple-500/20 text-purple-200 border-purple-400/30">
                    Super Admin Control Plane
                  </Badge>
                  <span className="text-xs text-purple-200/80">Phase 3 Tenant Governance</span>
                </div>
                <h2 className="text-xl font-bold tracking-tight">Institutional Tenant Provisioning &amp; Platform Control</h2>
                <p className="text-sm text-purple-200/90 mt-1 max-w-2xl">
                  Monitor system-wide multi-tenant instances, inspect quotas, suspend/activate tenants, or provision new universities.
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <Link to="/admin/tenants">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                    leftIcon={<Building className="w-4 h-4" />}
                  >
                    Tenant Directory
                  </Button>
                </Link>
                <Link to="/admin/tenants/new">
                  <Button
                    variant="primary"
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-500 text-white border-none shadow-sm"
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Provision Tenant
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Phase 3 Tenant Admin Quick Launch */}
        {isTenantAdmin && (
          <div className="bg-gradient-to-r from-primary-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-md">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge variant="primary" size="sm" className="bg-primary-500/20 text-primary-200 border-primary-400/30">
                    Institution Administration
                  </Badge>
                  <span className="text-xs text-primary-200/80">Phase 3 Self-Service Portal</span>
                </div>
                <h2 className="text-xl font-bold tracking-tight">Institution Settings &amp; Subscription Management</h2>
                <p className="text-sm text-primary-200/90 mt-1 max-w-2xl">
                  Configure institutional branding and primary theme colors, inspect plan quotas, or upgrade your subscription tier.
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <Link to="/settings">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                    leftIcon={<Settings className="w-4 h-4" />}
                  >
                    Settings &amp; Branding
                  </Button>
                </Link>
                <Link to="/billing">
                  <Button
                    variant="primary"
                    size="sm"
                    className="bg-primary-600 hover:bg-primary-500 text-white border-none shadow-sm"
                    leftIcon={<CreditCard className="w-4 h-4" />}
                  >
                    Subscription &amp; Plans
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Top Grid: User Profile & Tenant Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* User Profile Card */}
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-primary-600" />
                  User Profile Information
                </CardTitle>
                <CardDescription>
                  Details returned from the server for this session
                </CardDescription>
              </div>
              <div className="flex gap-1.5">
                {user?.roles?.map((role) => (
                  <Badge
                    key={role}
                    variant={role === 'super_admin' ? 'purple' : 'primary'}
                    size="md"
                  >
                    {role}
                  </Badge>
                ))}
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-medium text-slate-500 block mb-1">Full Name</span>
                  <span className="text-sm font-semibold text-slate-800">
                    {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Not provided'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-medium text-slate-500 block mb-1">Email Address</span>
                  <span className="text-sm font-semibold text-slate-800 font-mono">
                    {user?.email}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-medium text-slate-500 block mb-1">User Identifier</span>
                  <span className="text-xs font-mono text-slate-700 break-all">
                    {user?.id}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-medium text-slate-500 block mb-1">Assigned Tenant</span>
                  <span className="text-xs font-mono text-slate-700 break-all">
                    {user?.tenantId ? user.tenantId : 'None (Super Admin Global Context)'}
                  </span>
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-slate-400" />
                Access tokens automatically rotate via silent refresh interceptor
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  isLoading={isLoggingOut}
                  leftIcon={<LogOut className="w-3.5 h-3.5" />}
                >
                  Logout
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogoutAll}
                  isLoading={isLoggingOut}
                  leftIcon={<Smartphone className="w-3.5 h-3.5 text-red-500" />}
                  className="text-red-600 hover:bg-red-50 text-xs"
                >
                  Logout All Devices
                </Button>
              </div>
            </CardFooter>
          </Card>

          {/* Tenant & RBAC Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-600" />
                Tenant &amp; Scope
              </CardTitle>
              <CardDescription>
                Multi-tenant isolation status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Tenant Status</span>
                  <span className="font-semibold text-emerald-600">Active</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Scope Type</span>
                  <span className="font-medium text-slate-800">
                    {user?.tenantId ? 'Institutional Tenant' : 'Platform Level'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Header Injected</span>
                  <code className="text-[11px] bg-slate-200 px-1 py-0.5 rounded text-slate-700">
                    x-tenant-id
                  </code>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                  Quick Role Capabilities
                </span>
                <ul className="text-xs text-slate-600 space-y-1.5">
                  <li className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${canManageUsers ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span>Manage Users: {canManageUsers ? 'Granted' : 'Denied'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${canReadCourses ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span>Read Courses: {canReadCourses ? 'Granted' : 'Denied'}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${canManageGrades ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span>Manage Grades: {canManageGrades ? 'Granted' : 'Denied'}</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fine-Grained Permissions & Declarative RBAC */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-600" />
                  Fine-Grained Permissions &amp; RBAC Demo
                </CardTitle>
                <CardDescription>
                  Evaluated using <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">usePermission()</code> hook and <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">&lt;Can&gt;</code> component
                </CardDescription>
              </div>
              <span className="text-xs text-slate-500">
                {user?.permissions?.length || 0} explicit permission rules
              </span>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Conditional UI components demo */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Declarative UI Protection Demo (&lt;Can&gt; Component)
              </h4>
              <div className="flex flex-wrap gap-3">
                <Can
                  resource="user"
                  action="create"
                  fallback={
                    <Button variant="outline" size="sm" disabled leftIcon={<Lock className="w-3.5 h-3.5" />}>
                      Create User (No Permission)
                    </Button>
                  }
                >
                  <Button variant="primary" size="sm" leftIcon={<User className="w-3.5 h-3.5" />}>
                    Create User (Permission Granted)
                  </Button>
                </Can>

                <Can
                  resource="course"
                  action="read"
                  fallback={
                    <Button variant="outline" size="sm" disabled leftIcon={<Lock className="w-3.5 h-3.5" />}>
                      View Courses (No Permission)
                    </Button>
                  }
                >
                  <Button variant="secondary" size="sm" leftIcon={<Layers className="w-3.5 h-3.5" />}>
                    View Courses (Permission Granted)
                  </Button>
                </Can>

                <Can
                  resource="grade"
                  action="update"
                  fallback={
                    <Button variant="outline" size="sm" disabled leftIcon={<Lock className="w-3.5 h-3.5" />}>
                      Edit Grades (No Permission)
                    </Button>
                  }
                >
                  <Button variant="secondary" size="sm" leftIcon={<Shield className="w-3.5 h-3.5" />}>
                    Edit Grades (Permission Granted)
                  </Button>
                </Can>
              </div>
            </div>

            {/* Permissions list */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-3">
                Current User Permissions Matrix
              </h4>
              {user?.permissions && user.permissions.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {user.permissions.map((perm, idx) => (
                    <div
                      key={`${perm.resource}-${perm.action}-${idx}`}
                      className="p-2.5 rounded-lg border border-slate-200 bg-white shadow-2xs text-xs"
                    >
                      <div className="font-semibold text-slate-800 capitalize">
                        {perm.resource}
                      </div>
                      <div className="text-[11px] text-primary-600 font-mono mt-0.5">
                        action: {perm.action}
                      </div>
                      {perm.scope && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          scope: {perm.scope}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  No explicit permissions loaded. Fallback system role rules apply.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Phase 3 Feature Flag System Demo: Advanced Analytics */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary-600" />
                Advanced Analytics &amp; Reporting Module
              </CardTitle>
              <CardDescription>
                Demonstrates the Phase 3 feature flag system with{' '}
                <code className="text-xs bg-slate-100 px-1 py-0.5 rounded font-mono">
                  &lt;Feature flag="advanced_analytics"&gt;
                </code>
              </CardDescription>
            </div>
            <Badge variant="default" size="sm">
              Flag: advanced_analytics
            </Badge>
          </CardHeader>
          <CardContent>
            <Feature
              flag="advanced_analytics"
              fallback={
                <div className="p-6 rounded-2xl border border-amber-200 bg-amber-50/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-amber-900">
                          Advanced Analytics is Locked on Your Current Plan
                        </h4>
                        <Badge variant="warning" size="sm">
                          Requires Pro / Enterprise
                        </Badge>
                      </div>
                      <p className="text-xs text-amber-800 leading-relaxed max-w-2xl">
                        Real-time cohort retention analytics, course completion drop-off funnels, and predictive grade distribution modeling are exclusive to Professional and Enterprise tiers.
                      </p>
                    </div>
                  </div>
                  <Link to="/billing" className="shrink-0">
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<TrendingUp className="w-4 h-4" />}
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      Upgrade Subscription
                    </Button>
                  </Link>
                </div>
              }
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-semibold text-emerald-900">
                      Feature Flag Active &mdash; Advanced Academic Insights Unlocked
                    </span>
                  </div>
                  <Badge variant="success" size="sm">
                    Active on Plan
                  </Badge>
                </div>

                {/* Analytics KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span>Cohort Completion</span>
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">94.2%</div>
                    <div className="text-[11px] text-emerald-600 font-medium mt-1">
                      +3.8% from prior semester
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span>Active Cohorts</span>
                      <Users className="w-4 h-4 text-primary-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">42</div>
                    <div className="text-[11px] text-slate-500 font-medium mt-1">
                      Across 8 academic departments
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span>Student Engagement</span>
                      <Sparkles className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">88.6 / 100</div>
                    <div className="text-[11px] text-emerald-600 font-medium mt-1">
                      High LMS platform activity
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span>Projected Retention</span>
                      <GraduationCap className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">96.1%</div>
                    <div className="text-[11px] text-slate-500 font-medium mt-1">
                      Based on mid-term benchmarks
                    </div>
                  </div>
                </div>

                {/* Analytics Breakdown Visual */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Department Performance Benchmarks
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                        <span>Computer Science &amp; Engineering</span>
                        <span>96% Pass Rate</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-primary-600 h-2 rounded-full" style={{ width: '96%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                        <span>Business Administration</span>
                        <span>91% Pass Rate</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-primary-600 h-2 rounded-full" style={{ width: '91%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                        <span>Health Sciences</span>
                        <span>88% Pass Rate</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-primary-600 h-2 rounded-full" style={{ width: '88%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Feature>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

export default DashboardPage;
