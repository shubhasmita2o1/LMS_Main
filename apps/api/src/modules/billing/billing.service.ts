import crypto from 'crypto';
import { Tenant } from '../tenants/tenant.model';
import { WebhookEvent } from './webhookEvent.model';
import { Plan } from '../plans/plan.model';
import { AppError } from '../../middleware/errorHandler';
import { env } from '../../config/env';
import type { PlanTier, TenantStatus } from '@university-lms/shared';
import {
  DEFAULT_PLAN_LIMITS,
  DEFAULT_PLAN_FEATURE_FLAGS,
} from '@university-lms/shared';

/**
 * Billing foundation — Stripe + Razorpay skeleton.
 * Real SDK calls are gated on env keys so local/dev works without secrets.
 */

function stripeConfigured(): boolean {
  return Boolean(env.STRIPE_SECRET_KEY);
}

function razorpayConfigured(): boolean {
  return Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
}

/** Ensure a billing customer id exists on the tenant (placeholder id in dev) */
export async function ensureBillingCustomer(tenantId: string): Promise<string> {
  const tenant = await Tenant.findOne({ _id: tenantId, isDeleted: false });
  if (!tenant) {
    throw new AppError(404, 'Tenant not found', 'NOT_FOUND');
  }

  if (tenant.billingCustomerId) {
    return tenant.billingCustomerId;
  }

  // Production: call Stripe customers.create or Razorpay customers.create
  const customerId = stripeConfigured()
    ? `cus_pending_${tenant.slug}`
    : razorpayConfigured()
      ? `rzp_cust_${tenant.slug}`
      : `dev_cust_${tenant._id}`;

  tenant.billingCustomerId = customerId;
  tenant.billingProvider = stripeConfigured()
    ? 'stripe'
    : razorpayConfigured()
      ? 'razorpay'
      : 'none';
  await tenant.save();
  return customerId;
}

export async function createCheckoutSession(params: {
  tenantId: string;
  planTier: PlanTier;
  successUrl: string;
  cancelUrl: string;
  provider?: 'stripe' | 'razorpay';
}) {
  const tenant = await Tenant.findOne({ _id: params.tenantId, isDeleted: false });
  if (!tenant) {
    throw new AppError(404, 'Tenant not found', 'NOT_FOUND');
  }

  const plan = await Plan.findOne({ key: params.planTier, isActive: true });
  if (!plan) {
    throw new AppError(404, 'Plan not found', 'NOT_FOUND');
  }

  const customerId = await ensureBillingCustomer(params.tenantId);
  const provider =
    params.provider ||
    (stripeConfigured() ? 'stripe' : razorpayConfigured() ? 'razorpay' : 'none');

  if (provider === 'none' || plan.price === 0) {
    // Free plan or no provider: apply immediately
    tenant.planId = plan.key;
    tenant.planTier = plan.key;
    tenant.limits = plan.limits as typeof tenant.limits;
    tenant.featureFlags = { ...plan.featureFlags };
    tenant.status = 'active';
    tenant.billingProvider = provider;
    await tenant.save();

    return {
      mode: 'immediate' as const,
      provider,
      checkoutUrl: null,
      sessionId: null,
      message: plan.price === 0 ? 'Free plan applied' : 'Billing provider not configured; plan applied locally',
      tenantId: String(tenant._id),
      planTier: plan.key,
    };
  }

  // Skeleton session — wire real Stripe Checkout / Razorpay Subscription when keys present
  const sessionId = `cs_test_${crypto.randomBytes(12).toString('hex')}`;
  const checkoutUrl = `${params.successUrl}${params.successUrl.includes('?') ? '&' : '?'}session_id=${sessionId}&plan=${plan.key}`;

  return {
    mode: 'checkout' as const,
    provider,
    checkoutUrl,
    sessionId,
    customerId,
    planTier: plan.key,
    amount: plan.price,
    currency: plan.currency,
    message: 'Checkout session created (skeleton — configure STRIPE_SECRET_KEY for live sessions)',
  };
}

export async function createCustomerPortalLink(params: {
  tenantId: string;
  returnUrl: string;
}) {
  const tenant = await Tenant.findOne({ _id: params.tenantId, isDeleted: false });
  if (!tenant) {
    throw new AppError(404, 'Tenant not found', 'NOT_FOUND');
  }

  const customerId = await ensureBillingCustomer(params.tenantId);

  if (!stripeConfigured()) {
    return {
      url: params.returnUrl,
      message: 'Stripe not configured — returning returnUrl as placeholder',
      customerId,
    };
  }

  // Production: stripe.billingPortal.sessions.create({ customer, return_url })
  return {
    url: `${params.returnUrl}${params.returnUrl.includes('?') ? '&' : '?'}portal=1&customer=${customerId}`,
    customerId,
    message: 'Portal link generated (skeleton)',
  };
}

/**
 * Idempotent webhook ingest.
 * Returns whether this event was newly accepted for processing.
 */
export async function recordWebhookEvent(params: {
  provider: 'stripe' | 'razorpay';
  eventId: string;
  type: string;
  payload: Record<string, unknown>;
}): Promise<{ isNew: boolean; event: typeof WebhookEvent.prototype }> {
  const existing = await WebhookEvent.findOne({
    provider: params.provider,
    eventId: params.eventId,
  });

  if (existing) {
    return { isNew: false, event: existing };
  }

  const event = await WebhookEvent.create({
    provider: params.provider,
    eventId: params.eventId,
    type: params.type,
    payload: params.payload,
    status: 'received',
  });

  return { isNew: true, event };
}

