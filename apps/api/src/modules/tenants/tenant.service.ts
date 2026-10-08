import mongoose from 'mongoose';
import {
  DEFAULT_PLAN_LIMITS,
  DEFAULT_PLAN_FEATURE_FLAGS,
  DEFAULT_TRIAL_DAYS,
  SYSTEM_ROLE_PERMISSIONS,
  slugify,
} from '@university-lms/shared';
import type { PlanTier, TenantPublic } from '@university-lms/shared';
import { Tenant, type ITenant } from './tenant.model';
import { Plan } from '../plans/plan.model';
import { User } from '../users/user.model';
import { hashPassword } from '../../utils/password';
import { AppError } from '../../middleware/errorHandler';
import { getUsageSnapshot } from '../../services/featureFlags';
import type {
  CreateTenantBody,
  UpdateTenantBody,
  OnboardTenantBody,
} from './tenant.validation';

function toPublic(tenant: ITenant | Record<string, unknown>): TenantPublic {
  const t = tenant as ITenant;
  return {
    id: String(t._id),
    name: t.name,
    slug: t.slug,
    status: t.status,
    planId: t.planId,
    planTier: t.planTier,
    branding: t.branding || {},
    limits: t.limits,
    featureFlags: t.featureFlags || {},
    customDomain: t.customDomain ?? null,
    subscription: {
      provider: t.billingProvider || 'none',
      subscriptionId: t.subscriptionId ?? null,
      customerId: t.billingCustomerId ?? null,
      status: t.status,
      currentPeriodEnd: t.currentPeriodEnd ?? null,
      trialEndsAt: t.trialEndsAt ?? null,
      cancelAtPeriodEnd: t.cancelAtPeriodEnd ?? false,
    },
    trialEndsAt: t.trialEndsAt ?? null,
    currentPeriodEnd: t.currentPeriodEnd ?? null,
    ownerId: t.ownerId ? String(t.ownerId) : null,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

async function resolvePlanDefaults(planTier: PlanTier) {
  const plan = await Plan.findOne({ key: planTier, isActive: true }).lean();
  if (plan) {
    return {
      planId: plan.key,
      planTier: plan.key,
      limits: { ...plan.limits },
      featureFlags: { ...plan.featureFlags },
      trialDays: plan.trialDays ?? DEFAULT_TRIAL_DAYS,
    };
  }
  return {
    planId: planTier,
    planTier,
    limits: { ...DEFAULT_PLAN_LIMITS[planTier] },
    featureFlags: { ...DEFAULT_PLAN_FEATURE_FLAGS[planTier] },
    trialDays: planTier === 'free' ? 0 : DEFAULT_TRIAL_DAYS,
  };
}

export async function createTenant(
  input: CreateTenantBody,
  createdByUserId?: string
): Promise<{ tenant: TenantPublic; ownerId?: string }> {
  const slug = slugify(input.slug || input.name);
  const existing = await Tenant.findOne({ slug, isDeleted: false });
  if (existing) {
    throw new AppError(409, `Slug "${slug}" is already taken`, 'SLUG_TAKEN');
  }

  const defaults = await resolvePlanDefaults(input.planTier || 'free');
  const trialDays = input.trialDays ?? defaults.trialDays;
  const trialEndsAt =
    trialDays > 0 ? new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000) : null;

  const tenant = await Tenant.create({
    name: input.name,
    slug,
    status: trialDays > 0 ? 'trialing' : 'active',
    planId: defaults.planId,
    planTier: defaults.planTier,
    limits: defaults.limits,
    featureFlags: defaults.featureFlags,
    branding: {
      name: input.name,
      ...(input.branding || {}),
    },
    trialEndsAt,
    billingProvider: 'none',
    settings: {},
  });

  let ownerId: string | undefined;

  if (input.ownerEmail && input.ownerPassword && input.ownerFirstName && input.ownerLastName) {
    const email = input.ownerEmail.toLowerCase().trim();
    const existingUser = await User.findOne({
      email,
      tenantId: tenant._id,
      isDeleted: false,
    });
    if (existingUser) {
      throw new AppError(409, 'Owner email already exists in this tenant', 'EMAIL_TAKEN');
    }

    const passwordHash = await hashPassword(input.ownerPassword);
    const perms = (SYSTEM_ROLE_PERMISSIONS.tenant_admin || []).map((p) => ({
      resource: p.resource,
      action: p.action,
    }));

    const owner = await User.create({
      email,
      password: passwordHash,
      firstName: input.ownerFirstName,
      lastName: input.ownerLastName,
      roles: ['tenant_admin'],
      permissions: perms,
      tenantId: tenant._id,
      isEmailVerified: true,
      isActive: true,
    });

    tenant.ownerId = owner._id as mongoose.Types.ObjectId;
    await tenant.save();
    ownerId = String(owner._id);
  } else if (createdByUserId && mongoose.Types.ObjectId.isValid(createdByUserId)) {
    tenant.ownerId = new mongoose.Types.ObjectId(createdByUserId);
    await tenant.save();
    ownerId = createdByUserId;
  }

  // Billing customer placeholder — real Stripe/Razorpay create happens in billing service when keys exist
  // tenant.billingCustomerId remains null until first checkout

  return { tenant: toPublic(tenant), ownerId };
}

export async function onboardTenant(input: OnboardTenantBody): Promise<{
  tenant: TenantPublic;
  ownerId: string;
}> {
  const result = await createTenant({
    name: input.name,
    slug: input.slug,
    planTier: input.planTier || 'free',
    ownerEmail: input.owner.email,
    ownerPassword: input.owner.password,
    ownerFirstName: input.owner.firstName,
    ownerLastName: input.owner.lastName,
    branding: input.branding,
  });

  if (!result.ownerId) {
    throw new AppError(500, 'Failed to create tenant owner', 'INTERNAL_ERROR');
  }

  return { tenant: result.tenant, ownerId: result.ownerId };
}

export async function listTenants(params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  planTier?: string;
}) {
  const filter: Record<string, unknown> = { isDeleted: false };

  if (params.status) filter.status = params.status;
  if (params.planTier) filter.planTier = params.planTier;

  if (params.search) {
    const s = params.search.trim();
    filter.$or = [
      { name: { $regex: s, $options: 'i' } },
      { slug: { $regex: s, $options: 'i' } },
      { customDomain: { $regex: s, $options: 'i' } },
    ];
  }

  const skip = (params.page - 1) * params.limit;
  const [items, total] = await Promise.all([
    Tenant.find(filter).sort({ createdAt: -1 }).skip(skip).limit(params.limit),
    Tenant.countDocuments(filter),
  ]);

  return {
    items: items.map((t) => toPublic(t)),
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.ceil(total / params.limit) || 1,
  };
}

