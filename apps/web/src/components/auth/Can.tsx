import type { ReactNode } from 'react';
import type { ResourceType, PermissionAction } from '@university-lms/shared';
import { usePermission } from '../../hooks/usePermission';

interface CanProps {
  resource: ResourceType;
  action: PermissionAction;
  children: ReactNode;
  fallback?: ReactNode;
}

/** Renders children only if current user has the given permission */
export function Can({ resource, action, children, fallback = null }: CanProps) {
  const { can } = usePermission();
  if (!can(resource, action)) return <>{fallback}</>;
  return <>{children}</>;
}
