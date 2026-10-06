import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { usePermission } from '../hooks/usePermission';
import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { Can } from '../components/auth/Can';
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
      </div>
    </AppLayout>
  );
}

export default DashboardPage;
