import type { Request, Response, NextFunction } from 'express';
import type { UsageMetricKey, TenantLimits } from '@university-lms/shared';
import { AppError } from '../middleware/errorHandler';
import { Tenant, type ITenant } from '../modules/tenants/tenant.model';
import { User } from '../modules/users/user.model';
import mongoose from 'mongoose';

/**
 * Resolve effective feature flags for a tenant document
 * (plan defaults already merged into tenant.featureFlags on create/update)
 */
export function isFeatureEnabled(tenant: ITenant | null | undefined, flagKey: string): boolean {
  if (!tenant) return false;
  if (tenant.status === 'suspended' || tenant.status === 'canceled') return false;
  return Boolean(tenant.featureFlags?.[flagKey]);
}

/**
 * Middleware: require a feature flag for the current tenant.
 * Super Admin bypasses.
 */
export function requireFeature(flagKey: string) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.user?.roles.includes('super_admin')) {
        next();
        return;
      }

      const tenantId = req.tenantId || req.user?.tenantId;
      if (!tenantId) {
        next(new AppError(400, 'Tenant context required', 'TENANT_REQUIRED'));
        return;
      }

      const tenant = await Tenant.findOne({
        _id: tenantId,
        isDeleted: false,
      }).lean();

      if (!tenant) {
        next(new AppError(404, 'Tenant not found', 'NOT_FOUND'));
        return;
      }

      if (!isFeatureEnabled(tenant as unknown as ITenant, flagKey)) {
        next(
          new AppError(
            403,
            `Feature "${flagKey}" is not enabled on your plan`,
            'FEATURE_DISABLED'
          )
        );
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

/** Map usage metric keys to tenant limit fields */
const METRIC_TO_LIMIT: Partial<Record<UsageMetricKey, keyof TenantLimits>> = {
  activeStudents: 'maxStudents',
  activeFaculty: 'maxFaculty',
  courses: 'maxCourses',
  activeAdmins: 'maxAdmins',
};

/**
 * Count current usage for a metric within a tenant.
 * Skeleton: counts Users by role for student/faculty/admin metrics.
 */
export async function getMetricUsage(
  tenantId: string,
  metric: UsageMetricKey
): Promise<number> {
  const tid = new mongoose.Types.ObjectId(tenantId);

  switch (metric) {
    case 'activeStudents':
      return User.countDocuments({
        tenantId: tid,
        isDeleted: false,
        isActive: true,
        roles: 'student',
      });
    case 'activeFaculty':
      return User.countDocuments({
        tenantId: tid,
        isDeleted: false,
        isActive: true,
        roles: 'faculty',
      });
    case 'activeAdmins':
      return User.countDocuments({
        tenantId: tid,
        isDeleted: false,
        isActive: true,
        roles: { $in: ['tenant_admin', 'university_admin'] },
      });
    case 'storageBytes':
    case 'apiCalls':
    case 'courses':
      // Placeholder until storage / course modules exist
      return 0;
    default:
      return 0;
  }
}

/**
 * Check whether adding `delta` more of a metric would exceed the plan limit.
 * Returns { allowed, current, limit }.
 */
export async function checkLimit(
  tenantId: string,
  metric: UsageMetricKey,
  delta = 1
): Promise<{ allowed: boolean; current: number; limit: number; remaining: number }> {
  const tenant = await Tenant.findOne({ _id: tenantId, isDeleted: false }).lean();
  if (!tenant) {
    throw new AppError(404, 'Tenant not found', 'NOT_FOUND');
  }

  if (tenant.status === 'suspended' || tenant.status === 'canceled') {
    return { allowed: false, current: 0, limit: 0, remaining: 0 };
  }

  const limitKey = METRIC_TO_LIMIT[metric];
  const limit =
    limitKey && tenant.limits ? Number(tenant.limits[limitKey]) : Number.MAX_SAFE_INTEGER;

  // Unlimited storage flag
  if (metric === 'storageBytes' && tenant.featureFlags?.unlimited_storage) {
    return { allowed: true, current: 0, limit: Number.MAX_SAFE_INTEGER, remaining: Number.MAX_SAFE_INTEGER };
  }

  const current = await getMetricUsage(tenantId, metric);
  const remaining = Math.max(0, limit - current);
  const allowed = current + delta <= limit;

  return { allowed, current, limit, remaining };
}

/**
 * Middleware factory: enforce a plan limit before proceeding.
 * Example: requireLimit('activeStudents') on user create routes.
 */
export function requireLimit(metric: UsageMetricKey, delta = 1) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.user?.roles.includes('super_admin')) {
        next();
        return;
      }

      const tenantId = req.tenantId || req.user?.tenantId;
      if (!tenantId) {
        next(new AppError(400, 'Tenant context required', 'TENANT_REQUIRED'));
        return;
      }

      const result = await checkLimit(tenantId, metric, delta);
      if (!result.allowed) {
        next(
          new AppError(
            403,
            `Plan limit reached for ${metric} (${result.current}/${result.limit})`,
            'PLAN_LIMIT_EXCEEDED',
            result
          )
        );
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Build usage snapshot vs limits for tenant settings UI
 */
export async function getUsageSnapshot(tenantId: string) {
  const tenant = await Tenant.findOne({ _id: tenantId, isDeleted: false }).lean();
  if (!tenant) {
    throw new AppError(404, 'Tenant not found', 'NOT_FOUND');
  }

  const metrics: UsageMetricKey[] = [
    'activeStudents',
    'activeFaculty',
    'activeAdmins',
    'courses',
    'storageBytes',
  ];

  const usage = await Promise.all(
    metrics.map(async (metric) => {
      const current = await getMetricUsage(tenantId, metric);
      const limitKey = METRIC_TO_LIMIT[metric];
      let limit = limitKey && tenant.limits ? Number(tenant.limits[limitKey]) : 0;
      if (metric === 'storageBytes') {
        limit = (tenant.limits?.maxStorageGB ?? 0) * 1024 * 1024 * 1024;
      }
      return {
        metric,
        value: current,
        limit,
        percent: limit > 0 ? Math.min(100, Math.round((current / limit) * 100)) : 0,
      };
    })
  );

  return {
    tenantId,
    status: tenant.status,
    planTier: tenant.planTier,
    limits: tenant.limits,
    featureFlags: tenant.featureFlags,
    usage,
  };
}
