import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Can } from '../components/auth/Can';
import { Feature } from '../components/features/Feature';
import { AppLayout } from '../components/layout/AppLayout';

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const hasRole = useAuthStore((s) => s.hasRole);

  return (
    <AppLayout>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Dashboard</h1>
      <p className="text-slate-500 mb-8">Phase 8 — Core LMS / Theory Learning</p>

      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
            Account
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Email</dt>
              <dd className="font-medium text-slate-900 text-right truncate">{user?.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Tenant ID</dt>
              <dd className="font-mono text-xs text-slate-700 text-right">
                {user?.tenantId ?? 'null (platform)'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Roles</dt>
              <dd className="font-medium text-slate-900 text-right">{user?.roles?.join(', ')}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
            Quick links
          </div>
          <ul className="text-sm space-y-2">
            {hasRole('super_admin') && (
              <li>
                <Link to="/admin/tenants" className="text-primary-600 hover:underline font-medium">
                  Platform Admin → Tenants
                </Link>
              </li>
            )}
            {(hasRole('tenant_admin') || hasRole('university_admin') || hasRole('super_admin')) && (
              <li>
                <Link to="/academic" className="text-primary-600 hover:underline font-medium">
                  Academic Structure
                </Link>
              </li>
            )}
            <li>
              <Link to="/students" className="text-primary-600 hover:underline font-medium">
                Students
              </Link>
            </li>
            <li>
              <Link to="/faculty" className="text-primary-600 hover:underline font-medium">
                Faculty
              </Link>
            </li>
            <li>
              <Link to="/courses" className="text-primary-600 hover:underline font-medium">
                Courses
              </Link>
            </li>
            <li>
              <Link to="/learn" className="text-primary-600 hover:underline font-medium">
                My Learning
              </Link>
            </li>
            <li>
              <Link to="/curriculum" className="text-primary-600 hover:underline font-medium">
                Curriculum
              </Link>
            </li>
            {(hasRole('tenant_admin') || hasRole('super_admin')) && (
              <li>
                <Link to="/billing" className="text-primary-600 hover:underline font-medium">
                  Billing & Plans
                </Link>
              </li>
            )}
            <Can resource="user" action="read">
              <li>
                <Link to="/users" className="text-primary-600 hover:underline font-medium">
                  Users
                </Link>
              </li>
            </Can>
          </ul>
        </div>
      </div>

      <Can resource="user" action="read">
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
          <h2 className="font-semibold text-slate-900 mb-2">User management</h2>
          <p className="text-sm text-slate-500 mb-3">
            You have permission to read users in your tenant scope.
          </p>
          <Link
            to="/users"
            className="inline-flex text-sm font-medium text-primary-600 hover:underline"
          >
            View users →
          </Link>
        </div>
      </Can>

      <Feature
        flag="advanced_analytics"
        fallback={
          <div className="text-sm text-slate-400 mb-4">
            Advanced analytics is not enabled on your plan.
          </div>
        }
      >
        <div className="rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-800 text-sm px-4 py-3 mb-4">
          Advanced analytics is enabled for this tenant.
        </div>
      </Feature>

      <Can
        resource="user"
        action="manage"
        fallback={
          <div className="text-sm text-slate-400">
            (No manage-user permission — Can component hides privileged UI)
          </div>
        }
      >
        <div className="rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm px-4 py-3">
          You can manage users in this tenant.
        </div>
      </Can>
    </AppLayout>
  );
}
