/**
 * Single-institution context middleware.
 *
 * Migration behaviour (Phase 01 follow-up):
 * - If installation is NOT locked → pass through (legacy multi-tenant path still works).
 * - If installation IS locked → load the single Institution and set:
 *     req.tenantId      = institution.tenantId  (fixed value, equals institution._id)
 *     req.institutionId = institution._id
 *     req.institution   = lean summary
 * - Setup, health, and root API paths always skip enforcement.
 *
 * Existing modules that filter by req.tenantId continue to work once locked.
 * Old tenant.middleware.ts is intentionally kept until SaaS removal phase.
 */
import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import {
  getInstitutionWithOptionalPin,
  isInstallationLocked,
} from '../modules/institution/institution.service';

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

function isExemptPath(path: string): boolean {
  return (
    path.startsWith('/api/v1/setup') ||
    path.startsWith('/health') ||
    path === '/api/v1' ||
    path.startsWith('/api/v1/institution/installation-status') ||
    path.startsWith('/api/v1/public/')
  );
}

/**
 * Soft institution resolver.
 * Does not break legacy multi-tenant operation while installation is unlocked.
 */
export async function resolveInstitution(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const path = req.path || req.originalUrl || '';
    if (isExemptPath(path)) {
      next();
      return;
    }

    const locked = await isInstallationLocked();

    // Transition: installation not completed → do not force institution context
    if (!locked) {
      next();
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
 * Requires that institution context has been resolved (installation locked path).
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
