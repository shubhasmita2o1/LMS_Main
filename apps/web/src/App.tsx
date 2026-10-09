import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/UsersPage';
import { AdminTenantsPage } from './pages/admin/AdminTenantsPage';
import { CreateTenantPage } from './pages/admin/CreateTenantPage';
import { TenantDetailPage } from './pages/admin/TenantDetailPage';
import { TenantSettingsPage } from './pages/TenantSettingsPage';
import { BillingPage } from './pages/BillingPage';
import { AcademicTreePage } from './pages/academic/AcademicTreePage';
import { DepartmentsPage } from './pages/academic/DepartmentsPage';
import { ProgramsPage } from './pages/academic/ProgramsPage';
import { BatchesPage } from './pages/academic/BatchesPage';
import { AcademicYearsPage } from './pages/academic/AcademicYearsPage';
import { AcademicSettingsPage } from './pages/academic/AcademicSettingsPage';
import { CreateUniversityPage } from './pages/academic/CreateUniversityPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useAuthStore } from './stores/authStore';

function HomePage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 text-white text-2xl font-bold mb-6">
          UL
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">University LMS</h1>
        <p className="text-slate-500 mb-8">
          Multi-tenant SaaS platform • Phase 4: University & Academic Structure
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          {isAuthenticated() ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center px-5 py-2.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="inline-flex items-center px-5 py-2.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition"
              >
                Register
              </Link>
            </>
          )}
        </div>
        <p className="mt-10 text-xs text-slate-400">
          Phase 4 • Hierarchy · Departments · Programs · Batches · Academic config
        </p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute roles={['tenant_admin', 'university_admin', 'super_admin']}><TenantSettingsPage /></ProtectedRoute>} />
      <Route path="/billing" element={<ProtectedRoute roles={['tenant_admin', 'super_admin']}><BillingPage /></ProtectedRoute>} />
      <Route path="/admin/tenants" element={<ProtectedRoute roles={['super_admin']}><AdminTenantsPage /></ProtectedRoute>} />
      <Route path="/admin/tenants/new" element={<ProtectedRoute roles={['super_admin']}><CreateTenantPage /></ProtectedRoute>} />
      <Route path="/admin/tenants/:id" element={<ProtectedRoute roles={['super_admin']}><TenantDetailPage /></ProtectedRoute>} />
      <Route path="/academic" element={<ProtectedRoute><AcademicTreePage /></ProtectedRoute>} />
      <Route path="/academic/universities/new" element={<ProtectedRoute roles={['tenant_admin', 'university_admin', 'super_admin']}><CreateUniversityPage /></ProtectedRoute>} />
      <Route path="/academic/departments" element={<ProtectedRoute><DepartmentsPage /></ProtectedRoute>} />
      <Route path="/academic/programs" element={<ProtectedRoute><ProgramsPage /></ProtectedRoute>} />
      <Route path="/academic/batches" element={<ProtectedRoute><BatchesPage /></ProtectedRoute>} />
      <Route path="/academic/years" element={<ProtectedRoute><AcademicYearsPage /></ProtectedRoute>} />
      <Route path="/academic/settings" element={<ProtectedRoute roles={['tenant_admin', 'university_admin', 'super_admin']}><AcademicSettingsPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
