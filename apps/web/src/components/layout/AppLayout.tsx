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
  BookOpen,
  Users,
  UserCheck,
  Library,
  PlayCircle,
  ClipboardList,
  HelpCircle,
  FileQuestion,
} from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
  /** When true, skip the outer max-width container (pages that manage their own width). */
  fullWidth?: boolean;
}

type NavItem = {
  to: string;
  label: string;
  icon: ReactNode;
  match?: string;
  show: boolean;
};

export function AppLayout({ children, fullWidth }: AppLayoutProps) {
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

  const roles = user?.roles ?? [];
  const isSuperAdmin = roles.includes('super_admin');
  const isTenantAdmin = roles.some((r) =>
    ['tenant_admin', 'university_admin'].includes(r)
  );
  const isFaculty = roles.includes('faculty');
  const isStudent = roles.includes('student');
  const hasTenantContext = Boolean(user?.tenantId) || isTenantAdmin || isFaculty || isStudent;

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const navItems: NavItem[] = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
      show: true,
    },
    {
      to: '/academic',
      label: 'Academic',
      icon: <Building className="w-4 h-4" />,
      show: hasTenantContext || isSuperAdmin,
    },
    {
      to: '/students',
      label: 'Students',
      icon: <Users className="w-4 h-4" />,
      show: hasTenantContext || isSuperAdmin,
    },
    {
      to: '/faculty',
      label: 'Faculty',
      icon: <UserCheck className="w-4 h-4" />,
      show: hasTenantContext || isSuperAdmin,
    },
    {
      to: '/courses',
      label: 'Courses',
      icon: <Library className="w-4 h-4" />,
      show: hasTenantContext || isSuperAdmin,
    },
    {
      to: '/learn',
      label: 'Learn',
      icon: <PlayCircle className="w-4 h-4" />,
      show: hasTenantContext || isSuperAdmin || isStudent || isFaculty,
    },
    {
      to: '/assignments',
      label: 'Assignments',
      icon: <ClipboardList className="w-4 h-4" />,
      show: hasTenantContext || isSuperAdmin || isStudent || isFaculty,
    },
    {
      to: '/quizzes',
      label: 'Quizzes',
      icon: <HelpCircle className="w-4 h-4" />,
      show: hasTenantContext || isSuperAdmin || isStudent || isFaculty,
    },
    {
      to: '/question-bank',
      label: 'Q-Bank',
      icon: <FileQuestion className="w-4 h-4" />,
      show: isFaculty || isTenantAdmin || isSuperAdmin,
    },
    {
      to: '/admin/tenants',
      label: 'Admin',
      icon: <ShieldCheck className="w-4 h-4" />,
      match: '/admin',
      show: isSuperAdmin,
    },
  ];

  const secondaryItems: NavItem[] = [
    {
      to: '/settings',
      label: 'Settings',
      icon: <Settings className="w-4 h-4" />,
      show: isTenantAdmin || (isSuperAdmin && Boolean(user?.tenantId)),
    },
    {
      to: '/billing',
      label: 'Billing',
      icon: <CreditCard className="w-4 h-4" />,
      show: isTenantAdmin || isSuperAdmin,
    },
  ];

  const linkClass = (path: string, accent?: 'purple') => {
    const active = isActive(path);
    if (accent === 'purple') {
      return active
        ? 'text-purple-700 bg-purple-50 font-semibold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100';
    }
    return active
      ? 'text-primary-700 bg-primary-50 font-semibold'
      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4 min-w-0">
              <Link to="/dashboard" className="flex items-center gap-3 group shrink-0">
                <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-sm group-hover:bg-primary-700 transition">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="hidden sm:block">
                  <span className="font-bold text-lg text-slate-900 leading-none block">
                    University LMS
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">Console</span>
                </div>
              </Link>

              <nav className="hidden lg:flex items-center gap-1 pl-3 border-l border-slate-200 overflow-x-auto">
                {navItems
                  .filter((n) => n.show)
                  .map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`px-2.5 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 whitespace-nowrap ${linkClass(
                        item.match || item.to,
                        item.to.startsWith('/admin') ? 'purple' : undefined
                      )}`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  ))}
                {secondaryItems
                  .filter((n) => n.show)
                  .map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`px-2.5 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 whitespace-nowrap ${linkClass(
                        item.to
                      )}`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  ))}
              </nav>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
                {isSuperAdmin ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <span className="font-semibold text-purple-800">Super Admin</span>
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-600 font-medium truncate max-w-[120px]">
                      {user?.tenantId ? `Tenant …${user.tenantId.slice(-6)}` : 'No tenant'}
                    </span>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={handleRefreshUser}
                disabled={isRefreshing}
                title="Refresh session"
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-primary-600' : ''}`}
                />
              </button>

              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
                <div className="w-9 h-9 rounded-full bg-primary-600 text-white font-bold text-xs flex items-center justify-center ring-2 ring-white shadow-sm">
                  {initials}
                </div>
                <div className="text-left hidden xl:block">
                  <div className="text-xs font-semibold text-slate-800 leading-tight">
                    {user?.firstName
                      ? `${user.firstName} ${user.lastName || ''}`
                      : user?.email}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    <Badge variant={isSuperAdmin ? 'purple' : 'primary'} size="sm">
                      {roles[0] || 'User'}
                    </Badge>
                  </div>
                </div>
              </div>

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

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-4 space-y-3">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-full bg-primary-600 text-white font-bold text-sm flex items-center justify-center">
                {initials}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {user?.firstName
                    ? `${user.firstName} ${user.lastName || ''}`
                    : user?.email}
                </p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
            </div>

            <div className="space-y-1">
              {[...navItems, ...secondaryItems]
                .filter((n) => n.show)
                .map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                      isActive(item.match || item.to)
                        ? 'bg-primary-50 text-primary-800'
                        : 'text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
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

      <main className="flex-1 py-8">
        {fullWidth ? (
          children
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>&copy; {new Date().getFullYear()} University LMS SaaS. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> API Connected
            </span>
            <span>Version 0.8.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default AppLayout;
