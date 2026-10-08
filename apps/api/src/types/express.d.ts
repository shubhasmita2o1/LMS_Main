import type { AuthUser } from '@university-lms/shared';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      tenantId?: string | null;
      /** Explicit tenant override by super_admin */
      tenantOverride?: string | null;
      /** Resolved from subdomain / header before ObjectId lookup */
      tenantSlug?: string;
    }
  }
}

export {};
