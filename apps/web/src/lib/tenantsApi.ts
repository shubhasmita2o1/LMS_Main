import { api } from './api';
import type {
  ApiResponse,
  TenantPublic,
  TenantBranding,
  TenantStatus,
  PlanTier,
  TenantLimits,
  TenantFeatureFlags,
  UsageMetricKey,
} from '@university-lms/shared';

export interface TenantUsageItem {
  metric: UsageMetricKey;
  value: number;
  limit: number;
  percent: number;
}

export interface TenantUsageResponse {
  tenantId: string;
  status: TenantStatus;
  planTier: PlanTier;
  limits: TenantLimits;
  featureFlags: TenantFeatureFlags;
  usage: TenantUsageItem[];
}

export interface UpdateTenantMeInput {
  name?: string;
  branding?: TenantBranding;
  customDomain?: string | null;
  settings?: Record<string, unknown>;
}

export async function getMyTenant(): Promise<TenantPublic> {
  const res = await api.get<ApiResponse<TenantPublic>>('/tenants/me');
  if (!res.data.data) {
    throw new Error(res.data.message || 'Failed to fetch tenant profile');
  }
  return res.data.data;
}

export async function updateMyTenant(input: UpdateTenantMeInput): Promise<TenantPublic> {
  const res = await api.patch<ApiResponse<TenantPublic>>('/tenants/me', input);
  if (!res.data.data) {
    throw new Error(res.data.message || 'Failed to update tenant settings');
  }
  return res.data.data;
}

export async function getMyUsage(): Promise<TenantUsageResponse> {
  const res = await api.get<ApiResponse<TenantUsageResponse>>('/tenants/me/usage');
  if (!res.data.data) {
    throw new Error(res.data.message || 'Failed to fetch tenant usage');
  }
  return res.data.data;
}
