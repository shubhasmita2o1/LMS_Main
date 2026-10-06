import { useAuth } from './useAuth';
import type { ResourceType, PermissionAction, AuthUser } from '@university-lms/shared';
import { SYSTEM_ROLE_PERMISSIONS } from '@university-lms/shared';

/**
 * Pure helper to verify if an AuthUser has permission for a specific resource & action.
 */
export function checkUserPermission(
  user: AuthUser | null,
  resource: ResourceType,
  action: PermissionAction,
  scope?: string
): boolean {
  if (!user) return false;

  // 1. Super admin has unrestricted permission across all resources
  if (user.roles?.includes('super_admin')) {
    return true;
  }

  // 2. Check explicit user permissions array
  if (user.permissions && Array.isArray(user.permissions)) {
    const hasExplicit = user.permissions.some((p) => {
      const matchResource = p.resource === resource;
      const matchAction = p.action === action || p.action === 'manage';
      const matchScope = !scope || !p.scope || p.scope === scope;
      return matchResource && matchAction && matchScope;
    });

    if (hasExplicit) return true;
  }

  // 3. Fallback check against default role permissions
  if (user.roles && Array.isArray(user.roles)) {
    for (const role of user.roles) {
      const defaultRolePerms = SYSTEM_ROLE_PERMISSIONS[role];
      if (defaultRolePerms) {
        const matches = defaultRolePerms.some((p) => {
          const matchResource = p.resource === resource;
          const matchAction = p.action === action || p.action === 'manage';
          return matchResource && matchAction;
        });
        if (matches) return true;
      }
    }
  }

  return false;
}

/**
 * Hook to check if the authenticated user has a specific permission.
 *
 * Example:
 *   const canCreateUser = usePermission('user', 'create');
 */
export function usePermission(
  resource: ResourceType,
  action: PermissionAction,
  scope?: string
): boolean {
  const { user } = useAuth();
  return checkUserPermission(user, resource, action, scope);
}

export default usePermission;
