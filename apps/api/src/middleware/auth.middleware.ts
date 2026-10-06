import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import { verifyAccessToken } from '../utils/jwt';
import { User } from '../modules/users/user.model';
import type { AuthUser, Permission, SystemRole } from '@university-lms/shared';
import { SYSTEM_ROLE_PERMISSIONS } from '@university-lms/shared';

function resolvePermissions(roles: SystemRole[], embedded: Permission[]): Permission[] {
  if (embedded && embedded.length > 0) return embedded;
  const set = new Map<string, Permission>();
  for (const role of roles) {
    const list = SYSTEM_ROLE_PERMISSIONS[role] || [];
    for (const p of list) {
      const key = `${p.resource}:${p.action}`;
      if (!set.has(key)) {
        set.set(key, { resource: p.resource as Permission['resource'], action: p.action as Permission['action'] });
      }
    }
  }
  return Array.from(set.values());
}

/**
 * Verify Bearer access token and attach req.user
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      next(new AppError(401, 'Authentication required', 'UNAUTHORIZED'));
      return;
    }

    const token = header.slice(7);
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      next(new AppError(401, 'Invalid or expired access token', 'INVALID_TOKEN'));
      return;
    }

    const user = await User.findOne({
      _id: payload.sub,
      isDeleted: false,
    }).lean();

    if (!user || !user.isActive) {
      next(new AppError(401, 'User not found or inactive', 'UNAUTHORIZED'));
      return;
    }

    // Soft lock check
    if (user.lockUntil && user.lockUntil > new Date()) {
      next(new AppError(423, 'Account temporarily locked', 'ACCOUNT_LOCKED'));
      return;
    }

    const authUser: AuthUser = {
      id: String(user._id),
      tenantId: user.tenantId ? String(user.tenantId) : null,
      email: user.email,
      roles: user.roles as SystemRole[],
      permissions: resolvePermissions(user.roles as SystemRole[], user.permissions as Permission[]),
      firstName: user.firstName,
      lastName: user.lastName,
    };

    req.user = authUser;

    // If token carries tenant and user is not super_admin, enforce match
    if (authUser.tenantId && payload.tenantId && authUser.tenantId !== payload.tenantId) {
      next(new AppError(401, 'Token tenant mismatch', 'UNAUTHORIZED'));
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
}

/** Optional auth — attaches user if token present, never fails on missing token */
export async function optionalAuthenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next();
    return;
  }
  return authenticate(req, res, next);
}
