import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { getMyTenant } from '../lib/tenantsApi';
import type { TenantPublic } from '@university-lms/shared';

/**
 * Fetch and cache current tenant details for tenant-scoped users.
 * For super_admin without tenant context, skips gracefully.
 */
export function useCurrentTenant() {
  const { user, isAuthenticated } = useAuth();
  const isSuperAdminWithoutTenant = user?.roles?.includes('super_admin') && !user?.tenantId;

  return useQuery<TenantPublic | null>({
    queryKey: ['currentTenant', user?.tenantId],
    queryFn: async () => {
      if (isSuperAdminWithoutTenant) {
        return null;
      }
      return getMyTenant();
    },
    enabled: isAuthenticated && !isSuperAdminWithoutTenant && Boolean(user?.tenantId),
    staleTime: 60_000,
  });
}

/**
 * Check if a specific feature flag is active for the current tenant.
 * Super Admin has all features enabled by default for exploration.
 */
export function useFeatureFlag(flagKey: string): {
  enabled: boolean;
  loading: boolean;
  tenant: TenantPublic | null;
} {
  const { user } = useAuth();
  const tenantQuery = useCurrentTenant();

  // Super Admin bypass: all feature flags treated as enabled for system exploration
  if (user?.roles?.includes('super_admin')) {
    return {
      enabled: true,
      loading: false,
      tenant: tenantQuery.data ?? null,
    };
  }

  const tenant = tenantQuery.data ?? null;
  const isSuspendedOrCanceled = tenant?.status === 'suspended' || tenant?.status === 'canceled';
  const isEnabled = Boolean(tenant?.featureFlags?.[flagKey]) && !isSuspendedOrCanceled;

  return {
    enabled: isEnabled,
    loading: tenantQuery.isLoading,
    tenant,
  };
}

export default useFeatureFlag;
