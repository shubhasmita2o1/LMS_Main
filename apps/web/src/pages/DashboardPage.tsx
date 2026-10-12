import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Can } from '../components/auth/Can';
import { Feature } from '../components/features/Feature';
import api from '../lib/api';

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const hasRole = useAuthStore((s) => s.hasRole);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout', { refreshToken });
    } catch {
      // Continue logging out even if the API request fails.
    }

    clearAuth();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-sm font-bold text-white">
              UL
            </div>
            <span className="font-semibold text-slate-900">
              University LMS
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">
              {user?.firstName} {user?.lastName}
              <span className="ml-2 text-xs text-slate-400">
                ({user?.roles?.join(', ')})
              </span>
            </span>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">
          Dashboard
        </h1>

        <p className="mb-8 text-slate-500">
          Phase 5 — Student Information System
        </p>

        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          {/* Account information */}
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
              Account
            </div>

            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Email</dt>
                <dd className="break-all text-right font-medium text-slate-900">
                  {user?.email}
                </dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Tenant ID</dt>
                <dd className="break-all text-right font-mono text-xs text-slate-700">
                  {user?.tenantId ?? 'null (platform)'}
                </dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Roles</dt>
                <dd className="text-right font-medium text-slate-900">
                  {user?.roles?.join(', ')}
                </dd>
              </div>
            </dl>
          </section>

          {/* Quick navigation */}
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
              Quick links
            </div>

            <ul className="space-y-2 text-sm">
              {hasRole('super_admin') && (
                <li>
                  <Link
                    to="/admin/tenants"
                    className="font-medium text-primary-600 hover:underline"
                  >
                    Platform Admin → Tenants
                  </Link>
                </li>
              )}

              {(hasRole('tenant_admin') ||
                hasRole('university_admin') ||
                hasRole('super_admin')) && (
                <li>
                  <Link
                    to="/settings"
                    className="font-medium text-primary-600 hover:underline"
                  >
                    Tenant Settings
                  </Link>
                </li>
              )}

              {(hasRole('tenant_admin') ||
                hasRole('university_admin') ||
                hasRole('super_admin')) && (
                <li>
                  <Link
                    to="/academic"
                    className="font-medium text-primary-600 hover:underline"
                  >
                    Academic Structure
                  </Link>
                </li>
              )}

              {/* Student navigation is currently available to all dashboard users. */}
              <li>
                <Link
                  to="/students"
                  className="font-medium text-primary-600 hover:underline"
                >
                  Students
                </Link>
              </li>

              {(hasRole('tenant_admin') || hasRole('super_admin')) && (
                <li>
                  <Link
                    to="/billing"
                    className="font-medium text-primary-600 hover:underline"
                  >
                    Billing & Plans
                  </Link>
                </li>
              )}

              <Can resource="user" action="read">
                <li>
                  <Link
                    to="/users"
                    className="font-medium text-primary-600 hover:underline"
                  >
                    Users
                  </Link>
                </li>
              </Can>
            </ul>
          </section>
        </div>

        {/* User management */}
        <Can resource="user" action="read">
          <section className="mb-4 rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-2 font-semibold text-slate-900">
              User management
            </h2>

            <p className="mb-3 text-sm text-slate-500">
              You have permission to read users in your tenant scope.
            </p>

            <Link
              to="/users"
              className="inline-flex text-sm font-medium text-primary-600 hover:underline"
            >
              View users →
            </Link>
          </section>
        </Can>

        {/* Feature-flagged analytics */}
        <Feature
          flag="advanced_analytics"
          fallback={
            <div className="mb-4 text-sm text-slate-400">
              Advanced analytics is not enabled on your plan.
            </div>
          }
        >
          <div className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
            Advanced analytics is enabled for this tenant.
          </div>
        </Feature>

        {/* Permission-based management access */}
        <Can
          resource="user"
          action="manage"
          fallback={
            <div className="text-sm text-slate-400">
              No manage-user permission — privileged UI is hidden.
            </div>
          }
        >
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            You can manage users in this tenant.
          </div>
        </Can>
      </main>
    </div>
  );
}
