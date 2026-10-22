import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useTenantStore } from '../../stores/tenantStore';
import { AppLayout } from '../../components/layout/AppLayout';
import {
  Mail,
  Shield,
  Building,
  GraduationCap,
  Briefcase,
  CheckCircle2,
  LogOut,
  ArrowRight,
} from 'lucide-react';

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const currentTenant = useTenantStore((s) => s.currentTenant);

  const roles = user?.roles || [];
  const isStudent = roles.includes('student');
  const isFaculty = roles.includes('faculty') || roles.includes('department_head');

  const initials = `${user?.firstName?.[0] || 'U'}${user?.lastName?.[0] || ''}`.toUpperCase();

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Account &amp; Profile</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your personal credentials, identity roles, and active institution tenancy.
          </p>
        </div>

        {/* User Identity Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 border-b border-slate-100 pb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-600 to-indigo-700 text-white flex items-center justify-center text-2xl font-black shrink-0 shadow-sm">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  {user?.firstName} {user?.lastName}
                </h2>
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Active Account
                </span>
              </div>
              <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1">
                <Mail className="w-4 h-4 text-slate-400" />
                {user?.email}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {roles.map((role) => (
                  <span
                    key={role}
                    className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 uppercase"
                  >
                    {role.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => clearAuth()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>

          {/* Institutional Affiliation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                <Building className="w-4 h-4 text-primary-600" />
                Active Institution
              </div>
              <p className="text-sm font-bold text-slate-900">
                {currentTenant?.name || 'Central Platform'}
              </p>
              {(currentTenant?.code || currentTenant?.subdomain) && (
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Tenant Code: {currentTenant.code || currentTenant.subdomain}
                </p>
              )}
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                <Shield className="w-4 h-4 text-emerald-600" />
                Authentication Status
              </div>
              <p className="text-sm font-semibold text-slate-900">
                JWT Authenticated Session
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Multi-Tenant Scoped RBAC
              </p>
            </div>
          </div>

          {/* Quick links to role profiles */}
          {(isStudent || isFaculty) && (
            <div className="mt-6 pt-5 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Role Specific Profiles
              </h3>
              <div className="flex flex-wrap gap-3">
                {isStudent && (
                  <Link
                    to="/students/me"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-primary-400 hover:bg-primary-50/50 text-xs font-bold text-slate-800 transition"
                  >
                    <GraduationCap className="w-4 h-4 text-primary-600" />
                    My Student SIS Record <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
                {isFaculty && (
                  <Link
                    to="/faculty/me"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 text-xs font-bold text-slate-800 transition"
                  >
                    <Briefcase className="w-4 h-4 text-emerald-600" />
                    My Faculty Employment Profile <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
