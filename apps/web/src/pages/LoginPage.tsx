import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AuthLayout } from '../components/layout/AuthLayout';
import { LoginForm } from '../components/auth/LoginForm';

export function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // If already authenticated, redirect to dashboard or requested page
  if (!isLoading && isAuthenticated) {
    const from =
      (location.state as { from?: { pathname?: string } })?.from?.pathname ||
      '/dashboard';
    return <Navigate to={from} replace />;
  }

  return (
    <AuthLayout
      title="Institutional Sign in"
      subtitle="Sign in with your university credentials or SSO account to access your academic portal."
      badgeText="Academic Cloud • Multi-Tenant SaaS"
    >
      <LoginForm />
    </AuthLayout>
  );
}

export default LoginPage;
