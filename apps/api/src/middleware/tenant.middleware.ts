import { Request, Response, NextFunction } from 'express';
import { TENANT_HEADER, TENANT_SUBDOMAIN_HEADER } from '@university-lms/shared';
import { isValidObjectId } from '@university-lms/shared';
import { AppError } from './errorHandler';

/**
 * Resolve tenant from:
 * 1. x-tenant-id header
 * 2. x-tenant-subdomain header (placeholder — Phase 3 will resolve subdomain → tenantId)
 * 3. Host subdomain (e.g. uni.localhost → "uni")
 * Super Admin may operate with tenantId = null or set override via header.
 */
export function resolveTenant(req: Request, _res: Response, next: NextFunction): void {
  try {
    const headerTenant = req.headers[TENANT_HEADER] as string | undefined;
    const subdomainHeader = req.headers[TENANT_SUBDOMAIN_HEADER] as string | undefined;

    let resolved: string | null = null;

    if (headerTenant && isValidObjectId(headerTenant)) {
      resolved = headerTenant;
    } else if (subdomainHeader) {
      // Phase 3: look up tenant by subdomain slug
      // For now store slug as marker; actual ObjectId resolution comes with Tenant model
      resolved = null;
      (req as Request & { tenantSlug?: string }).tenantSlug = subdomainHeader;
    } else {
      // Try host: sub.domain.com
      const host = (req.headers.host || '').split(':')[0];
      const parts = host.split('.');
      if (parts.length >= 3 && parts[0] !== 'www' && parts[0] !== 'api') {
        (req as Request & { tenantSlug?: string }).tenantSlug = parts[0];
      }
    }

    // Super admin can override / work without tenant
    if (req.user?.roles?.includes('super_admin')) {
      req.tenantId = resolved; // may be null
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