export async function getTenantById(id: string): Promise<TenantPublic> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, 'Invalid tenant id', 'VALIDATION_ERROR');
  }
  const tenant = await Tenant.findOne({ _id: id, isDeleted: false });
  if (!tenant) {
    throw new AppError(404, 'Tenant not found', 'NOT_FOUND');
  }
  return toPublic(tenant);
}

export async function getTenantBySlug(slug: string): Promise<ITenant | null> {
  return Tenant.findOne({ slug: slug.toLowerCase(), isDeleted: false });
}

export async function getTenantByCustomDomain(domain: string): Promise<ITenant | null> {
  return Tenant.findOne({
    customDomain: domain.toLowerCase(),
    isDeleted: false,
  });
}

export async function updateTenant(id: string, input: UpdateTenantBody): Promise<TenantPublic> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, 'Invalid tenant id', 'VALIDATION_ERROR');
  }

  const tenant = await Tenant.findOne({ _id: id, isDeleted: false });
  if (!tenant) {
    throw new AppError(404, 'Tenant not found', 'NOT_FOUND');
  }

  if (input.name !== undefined) tenant.name = input.name;
  if (input.status !== undefined) tenant.status = input.status;
  if (input.customDomain !== undefined) {
    if (input.customDomain) {
      const clash = await Tenant.findOne({
        customDomain: input.customDomain.toLowerCase(),
        _id: { $ne: tenant._id },
        isDeleted: false,
      });
      if (clash) {
        throw new AppError(409, 'Custom domain already in use', 'DOMAIN_TAKEN');
      }
      tenant.customDomain = input.customDomain.toLowerCase();
    } else {
      tenant.customDomain = null;
    }
  }

  if (input.planTier !== undefined && input.planTier !== tenant.planTier) {
    const defaults = await resolvePlanDefaults(input.planTier);
    tenant.planId = defaults.planId;
    tenant.planTier = defaults.planTier;
    // Merge limits / flags — admin can still override after
    tenant.limits = defaults.limits as typeof tenant.limits;
    tenant.featureFlags = {
      ...defaults.featureFlags,
      ...(input.featureFlags || {}),
    };
  }

  if (input.limits) {
    tenant.limits = { ...tenant.limits, ...input.limits } as typeof tenant.limits;
  }
  if (input.featureFlags) {
    tenant.featureFlags = { ...tenant.featureFlags, ...input.featureFlags };
  }
  if (input.branding) {
    tenant.branding = { ...tenant.branding, ...input.branding };
  }
  if (input.settings) {
    tenant.settings = { ...tenant.settings, ...input.settings };
  }
  if (input.trialEndsAt !== undefined) {
    tenant.trialEndsAt = input.trialEndsAt;
  }

  await tenant.save();
  return toPublic(tenant);
}

