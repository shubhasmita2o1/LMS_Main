import { useAuthStore } from '../stores/authStore';
import type { ResourceType, PermissionAction } from '@university-lms/shared';

export function usePermission() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasRole = useAuthStore((s) => s.hasRole);
  const user = useAuthStore((s) => s.user);

  return {
    user,
    can: (resource: ResourceType, action: PermissionAction) => hasPermission(resource, action),
    hasRole,
    isSuperAdmin: () => hasRole('super_admin'),
  };
}
