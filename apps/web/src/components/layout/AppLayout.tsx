import { useState, useEffect, type ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, DEMO_PERSONAS } from '../../stores/authStore';
import { useTenantStore } from '../../stores/tenantStore';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { NotificationDrawer } from '../common/NotificationDrawer';
import { QuickActionModal } from '../common/QuickActionModal';
import {
  GraduationCap,
  LayoutDashboard,
  Building,
  Users,
  UserCheck,
  BookOpen,
  PlayCircle,
  FlaskConical,
  FileCheck2,
  CalendarDays,
  CalendarCheck2,
  Award,
  CreditCard,
  Library,
  Briefcase,
  Megaphone,
  BarChart3,
  FileText,
  ShieldAlert,
  ShieldCheck,
  LifeBuoy,
  Settings,
  ChevronDown,
  Search,
  Bell,
  Plus,
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  Clock,
  UserPlus,
} from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
  fullWidth?: boolean;
}

interface NavGroup {
  groupName: string;
  items: {
    to: string;
    label: string;
    icon: any;
    badge?: string | number;
    badgeVariant?: 'primary' | 'warning' | 'danger' | 'success';
  }[];
}

export function AppLayout({ children, fullWidth = false }: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAuth, loginWithDemoUser } = useAuthStore();
  const {
    currentTenant,
    currentCampus,
    tenants,
    campuses,
    setTenant,
    setCampus,
    academicYear,
    currentTerm,
    theme,
    toggleTheme,
    getCampusesForTenant,
  } = useTenantStore();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isTenantPickerOpen, setIsTenantPickerOpen] = useState(false);
  const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = useState(false);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const isStudent = user?.roles?.includes('student') && !user?.roles?.some(r => ['faculty', 'tenant_admin', 'university_admin', 'super_admin'].includes(r));
  const isFaculty = user?.roles?.includes('faculty');

  const DEMO_MODE = import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true';
  const SHOW_FUTURE_NAV = import.meta.env.VITE_SHOW_FUTURE_NAV === 'true';

  const tenantCampuses = getCampusesForTenant(currentTenant.id);

  // Role-Aware Navigation
  const navigationGroups: NavGroup[] = (() => {
    const roles = user?.roles || [];
    const groups: NavGroup[] = [];

    if (roles.includes('super_admin')) {
      groups.push({
        groupName: 'Platform Governance',
        items: [
          { to: '/dashboard', label: 'Platform Dashboard', icon: LayoutDashboard },
          { to: '/tenants', label: 'Tenants / Universities', icon: Building },
          { to: '/users', label: 'Users & Approvals', icon: Users },
          { to: '/roles', label: 'Roles & RBAC Matrix', icon: ShieldCheck },
          { to: '/audit', label: 'Audit Trail', icon: ShieldAlert },
          { to: '/settings', label: 'Platform Settings', icon: Settings },
          { to: '/support', label: 'Support & Helpdesk', icon: LifeBuoy },
        ],
      });
    } else if (roles.includes('tenant_admin') || roles.includes('university_admin')) {
      groups.push(
        {
          groupName: 'Overview',
          items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
        },
        {
          groupName: 'Academic Community',
          items: [
            { to: '/academic', label: 'Campuses & Hierarchy', icon: Layers },
            { to: '/students', label: 'Student SIS', icon: Users },
            { to: '/faculty', label: 'Faculty Management', icon: UserCheck },
            { to: '/courses', label: 'Curriculum & Courses', icon: BookOpen },
          ],
        },
        {
          groupName: 'Teaching & Evaluation',
          items: [
            { to: '/learn', label: 'Core LMS (Theory)', icon: PlayCircle },
            { to: '/question-bank', label: 'Question Bank', icon: BookOpen },
            { to: '/assignments', label: 'Assignments', icon: FileCheck2 },
            { to: '/quizzes', label: 'Quizzes & Tests', icon: Award },
            { to: '/attendance', label: 'Attendance Register', icon: CalendarCheck2 },
            { to: '/gradebook', label: 'Gradebook & Results', icon: Award },
          ],
        },
        {
          groupName: 'Governance',
          items: [
            { to: '/users', label: 'User Directory & Approvals', icon: Users },
            { to: '/roles', label: 'Roles & Permissions', icon: ShieldCheck },
            { to: '/settings', label: 'Tenant Settings', icon: Settings },
          ],
        }
      );
    } else if (roles.includes('department_head')) {
      groups.push(
        {
          groupName: 'Overview',
          items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
        },
        {
          groupName: 'Department Academic',
          items: [
            { to: '/courses', label: 'Department Courses', icon: BookOpen },
            { to: '/students', label: 'Students (SIS)', icon: Users },
            { to: '/faculty', label: 'Faculty', icon: UserCheck },
          ],
        },
        {
          groupName: 'Learning & Evaluation',
          items: [
            { to: '/learn', label: 'Core LMS', icon: PlayCircle },
            { to: '/question-bank', label: 'Question Bank', icon: BookOpen },
            { to: '/assignments', label: 'Assignments', icon: FileCheck2 },
            { to: '/quizzes', label: 'Quizzes', icon: Award },
            { to: '/attendance', label: 'Attendance Register', icon: CalendarCheck2 },
            { to: '/gradebook', label: 'Gradebook & Results', icon: Award },
          ],
        },
        {
          groupName: 'Account',
          items: [{ to: '/faculty/me', label: 'My Faculty Profile', icon: UserCheck }],
        }
      );
    } else if (roles.includes('faculty')) {
      groups.push(
        {
          groupName: 'Overview',
          items: [{ to: '/dashboard', label: 'Faculty Dashboard', icon: LayoutDashboard }],
        },
        {
          groupName: 'My Teaching',
          items: [
            { to: '/courses', label: 'My Courses', icon: BookOpen },
            { to: '/learn', label: 'Core LMS (Teach)', icon: PlayCircle },
            { to: '/question-bank', label: 'Question Bank', icon: BookOpen },
            { to: '/assignments', label: 'Assignments & Grading', icon: FileCheck2 },
            { to: '/quizzes', label: 'Quizzes & Attempts', icon: Award },
            { to: '/attendance', label: 'Mark Attendance', icon: CalendarCheck2 },
            { to: '/gradebook', label: 'Gradebook', icon: Award },
          ],
        },
        {
          groupName: 'Account',
          items: [{ to: '/faculty/me', label: 'My Faculty Profile', icon: UserCheck }],
        }
      );
    } else if (isStudent) {
      groups.push(
        {
          groupName: 'Overview',
          items: [{ to: '/dashboard', label: 'Student Dashboard', icon: LayoutDashboard }],
        },
        {
          groupName: 'My Academics',
          items: [
            { to: '/learn/my-courses', label: 'My Courses', icon: BookOpen },
            { to: '/assignments', label: 'Assignments', icon: FileCheck2 },
            { to: '/quizzes', label: 'Quizzes & Tests', icon: Award },
            { to: '/attendance', label: 'My Attendance', icon: CalendarCheck2 },
            { to: '/gradebook/transcript', label: 'Results & Transcript', icon: Award },
          ],
        },
        {
          groupName: 'Account',
          items: [{ to: '/students/me', label: 'My Student Profile', icon: Users }],
        }
      );
    } else {
      groups.push({
        groupName: 'Overview',
        items: [
          { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/learn/my-courses', label: 'My Courses', icon: BookOpen },
        ],
      });
    }

    if (SHOW_FUTURE_NAV) {
      groups.push({
        groupName: 'Future Modules (Phase 11+)',
        items: [
          { to: '/labs', label: 'Practical Labs', icon: FlaskConical, badge: 'Soon' },
          { to: '/examinations', label: 'Examinations', icon: CalendarDays, badge: 'Soon' },
          { to: '/admissions', label: 'Admissions', icon: UserPlus, badge: 'Soon' },
          { to: '/finance', label: 'Finance & Fees', icon: CreditCard, badge: 'Soon' },
          { to: '/library', label: 'Library', icon: Library, badge: 'Soon' },
          { to: '/placement', label: 'Placement', icon: Briefcase, badge: 'Soon' },
          { to: '/documents', label: 'Certificates', icon: FileText, badge: 'Soon' },
          { to: '/reports', label: 'Accreditation', icon: BarChart3, badge: 'Soon' },
          { to: '/communication', label: 'Communication Hub', icon: Megaphone, badge: 'Soon' },
        ],
      });
    }

    return groups;
  })();

  const userName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
    : 'User';
  const userEmail = user?.email || '';
  const currentRole = user?.roles[0] || 'university_admin';
  const roleLabel = currentRole.replace(/_/g, ' ').toUpperCase();
  const userInitials = (
    (user?.firstName?.[0] || user?.email?.[0] || 'U') + (user?.lastName?.[0] || '')
  ).toUpperCase();

  const isCurrentActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <div className="min-h-screen bg-[#f5f6f7] text-slate-900 flex flex-col antialiased selection:bg-primary-700 selection:text-white">
      {/* Modals & Drawers */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <NotificationDrawer isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
      <QuickActionModal isOpen={isQuickActionOpen} onClose={() => setIsQuickActionOpen(false)} />

      {/* Role Switcher Modal (Interactive Live Demo - DEV only) */}
      {isRoleSwitcherOpen && DEMO_MODE && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">Switch Demo Role Persona</h3>
                  <p className="text-xs text-slate-500">Test the ERP platform instantly across all 9 roles</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRoleSwitcherOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 grid sm:grid-cols-3 gap-3 max-h-[70vh] overflow-y-auto">
              {DEMO_PERSONAS.map((persona) => {
                const isSelected = persona.role === currentRole;
                return (
                  <button
                    key={persona.role}
                    type="button"
                    onClick={() => {
                      loginWithDemoUser(persona.role, currentTenant.id);
                      setIsRoleSwitcherOpen(false);
                      setIsUserMenuOpen(false);
                    }}
                    className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50/50 ring-2 ring-primary-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <img
                        src={persona.avatar}
                        alt={persona.name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200"
                      />
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-primary-700 uppercase">
                          {persona.label}
                        </span>
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {persona.name}
                        </p>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2">{persona.title}</p>
                    <span className="mt-2 text-[11px] font-medium text-primary-600">
                      {isSelected ? '✓ Current Role' : 'Switch →'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Top Application Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-2xs">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left Brand & Toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link to="/dashboard" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-sm shadow-primary-500/20 group-hover:bg-primary-700 transition">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="hidden sm:block">
                <span className="font-extrabold text-base text-slate-900 leading-tight block tracking-tight">
                  University LMS
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600">
                  Enterprise ERP SaaS
                </span>
              </div>
            </Link>

            {/* Tenant & Campus Context Selector Dropdown */}
            <div className="hidden md:flex items-center gap-2 ml-4 pl-4 border-l border-slate-200 relative">
              <button
                type="button"
                onClick={() => setIsTenantPickerOpen(!isTenantPickerOpen)}
                className="flex items-center gap-2 py-1 px-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition text-left"
              >
                <img
                  src={currentTenant.logo}
                  alt={currentTenant.name}
                  className="w-5 h-5 rounded object-cover border border-slate-200"
                />
                <div className="text-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>{currentTenant.name}</span>
                    <span className="text-[10px] font-mono px-1 rounded bg-slate-100 text-slate-600">
                      {currentTenant.code}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium truncate max-w-[150px]">
                    {currentCampus.name}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
              </button>

              {/* Tenant Switcher Flyout */}
              {isTenantPickerOpen && (
                <div className="absolute top-12 left-4 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-40 animate-scaleUp">
                  <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Switch University / Tenant</span>
                    <Link
                      to="/select-tenant"
                      onClick={() => setIsTenantPickerOpen(false)}
                      className="text-[11px] font-semibold text-primary-600 hover:underline"
                    >
                      Browse All
                    </Link>
                  </div>
                  <div className="py-1 space-y-1">
                    {tenants.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setTenant(t);
                          setIsTenantPickerOpen(false);
                        }}
                        className={`w-full p-2 rounded-xl text-left flex items-center gap-2.5 transition ${
                          t.id === currentTenant.id
                            ? 'bg-primary-50 text-primary-800 font-bold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <img
                          src={t.logo}
                          alt={t.name}
                          className="w-7 h-7 rounded object-cover border border-slate-200"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs truncate">{t.name}</p>
                          <p className="text-[10px] text-slate-400">{t.type}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Campus Selector */}
                  <div className="pt-2 border-t border-slate-100 px-2">
                    <span className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Campus in {currentTenant.code}:
                    </span>
                    <select
                      value={currentCampus.id}
                      onChange={(e) => {
                        const target = campuses.find((c) => c.id === e.target.value);
                        if (target) setCampus(target);
                      }}
                      className="w-full text-xs py-1.5 px-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800"
                    >
                      {tenantCampuses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Term badge */}
              <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{academicYear} • {currentTerm}</span>
              </div>
            </div>
          </div>

          {/* Center Search Input */}
          <div className="flex-1 max-w-md hidden md:block">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="w-full pl-4 pr-3 py-2 rounded-full border border-slate-200/80 bg-slate-50/70 hover:bg-white hover:border-slate-300 text-left text-xs text-slate-400 flex items-center justify-between transition group shadow-2xs"
            >
              <div className="flex items-center gap-2.5">
                <Search className="w-4 h-4 text-slate-400 group-hover:text-primary-700 transition" />
                <span className="text-slate-500 font-medium">Search tasks, metrics, or departments...</span>
              </div>
              <kbd className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[10px] font-mono text-slate-500 shadow-2xs">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Quick Action Button */}
            <button
              type="button"
              onClick={() => setIsQuickActionOpen(true)}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-primary-700 hover:bg-primary-800 text-white text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Quick Create</span>
            </button>

            {/* Notification Center */}
            <button
              type="button"
              onClick={() => setIsNotificationsOpen(true)}
              className="relative w-9 h-9 rounded-full border border-slate-200/80 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 hover:text-slate-900 transition shadow-2xs"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary-600 ring-2 ring-white" />
            </button>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="w-9 h-9 rounded-full border border-slate-200/80 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition shadow-2xs"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* User Profile */}
            <div className="relative pl-1 sm:pl-2 border-l border-slate-200">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2.5 py-1 px-1.5 sm:px-2 rounded-full hover:bg-slate-100 transition text-left"
              >
                <div className="w-9 h-9 rounded-full bg-primary-600 text-white font-bold flex items-center justify-center text-xs shadow-xs ring-2 ring-primary-700/20 shrink-0">
                  {userInitials}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    {userName}
                  </div>
                  <div className="text-[10px] font-medium text-slate-400">
                    {userEmail || `${currentRole}@university.edu`}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
              </button>

              {/* User Menu Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 top-12 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-40 animate-scaleUp">
                  <div className="p-3 border-b border-slate-100 bg-slate-50/70 rounded-xl mb-1">
                    <p className="text-xs font-bold text-slate-900">{userName}</p>
                    <p className="text-[11px] text-slate-500">{userEmail}</p>
                    <span className="mt-1.5 inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-100 text-primary-800">
                      {roleLabel}
                    </span>
                  </div>

                  <div className="py-1 text-xs text-slate-700 space-y-0.5">
                    <Link
                      to="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="w-full px-3 py-2 rounded-lg text-left hover:bg-slate-100 flex items-center gap-2 font-medium"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                      <span>My Profile</span>
                    </Link>

                    {DEMO_MODE && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsRoleSwitcherOpen(true);
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full px-3 py-2 rounded-lg text-left hover:bg-primary-50 hover:text-primary-700 font-semibold flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-primary-600" />
                          Switch Role (Dev Demo)
                        </span>
                      </button>
                    )}

                    {!isStudent && (
                      <Link
                        to="/select-tenant"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full px-3 py-2 rounded-lg text-left hover:bg-slate-100 flex items-center gap-2"
                      >
                        <Building className="w-3.5 h-3.5 text-slate-500" />
                        <span>Switch University / Tenant</span>
                      </Link>
                    )}

                    {!isStudent && !isFaculty && (
                      <Link
                        to="/settings"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full px-3 py-2 rounded-lg text-left hover:bg-slate-100 flex items-center gap-2"
                      >
                        <Settings className="w-3.5 h-3.5 text-slate-500" />
                        <span>System Settings</span>
                      </Link>
                    )}
                  </div>

                  <div className="pt-1 border-t border-slate-100 mt-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full px-3 py-2 rounded-lg text-left hover:bg-rose-50 text-rose-600 font-semibold flex items-center gap-2 text-xs"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Body Layout: Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Collapsible Sidebar */}
        <aside
          className={`hidden lg:flex flex-col bg-white border-r border-slate-200 transition-all duration-200 shrink-0 select-none ${
            sidebarCollapsed ? 'w-18' : 'w-64'
          }`}
        >
          {/* Scrollable Navigation */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
            {navigationGroups.map((group) => (
              <div key={group.groupName}>
                {!sidebarCollapsed && (
                  <h3 className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    {group.groupName}
                  </h3>
                )}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isCurrentActive(item.to);
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        title={sidebarCollapsed ? item.label : undefined}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                          active
                            ? 'bg-primary-50 text-primary-700 shadow-2xs font-bold'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        } ${sidebarCollapsed ? 'justify-center px-0 py-2.5' : ''}`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-primary-600' : 'text-slate-500'}`} />
                        {!sidebarCollapsed && (
                          <div className="flex-1 flex items-center justify-between min-w-0">
                            <span className="truncate">{item.label}</span>
                            {item.badge && (
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1.5 shrink-0 ${
                                  item.badgeVariant === 'danger'
                                    ? 'bg-rose-100 text-rose-700'
                                    : item.badgeVariant === 'warning'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-primary-100 text-primary-700'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Donezo-style Mobile App Mini Card */}
          {!sidebarCollapsed && (
            <div className="px-3 pb-2">
              <div className="rounded-2xl bg-gradient-to-br from-[#165239] via-[#11402c] to-[#0a271b] text-white p-4 relative overflow-hidden shadow-sm">
                <div className="relative z-10">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center mb-2.5">
                    <GraduationCap className="w-4 h-4 text-emerald-300" />
                  </div>
                  <h4 className="text-xs font-bold leading-tight">Download our Mobile App</h4>
                  <p className="text-[10px] text-emerald-200/80 mt-1 leading-relaxed">
                    Get quick mobile access to LMS & campus alerts
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsQuickActionOpen(true)}
                    className="mt-3 w-full py-1.5 px-3 rounded-full bg-[#247c59] hover:bg-[#2e9c70] text-[11px] font-bold text-white transition text-center shadow-xs"
                  >
                    Quick Portal
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sidebar Collapse Toggle */}
          <div className="p-3 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
            {!sidebarCollapsed && (
              <div className="text-[11px] text-slate-400 font-medium">
                v1.0 • Enterprise Edition
              </div>
            )}
            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 transition mx-auto lg:mx-0"
              title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col z-50 animate-slideRight">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center text-white">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm text-slate-900">University LMS</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {navigationGroups.map((group) => (
                  <div key={group.groupName}>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      {group.groupName}
                    </h4>
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const active = isCurrentActive(item.to);
                        return (
                          <Link
                            key={item.to}
                            to={item.to}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                              active
                                ? 'bg-primary-50 text-primary-700 font-bold'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="w-4 h-4" />
                              <span>{item.label}</span>
                            </div>
                            {item.badge && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary-100 text-primary-700 font-bold">
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-2 px-3 rounded-xl border border-rose-200 text-rose-600 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-rose-50"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto">
          <div className={fullWidth ? 'p-4 sm:p-6 lg:p-8' : 'max-w-7xl mx-auto p-4 sm:p-6 lg:p-8'}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
export default AppLayout;
