import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Can } from '../components/auth/Can';
import { Feature } from '../components/features/Feature';
import type { SystemRole } from '../types/auth';

export function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const hasRole = (role: SystemRole) => Boolean(user?.roles?.includes(role));

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold text-sm">
              UL
            </div>
            <span className="font-semibold text-slate-900">University LMS</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">
              {user?.firstName} {user?.lastName}
              <span className="ml-2 text-xs text-slate-400">({user?.roles?.join(', ')})</span>
            </span>
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Dashboard</h1>
        <p className="text-slate-500 mb-8">Phase 4 — University & Academic Structure</p>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
              Account
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Email</dt>
                <dd className="font-medium text-slate-900">{user?.email}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Tenant ID</dt>
                <dd className="font-mono text-xs text-slate-700">
                  {user?.tenantId ?? 'null (platform)'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Roles</dt>
                <dd className="font-medium text-slate-900">{user?.roles?.join(', ')}</dd>
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
                  <Link to="/settings" className="text-primary-600 hover:underline font-medium">
                    Tenant Settings
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
              {(hasRole('tenant_admin') || hasRole('super_admin')) && (
                <li>
                  <Link to="/billing" className="text-primary-600 hover:underline font-medium">
                    Billing & Plans
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>

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
      </main>
    </div>
  );
}
