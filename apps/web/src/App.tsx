import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Phase 3
import { AdminTenantsPage } from './pages/admin/AdminTenantsPage';
import { CreateTenantPage } from './pages/admin/CreateTenantPage';
import { TenantDetailPage } from './pages/admin/TenantDetailPage';
import { TenantSettingsPage } from './pages/tenant/TenantSettingsPage';
import { BillingPage } from './pages/tenant/BillingPage';

// Phase 4
import { AcademicTreePage } from './pages/academic/AcademicTreePage';
import { DepartmentsPage } from './pages/academic/DepartmentsPage';
import { ProgramsPage } from './pages/academic/ProgramsPage';
import { BatchesPage } from './pages/academic/BatchesPage';
import { AcademicYearsPage } from './pages/academic/AcademicYearsPage';
import { AcademicSettingsPage } from './pages/academic/AcademicSettingsPage';
import { CreateUniversityPage } from './pages/academic/CreateUniversityPage';

export default function App() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={
          isLoading ? (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
              <div className="animate-pulse text-sm font-semibold text-slate-500">
                Loading LMS portal...
              </div>
            </div>
          ) : isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LoginPage />
          )
        }
      />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/tenants"
        element={
          <ProtectedRoute roles={['super_admin']}>
            <AdminTenantsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/tenants/new"
        element={
          <ProtectedRoute roles={['super_admin']}>
            <CreateTenantPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/tenants/:id"
        element={
          <ProtectedRoute roles={['super_admin']}>
            <TenantDetailPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute roles={['tenant_admin', 'university_admin', 'super_admin']}>
            <TenantSettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/billing"
        element={
          <ProtectedRoute roles={['tenant_admin', 'university_admin', 'super_admin']}>
            <BillingPage />
          </ProtectedRoute>
        }
      />

      {/* Phase 4 — Academic structure */}
      <Route
        path="/academic"
        element={
          <ProtectedRoute>
            <AcademicTreePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/academic/universities/new"
        element={
          <ProtectedRoute roles={['tenant_admin', 'university_admin', 'super_admin']}>
            <CreateUniversityPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/academic/departments"
        element={
          <ProtectedRoute>
            <DepartmentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/academic/programs"
        element={
          <ProtectedRoute>
            <ProgramsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/academic/batches"
        element={
          <ProtectedRoute>
            <BatchesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/academic/years"
        element={
          <ProtectedRoute>
            <AcademicYearsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/academic/settings"
        element={
          <ProtectedRoute roles={['tenant_admin', 'university_admin', 'super_admin']}>
            <AcademicSettingsPage />
          </ProtectedRoute>
        }
      />

      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
