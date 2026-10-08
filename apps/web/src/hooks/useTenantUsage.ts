import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { getMyUsage, type TenantUsageResponse } from '../lib/tenantsApi';

export function useTenantUsage() {
  const { user, isAuthenticated } = useAuth();
  const canFetch =
    isAuthenticated &&
    Boolean(user?.tenantId) &&
    Boolean(
      user?.roles?.includes('tenant_admin') ||
        user?.roles?.includes('university_admin') ||
        user?.roles?.includes('super_admin')
    );

  return useQuery<TenantUsageResponse>({
    queryKey: ['tenantUsage', user?.tenantId],
    queryFn: getMyUsage,
    enabled: canFetch,
    staleTime: 30_000,
  });
}

export default useTenantUsage;
