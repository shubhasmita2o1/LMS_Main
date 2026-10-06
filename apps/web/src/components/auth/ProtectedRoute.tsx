import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { checkUserPermission } from '../../hooks/usePermission';
import { Spinner } from '../ui/Spinner';
import type { SystemRole, ResourceType, PermissionAction } from '@university-lms/shared';

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: SystemRole[];
  permission?: {
    resource: ResourceType;
    action: PermissionAction;
    scope?: string;
  };
}

export function ProtectedRoute({
  children,
  roles,
  permission,
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" className="text-primary-600" />
          <p className="text-sm font-medium text-slate-500 animate-pulse">
            Verifying authentication session...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check roles if required
  if (roles && roles.length > 0) {
    const hasRole = user.roles?.some((r) => roles.includes(r));
    if (!hasRole && !user.roles?.includes('super_admin')) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Check permission if required
  if (permission) {
    const hasPerm = checkUserPermission(
      user,
      permission.resource,
      permission.action,
      permission.scope
    );
    if (!hasPerm) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
}

export default ProtectedRoute;