export async function suspendTenant(id: string): Promise<TenantPublic> {
  return updateTenant(id, { status: 'suspended' });
}

export async function activateTenant(id: string): Promise<TenantPublic> {
  const tenant = await Tenant.findOne({ _id: id, isDeleted: false });
  if (!tenant) {
    throw new AppError(404, 'Tenant not found', 'NOT_FOUND');
  }
  const nextStatus =
    tenant.trialEndsAt && tenant.trialEndsAt > new Date() ? 'trialing' : 'active';
  return updateTenant(id, { status: nextStatus });
}

export async function updateTenantMe(
  tenantId: string,
  input: {
    name?: string;
    branding?: UpdateTenantBody['branding'];
    settings?: Record<string, unknown>;
    customDomain?: string | null;
  }
): Promise<TenantPublic> {
  // Tenant admins cannot change status / plan / limits via this path
  return updateTenant(tenantId, {
    name: input.name,
    branding: input.branding,
    settings: input.settings,
    customDomain: input.customDomain,
  });
}

export async function getTenantUsage(tenantId: string) {
  return getUsageSnapshot(tenantId);
}

export async function getPlatformStats() {
  const [
    totalTenants,
    activeTenants,
    trialingTenants,
    suspendedTenants,
    totalUsers,
  ] = await Promise.all([
    Tenant.countDocuments({ isDeleted: false }),
    Tenant.countDocuments({ isDeleted: false, status: 'active' }),
    Tenant.countDocuments({ isDeleted: false, status: 'trialing' }),
    Tenant.countDocuments({ isDeleted: false, status: 'suspended' }),
    User.countDocuments({ isDeleted: false }),
  ]);

  // Revenue skeleton — real MRR comes from Stripe later
  const paidTenants = await Tenant.find({
    isDeleted: false,
    status: { $in: ['active', 'past_due'] },
    planTier: { $ne: 'free' },
  })
    .select('planTier')
    .lean();

  const priceMap: Record<string, number> = {
    starter: 99,
    professional: 299,
    enterprise: 999,
  };
  const mrrEstimate = paidTenants.reduce(
    (sum, t) => sum + (priceMap[t.planTier] || 0),
    0
  );

  return {
    totalTenants,
    activeTenants,
    trialingTenants,
    suspendedTenants,
    totalUsers,
    revenueSkeleton: {
      currency: 'USD',
      mrrEstimate,
      note: 'Estimated from plan tiers; replace with Stripe/Razorpay reporting in production',
    },
  };
}

export { toPublic };