async function applySubscriptionUpdate(params: {
  customerId?: string | null;
  subscriptionId?: string | null;
  status: TenantStatus;
  planTier?: PlanTier;
  currentPeriodEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
}) {
  if (!params.customerId && !params.subscriptionId) return;

  const filter: Record<string, unknown> = { isDeleted: false };
  if (params.customerId) filter.billingCustomerId = params.customerId;
  else if (params.subscriptionId) filter.subscriptionId = params.subscriptionId;

  const tenant = await Tenant.findOne(filter);
  if (!tenant) return;

  tenant.status = params.status;
  if (params.subscriptionId) tenant.subscriptionId = params.subscriptionId;
  if (params.currentPeriodEnd !== undefined) tenant.currentPeriodEnd = params.currentPeriodEnd;
  if (params.cancelAtPeriodEnd !== undefined) {
    tenant.cancelAtPeriodEnd = params.cancelAtPeriodEnd;
  }

  if (params.planTier) {
    const plan = await Plan.findOne({ key: params.planTier });
    tenant.planId = params.planTier;
    tenant.planTier = params.planTier;
    if (plan) {
      tenant.limits = plan.limits as typeof tenant.limits;
      tenant.featureFlags = { ...plan.featureFlags };
    } else {
      tenant.limits = { ...DEFAULT_PLAN_LIMITS[params.planTier] } as typeof tenant.limits;
      tenant.featureFlags = { ...DEFAULT_PLAN_FEATURE_FLAGS[params.planTier] };
    }
  }

  await tenant.save();
}

export async function processStripeEvent(
  type: string,
  payload: Record<string, unknown>
): Promise<void> {
  const data = (payload.data as { object?: Record<string, unknown> })?.object || payload;

  switch (type) {
    case 'checkout.session.completed': {
      const customerId = String(data.customer || '');
      const subscriptionId = data.subscription ? String(data.subscription) : null;
      const metadata = (data.metadata || {}) as Record<string, string>;
      await applySubscriptionUpdate({
        customerId,
        subscriptionId,
        status: 'active',
        planTier: (metadata.planTier as PlanTier) || undefined,
      });
      break;
    }
    case 'invoice.paid': {
      const customerId = String(data.customer || '');
      await applySubscriptionUpdate({
        customerId,
        status: 'active',
      });
      break;
    }
    case 'customer.subscription.updated': {
      const customerId = String(data.customer || '');
      const subscriptionId = String(data.id || '');
      const statusMap: Record<string, TenantStatus> = {
        active: 'active',
        trialing: 'trialing',
        past_due: 'past_due',
        canceled: 'canceled',
        unpaid: 'past_due',
      };
      const rawStatus = String(data.status || 'active');
      const periodEnd = data.current_period_end
        ? new Date(Number(data.current_period_end) * 1000)
        : null;
      await applySubscriptionUpdate({
        customerId,
        subscriptionId,
        status: statusMap[rawStatus] || 'active',
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: Boolean(data.cancel_at_period_end),
      });
      break;
    }
    case 'customer.subscription.deleted': {
      const customerId = String(data.customer || '');
      const subscriptionId = String(data.id || '');
      await applySubscriptionUpdate({
        customerId,
        subscriptionId,
        status: 'canceled',
        planTier: 'free',
      });
      break;
    }
    default:
      // Ignore unhandled types
      break;
  }
}

export async function processRazorpayEvent(
  type: string,
  payload: Record<string, unknown>
): Promise<void> {
  const entity =
    (payload.payload as { subscription?: { entity?: Record<string, unknown> } })?.subscription
      ?.entity ||
    (payload.payload as { payment?: { entity?: Record<string, unknown> } })?.payment?.entity ||
    payload;

  switch (type) {
    case 'subscription.activated':
    case 'subscription.charged': {
      const subscriptionId = String(entity.id || entity.subscription_id || '');
      await applySubscriptionUpdate({
        subscriptionId,
        status: 'active',
      });
      break;
    }
    case 'subscription.pending': {
      const subscriptionId = String(entity.id || '');
      await applySubscriptionUpdate({
        subscriptionId,
        status: 'past_due',
      });
      break;
    }
    case 'subscription.cancelled':
    case 'subscription.completed': {
      const subscriptionId = String(entity.id || '');
      await applySubscriptionUpdate({
        subscriptionId,
        status: 'canceled',
        planTier: 'free',
      });
      break;
    }
    default:
      break;
  }
}

/**
 * Verify Stripe signature (skeleton — uses webhook secret when present)
 */
export function verifyStripeSignature(
  rawBody: string | Buffer,
  signature: string | undefined
): boolean {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    // Dev mode: accept without verification
    return true;
  }
  if (!signature) return false;
  // Production: use stripe.webhooks.constructEvent
  // Here we only check presence of secret + signature header
  return signature.length > 0 && rawBody.length > 0;
}

export function verifyRazorpaySignature(
  body: Record<string, unknown>,
  signature: string | undefined
): boolean {
  if (!env.RAZORPAY_WEBHOOK_SECRET && !env.RAZORPAY_KEY_SECRET) {
    return true;
  }
  if (!signature) return false;
  // Production: HMAC SHA256 of body with webhook secret
  const secret = env.RAZORPAY_WEBHOOK_SECRET || env.RAZORPAY_KEY_SECRET || '';
  const expected = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(body))
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
