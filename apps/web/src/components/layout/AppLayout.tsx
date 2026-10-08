import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  GraduationCap,
  LogOut,
  ShieldCheck,
  Building,
  Menu,
  X,
  RefreshCw,
  Settings,
  CreditCard,
  LayoutDashboard,
} from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, logout, logoutAll, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      navigate('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLogoutAll = async () => {
    if (confirm('Are you sure you want to sign out from all devices?')) {
      try {
        setIsLoggingOut(true);
        await logoutAll();
        navigate('/login');
      } finally {
        setIsLoggingOut(false);
      }
    }
  };

  const handleRefreshUser = async () => {
    try {
      setIsRefreshing(true);
      await refreshUser();
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const initials =
    user?.firstName && user?.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
      : user?.email
        ? user.email.slice(0, 2).toUpperCase()
        : 'U';

  const isSuperAdmin = user?.roles?.includes('super_admin');
  const isTenantAdmin = user?.roles?.some((r) =>
    ['tenant_admin', 'university_admin'].includes(r)
  );

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center gap-6">
              <Link to="/dashboard" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-sm group-hover:bg-primary-700 transition">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-lg text-slate-900 leading-none block">
                    University LMS
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Console
                  </span>
                </div>
              </Link>

              {/* Desktop Nav Items */}
              <nav className="hidden md:flex items-center gap-1.5 pl-4 border-l border-slate-200">
                <Link
                  to="/dashboard"
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                    isActive('/dashboard')
                      ? 'text-primary-700 bg-primary-50 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>

                {/* Super Admin Nav Item */}
                {isSuperAdmin && (
                  <Link
                    to="/admin/tenants"
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                      isActive('/admin')
                        ? 'text-purple-700 bg-purple-50 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Building className="w-4 h-4" />
                    <span>Tenants</span>
                  </Link>
                )}

                {/* Tenant Admin Nav Items */}
                {(isTenantAdmin || (isSuperAdmin && user?.tenantId)) && (
                  <>
                    <Link
                      to="/settings"
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                        isActive('/settings')
                          ? 'text-primary-700 bg-primary-50 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </Link>

                    <Link
                      to="/billing"
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                        isActive('/billing')
                          ? 'text-primary-700 bg-primary-50 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Billing</span>
                    </Link>
                  </>
                )}
              </nav>
            </div>

            {/* User Profile Bar & Actions */}
            <div className="hidden md:flex items-center gap-4">
              {/* Tenant / Admin indicator */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
                {isSuperAdmin ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <span className="font-semibold text-purple-800">System Super Admin</span>
                  </>
                ) : (
                  <>
                    <Building className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-600 font-medium truncate max-w-[150px]">
                      Tenant: {user?.tenantId ? user.tenantId.slice(-6) : 'Default'}
                    </span>
                  </>
                )}
              </div>

              {/* Refresh user profile */}
              <button
                type="button"
                onClick={handleRefreshUser}
                disabled={isRefreshing}
                title="Refresh session details"
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-primary-600' : ''}`} />
              </button>

              {/* User Avatar & Name */}
              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
                <div className="w-9 h-9 rounded-full bg-primary-600 text-white font-bold text-xs flex items-center justify-center ring-2 ring-white shadow-sm">
                  {initials}
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold text-slate-800 leading-tight">
                    {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.email}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Badge variant={isSuperAdmin ? 'purple' : 'primary'} size="sm">
                      {user?.roles?.[0] || 'User'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                isLoading={isLoggingOut}
                leftIcon={<LogOut className="w-4 h-4" />}
                className="text-slate-700 hover:text-red-600 hover:border-red-200"
              >
                Sign out
              </Button>
            </div>

            {/* Mobile menu trigger */}
            <div className="md:hidden flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-4 space-y-3">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-full bg-primary-600 text-white font-bold text-sm flex items-center justify-center">
                {initials}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.email}
                </p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
            </div>

            <div className="space-y-1">
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-100"
              >
                Dashboard
              </Link>

              {isSuperAdmin && (
                <Link
                  to="/admin/tenants"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-medium text-purple-700 hover:bg-purple-50"
                >
                  Tenants &amp; Platform
                </Link>
              )}

              {(isTenantAdmin || (isSuperAdmin && user?.tenantId)) && (
                <>
                  <Link
                    to="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-100"
                  >
                    Institution Settings
                  </Link>

                  <Link
                    to="/billing"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-100"
                  >
                    Billing &amp; Plans
                  </Link>
                </>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                isLoading={isLoggingOut}
                className="w-full justify-center"
              >
                Sign out
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogoutAll}
                isLoading={isLoggingOut}
                className="w-full justify-center text-xs text-red-600 hover:bg-red-50"
              >
                Sign out all devices
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} University LMS SaaS. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> API Connected
            </span>
            <span>Version 0.3.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default AppLayout;
