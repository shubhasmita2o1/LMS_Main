import type { ReactNode } from 'react';
import { usePermission } from '../../hooks/usePermission';
import type { ResourceType, PermissionAction } from '@university-lms/shared';

interface CanProps {
  resource: ResourceType;
  action: PermissionAction;
  scope?: string;
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Declarative component for permission-aware UI rendering.
 *
 * Example:
 *   <Can resource="user" action="create">
 *     <Button>Create User</Button>
 *   </Can>
 */
export function Can({
  resource,
  action,
  scope,
  fallback = null,
  children,
}: CanProps) {
  const isAllowed = usePermission(resource, action, scope);

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default Can;
