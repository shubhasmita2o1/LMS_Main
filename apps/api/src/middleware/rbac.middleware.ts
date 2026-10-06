import { Request, Response, NextFunction } from 'express';
import type { PermissionAction, ResourceType } from '@university-lms/shared';
import { AppError } from './errorHandler';

/**
 * Check whether user has permission for resource + action.
 * 'manage' implies all actions on that resource.
 * Super Admin always passes.
 */
export function hasPermission(
  user: { roles: string[]; permissions: { resource: string; action: string }[] },
  resource: ResourceType,
  action: PermissionAction
): boolean {
  if (user.roles.includes('super_admin')) return true;

  return user.permissions.some(
    (p) =>
      p.resource === resource &&
      (p.action === action || p.action === 'manage')
  );
}

export function requirePermission(resource: ResourceType, action: PermissionAction) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError(401, 'Authentication required', 'UNAUTHORIZED'));
      return;
    }

    if (!hasPermission(req.user, resource, action)) {
      next(new AppError(403, 'Insufficient permissions', 'FORBIDDEN'));
      return;
    }

    next();
  };
}

export function requireRoles(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError(401, 'Authentication required', 'UNAUTHORIZED'));
      return;
    }

    const ok = roles.some((r) => req.user!.roles.includes(r as never));
    if (!ok) {
      next(new AppError(403, 'Insufficient role', 'FORBIDDEN'));
      return;
    }

    next();
  };
}
