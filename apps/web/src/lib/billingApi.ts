import { api } from './api';
import type { ApiResponse, PlanPublic, PlanTier } from '@university-lms/shared';

export interface CreateCheckoutInput {
  planTier: PlanTier;
  successUrl: string;
  cancelUrl: string;
  provider?: 'stripe' | 'razorpay';
}

export interface CheckoutResponse {
  mode: 'immediate' | 'checkout';
  provider: string;
  checkoutUrl?: string | null;
  sessionId?: string | null;
  customerId?: string | null;
  planTier: PlanTier;
  amount?: number;
  currency?: string;
  message: string;
}

export interface PortalResponse {
  portalUrl: string;
  customerId?: string;
  provider: string;
  message: string;
}

export async function listPlans(): Promise<PlanPublic[]> {
  const res = await api.get<ApiResponse<PlanPublic[]>>('/billing/plans');
  return res.data.data || [];
}

export async function createCheckout(input: CreateCheckoutInput): Promise<CheckoutResponse> {
  const res = await api.post<ApiResponse<CheckoutResponse>>('/billing/checkout', input);
  if (!res.data.data) {
    throw new Error(res.data.message || 'Failed to initialize checkout session');
  }
  return res.data.data;
}

export async function createPortal(returnUrl: string): Promise<PortalResponse> {
  const res = await api.post<ApiResponse<PortalResponse>>('/billing/portal', { returnUrl });
  if (!res.data.data) {
    throw new Error(res.data.message || 'Failed to open billing portal');
  }
  return res.data.data;
}
