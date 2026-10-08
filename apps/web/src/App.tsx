import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Phase 3 Pages
import { AdminTenantsPage } from './pages/admin/AdminTenantsPage';
import { CreateTenantPage } from './pages/admin/CreateTenantPage';
import { TenantDetailPage } from './pages/admin/TenantDetailPage';
import { TenantSettingsPage } from './pages/tenant/TenantSettingsPage';
import { BillingPage } from './pages/tenant/BillingPage';

export default function App() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Routes>
      {/* Root route: In SaaS LMS products, root navigates to Dashboard if authenticated, else to Login */}
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

      {/* Explicit Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected Academic Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Super Admin Control Plane (/admin/*) */}
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

      {/* Tenant Admin Area: Settings & Billing */}
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

      {/* Access Denied (403) */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
