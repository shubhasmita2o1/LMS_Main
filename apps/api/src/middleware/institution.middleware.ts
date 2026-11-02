/**
 * Single-institution context middleware.
 *
 * Replaces multi-tenant resolution (headers / subdomains / custom domains).
 * Loads the one Institution document and attaches:
 *   req.tenantId      = institution.tenantId (fixed value, same as institution._id)
 *   req.institutionId = institution._id
 *   req.institution   = lean institution object (optional, for convenience)
 *
 * Existing modules that already filter by req.tenantId continue to work
 * without change during the migration.
 */
import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import {
  getInstitutionWithOptionalPin,
  isInstallationLocked,
} from '../modules/institution/institution.service';
import { env } from '../config/env';

// Extend Express Request (also declared in tenant middleware; keep compatible)
declare global {
  namespace Express {
    interface Request {
      tenantId?: string | null;
      institutionId?: string | null;
      institution?: {
        id: string;
        name: string;
        type: string;
        tenantId: string;
        hierarchyConfig?: Record<string, boolean>;
        featureToggles?: Record<string, boolean>;
      };
      tenantSlug?: string;
      tenantOverride?: string | null;
    }
  }
}

/**
 * Loads the single Institution and injects tenantId / institutionId.
 * Skips enforcement for public health and setup routes (caller decides).
 */
export async function resolveInstitution(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Allow setup routes and health to proceed without an institution yet
    const path = req.path || req.originalUrl || '';
    if (
      path.startsWith('/api/v1/setup') ||
      path.startsWith('/health') ||
      path === '/api/v1'
    ) {
      next();
      return;
    }

    const locked = await isInstallationLocked();
    if (!locked) {
      // Installation not finished — only setup endpoints should be used
      next(
        new AppError(
          503,
          'Installation not completed. Run the first-run setup wizard.',
          'INSTALLATION_REQUIRED'
        )
      );
      return;
    }

    const envId =
      typeof process.env.INSTITUTION_ID === 'string'
        ? process.env.INSTITUTION_ID.trim() || null
        : null;

    const institution = await getInstitutionWithOptionalPin(envId);

    const id = String(institution._id);
    const tenantId = String(institution.tenantId);

    req.institutionId = id;
    req.tenantId = tenantId;
    req.institution = {
      id,
      name: institution.name,
      type: institution.type,
      tenantId,
      hierarchyConfig: institution.hierarchyConfig as unknown as Record<string, boolean>,
      featureToggles: institution.featureToggles as unknown as Record<string, boolean>,
    };

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Requires that institution context has been resolved.
 */
export function requireInstitution(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (!req.tenantId && !req.institutionId) {
    next(new AppError(400, 'Institution context required', 'INSTITUTION_REQUIRED'));
    return;
  }
  next();
}
