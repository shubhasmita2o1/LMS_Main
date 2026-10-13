import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import type { ApiResponse, TenantPublic } from '@university-lms/shared';
import { useAuthStore } from '../stores/authStore';

/**
 * Fetch current tenant (cached) for feature flag / plan awareness.
 */
export function useCurrentTenant() {
  const user = useAuthStore((s) => s.user);
  const hasTenant = Boolean(user?.tenantId);

  return useQuery({
    queryKey: ['tenant', 'me'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<TenantPublic>>('/tenants/me');
      if (!data.success || !data.data) throw new Error(data.error?.message || 'Failed to load tenant');
      return data.data;
    },
    enabled: hasTenant,
    staleTime: 60_000,
  });
}

/**
 * Hook: useFeatureFlag('advanced_analytics')
 * Returns { enabled, loading, tenant }
 */
export function useFeatureFlag(flagKey: string) {
  const { data: tenant, isLoading, isError } = useCurrentTenant();
  const user = useAuthStore((s) => s.user);

  // Super admin sees all features as enabled for UI exploration
  if (user?.roles.includes('super_admin')) {
    return { enabled: true, loading: false, tenant: null as TenantPublic | null };
  }

  const enabled = Boolean(tenant?.featureFlags?.[flagKey]);
  return {
    enabled: isError ? false : enabled,
    loading: isLoading,
    tenant: tenant ?? null,
  };
}

export function useTenantUsage() {
  const user = useAuthStore((s) => s.user);
  const hasTenant = Boolean(user?.tenantId);

  return useQuery({
    queryKey: ['tenant', 'usage'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{
        usage: Array<{ metric: string; value: number; limit: number; percent: number }>;
        limits: TenantPublic['limits'];
        planTier: string;
        status: string;
        featureFlags: Record<string, boolean>;
      }>>('/tenants/me/usage');
      if (!data.success || !data.data) throw new Error('Failed to load usage');
      return data.data;
    },
    enabled: hasTenant,
    staleTime: 30_000,
  });
}
