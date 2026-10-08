import { Request, Response, NextFunction } from 'express';
import { TENANT_HEADER, TENANT_SUBDOMAIN_HEADER } from '@university-lms/shared';
import { isValidObjectId } from '@university-lms/shared';
import { AppError } from './errorHandler';
import { Tenant } from '../modules/tenants/tenant.model';

/**
 * Resolve tenant from:
 * 1. x-tenant-id header (ObjectId)
 * 2. x-tenant-subdomain header → slug lookup
 * 3. Host subdomain (e.g. acme.localhost → "acme")
 * 4. Custom domain host match
 * Super Admin may operate with tenantId = null or set override via header.
 */
export async function resolveTenant(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const headerTenant = req.headers[TENANT_HEADER] as string | undefined;
    const subdomainHeader = req.headers[TENANT_SUBDOMAIN_HEADER] as string | undefined;

    let resolved: string | null = null;
    let resolvedSlug: string | undefined;

    if (headerTenant && isValidObjectId(headerTenant)) {
      resolved = headerTenant;
    } else if (subdomainHeader) {
      resolvedSlug = subdomainHeader.toLowerCase();
    } else {
      const host = (req.headers.host || '').split(':')[0].toLowerCase();
      const parts = host.split('.');

      // Custom domain exact match (skip localhost / IP)
      if (host && !host.includes('localhost') && !/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
        const byDomain = await Tenant.findOne({
          customDomain: host,
          isDeleted: false,
        })
          .select('_id status')
          .lean();

        if (byDomain) {
          if (byDomain.status === 'suspended' || byDomain.status === 'canceled') {
            next(new AppError(403, 'Tenant is suspended or canceled', 'TENANT_INACTIVE'));
            return;
          }
          resolved = String(byDomain._id);
        }
      }

      // Subdomain strategy: tenant.platform.com
      if (!resolved && parts.length >= 3 && parts[0] !== 'www' && parts[0] !== 'api') {
        resolvedSlug = parts[0];
      }
    }

    if (!resolved && resolvedSlug) {
      const bySlug = await Tenant.findOne({
        slug: resolvedSlug,
        isDeleted: false,
      })
        .select('_id status')
        .lean();

      if (bySlug) {
        if (bySlug.status === 'suspended' || bySlug.status === 'canceled') {
          next(new AppError(403, 'Tenant is suspended or canceled', 'TENANT_INACTIVE'));
          return;
        }
        resolved = String(bySlug._id);
      }
      (req as Request & { tenantSlug?: string }).tenantSlug = resolvedSlug;
    }

    // Super admin can override / work without tenant
    if (req.user?.roles?.includes('super_admin')) {
      req.tenantId = resolved;
      req.tenantOverride = resolved;
      next();
      return;
    }

    // Authenticated tenant user: prefer their own tenantId; header must match if provided
    if (req.user?.tenantId) {
      if (resolved && resolved !== req.user.tenantId) {
        next(new AppError(403, 'Tenant mismatch', 'TENANT_MISMATCH'));
        return;
      }
      req.tenantId = req.user.tenantId;
      next();
      return;
    }

    // Unauthenticated or guest: use resolved header if any
    req.tenantId = resolved;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Require a tenant context (blocks super_admin cross-tenant unless override set)
 */
export function requireTenant(req: Request, _res: Response, next: NextFunction): void {
  if (!req.tenantId && !req.user?.roles?.includes('super_admin')) {
    next(new AppError(400, 'Tenant context required', 'TENANT_REQUIRED'));
    return;
  }
  next();
}
