import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AuthLayout } from '../components/layout/AuthLayout';
import { RegisterForm } from '../components/auth/RegisterForm';

export function RegisterPage() {
  const { isAuthenticated, isLoading } = useAuth();

  // If already authenticated, redirect to dashboard
  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AuthLayout
      title="Create account"
      subtitle="Register a new user profile on University LMS"
    >
      <RegisterForm />
    </AuthLayout>
  );
}

export default RegisterPage;
