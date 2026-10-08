import { api } from './api';
import type {
  ApiResponse,
  PlatformStats,
  TenantPublic,
  TenantStatus,
  PlanTier,
  TenantBranding,
  TenantLimits,
  TenantFeatureFlags,
} from '@university-lms/shared';

export interface ListTenantsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: TenantStatus;
  planTier?: PlanTier;
}

export interface ListTenantsResponse {
  items: TenantPublic[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateTenantInput {
  name: string;
  slug: string;
  planTier?: PlanTier;
  trialDays?: number;
  ownerEmail?: string;
  ownerFirstName?: string;
  ownerLastName?: string;
  ownerPassword?: string;
  branding?: TenantBranding;
}

export interface UpdateTenantInput {
  name?: string;
  status?: TenantStatus;
  planTier?: PlanTier;
  branding?: TenantBranding;
  limits?: Partial<TenantLimits>;
  featureFlags?: TenantFeatureFlags;
  customDomain?: string | null;
  settings?: Record<string, unknown>;
  trialEndsAt?: Date | string | null;
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const res = await api.get<ApiResponse<PlatformStats>>('/admin/stats');
  if (!res.data.data) {
    throw new Error(res.data.message || 'Failed to fetch platform statistics');
  }
  return res.data.data;
}

export async function listTenants(params: ListTenantsParams = {}): Promise<ListTenantsResponse> {
  const res = await api.get<ApiResponse<TenantPublic[]>>('/admin/tenants', { params });
  return {
    items: res.data.data || [],
    total: res.data.meta?.total || 0,
    page: res.data.meta?.page || 1,
    limit: res.data.meta?.limit || 20,
    totalPages: res.data.meta?.totalPages || 1,
  };
}

export async function getTenantById(id: string): Promise<TenantPublic> {
  const res = await api.get<ApiResponse<TenantPublic>>(`/admin/tenants/${id}`);
  if (!res.data.data) {
    throw new Error(res.data.message || 'Tenant not found');
  }
  return res.data.data;
}

export async function createTenant(input: CreateTenantInput): Promise<TenantPublic> {
  const res = await api.post<ApiResponse<TenantPublic>>('/admin/tenants', input);
  if (!res.data.data) {
    throw new Error(res.data.message || 'Failed to create tenant');
  }
  return res.data.data;
}

export async function updateTenant(id: string, input: UpdateTenantInput): Promise<TenantPublic> {
  const res = await api.patch<ApiResponse<TenantPublic>>(`/admin/tenants/${id}`, input);
  if (!res.data.data) {
    throw new Error(res.data.message || 'Failed to update tenant');
  }
  return res.data.data;
}

export async function suspendTenant(id: string): Promise<TenantPublic> {
  const res = await api.post<ApiResponse<TenantPublic>>(`/admin/tenants/${id}/suspend`);
  if (!res.data.data) {
    throw new Error(res.data.message || 'Failed to suspend tenant');
  }
  return res.data.data;
}

export async function activateTenant(id: string): Promise<TenantPublic> {
  const res = await api.post<ApiResponse<TenantPublic>>(`/admin/tenants/${id}/activate`);
  if (!res.data.data) {
    throw new Error(res.data.message || 'Failed to activate tenant');
  }
  return res.data.data;
}
