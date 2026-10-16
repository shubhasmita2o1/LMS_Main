import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { User } from './user.model';
import { AppError } from '../../middleware/errorHandler';
import {
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  SYSTEM_ROLE_PERMISSIONS,
  type SystemRole,
  type Permission,
} from '@university-lms/shared';
import mongoose from 'mongoose';

const ALLOWED_ASSIGN_ROLES = [
  'tenant_admin',
  'university_admin',
  'faculty',
  'student',
  'staff',
  'parent',
  'guest',
  'department_head',
  'exam_controller',
  'registrar',
  'finance',
  'librarian',
] as const;

function permissionsForRoles(roles: SystemRole[]): Permission[] {
  const set = new Map<string, Permission>();
  for (const role of roles) {
    for (const p of SYSTEM_ROLE_PERMISSIONS[role] || []) {
      const key = `${p.resource}:${p.action}`;
      if (!set.has(key)) {
        set.set(key, {
          resource: p.resource as Permission['resource'],
          action: p.action as Permission['action'],
        });
      }
    }
  }
  return Array.from(set.values());
}

function mapUser(u: Record<string, unknown>) {
  return {
    id: String(u._id),
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    roles: u.roles,
    tenantId: u.tenantId ? String(u.tenantId) : null,
    organizationName: u.organizationName ?? null,
    isActive: u.isActive,
    isEmailVerified: u.isEmailVerified,
    approvalStatus: u.approvalStatus ?? 'approved',
    approvedAt: u.approvedAt ?? null,
    rejectionReason: u.rejectionReason ?? null,
    lastLoginAt: u.lastLoginAt,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  search: z.string().optional(),
  approvalStatus: z.enum(['pending', 'approved', 'rejected']).optional(),
  isActive: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
});

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const query = listQuerySchema.parse(req.query);
    const filter: Record<string, unknown> = { isDeleted: false };

    if (!req.user?.roles.includes('super_admin')) {
      if (!req.user?.tenantId) {
        throw new AppError(403, 'Tenant context required', 'FORBIDDEN');
      }
      filter.tenantId = new mongoose.Types.ObjectId(req.user.tenantId);
    } else if (req.tenantId) {
      filter.tenantId = new mongoose.Types.ObjectId(req.tenantId);
    }

    if (query.approvalStatus) {
      filter.approvalStatus = query.approvalStatus;
    }
    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    if (query.search) {
      const s = query.search.trim();
      filter.$or = [
        { email: { $regex: s, $options: 'i' } },
        { firstName: { $regex: s, $options: 'i' } },
        { lastName: { $regex: s, $options: 'i' } },
        { organizationName: { $regex: s, $options: 'i' } },
      ];
    }

    const skip = (query.page - 1) * query.limit;
    const [items, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit).lean(),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: items.map((u) => mapUser(u as Record<string, unknown>)),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function listPendingUsers(req: Request, res: Response, next: NextFunction) {
  try {
    req.query = { ...req.query, approvalStatus: 'pending' };
    return listUsers(req, res, next);
  } catch (err) {
    next(err);
  }
}

export async function getUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(400, 'Invalid user id', 'VALIDATION_ERROR');
    }

    const filter: Record<string, unknown> = { _id: id, isDeleted: false };

    if (!req.user?.roles.includes('super_admin')) {
      if (!req.user?.tenantId) {
        throw new AppError(403, 'Tenant context required', 'FORBIDDEN');
      }
      filter.tenantId = new mongoose.Types.ObjectId(req.user.tenantId);
    }

    const user = await User.findOne(filter).lean();
    if (!user) {
      throw new AppError(404, 'User not found', 'NOT_FOUND');
    }

    res.status(200).json({
      success: true,
      data: {
        ...mapUser(user as Record<string, unknown>),
        permissions: user.permissions,
      },
    });
  } catch (err) {
    next(err);
  }
}

const approveSchema = z.object({
  role: z.enum(ALLOWED_ASSIGN_ROLES),
  tenantId: z.string().min(1).optional().nullable(),
  activate: z.boolean().default(true),
});

export async function approveUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(400, 'Invalid user id', 'VALIDATION_ERROR');
    }
    if (!req.user) {
      throw new AppError(401, 'Authentication required', 'UNAUTHORIZED');
    }
    if (req.user.id === id) {
      throw new AppError(403, 'You cannot approve your own account', 'FORBIDDEN');
    }

    const body = approveSchema.parse(req.body);
    if ((body.role as string) === 'super_admin') {
      throw new AppError(403, 'Cannot assign super_admin via approval', 'FORBIDDEN');
    }

    const user = await User.findOne({ _id: id, isDeleted: false });
    if (!user) {
      throw new AppError(404, 'User not found', 'NOT_FOUND');
    }

    // Tenant admins can only act within tenant; pending public users have tenantId null
    const isSuper = req.user.roles.includes('super_admin');
    if (!isSuper) {
      if (!req.user.tenantId) {
        throw new AppError(403, 'Tenant context required', 'FORBIDDEN');
      }
      // When approving into this tenant, bind tenantId from admin (ignore client for non-super)
    }

    let tenantId: mongoose.Types.ObjectId | null = null;
    if (isSuper) {
      if (body.tenantId) {
        if (!mongoose.Types.ObjectId.isValid(body.tenantId)) {
          throw new AppError(400, 'Invalid tenantId', 'VALIDATION_ERROR');
        }
        tenantId = new mongoose.Types.ObjectId(body.tenantId);
      } else {
        throw new AppError(400, 'tenantId is required when approving as Super Admin', 'VALIDATION_ERROR');
      }
    } else {
      tenantId = new mongoose.Types.ObjectId(req.user.tenantId!);
    }

    const roles = [body.role as SystemRole];
    user.roles = roles;
    user.permissions = permissionsForRoles(roles);
    user.tenantId = tenantId;
    user.approvalStatus = 'approved';
    user.approvedBy = new mongoose.Types.ObjectId(req.user.id);
    user.approvedAt = new Date();
    user.rejectionReason = null;
    user.isActive = body.activate !== false;
    await user.save();

    res.status(200).json({
      success: true,
      data: mapUser(user.toObject() as Record<string, unknown>),
      message: 'User approved',
    });
  } catch (err) {
    next(err);
  }
}

const rejectSchema = z.object({
  reason: z.string().max(500).optional(),
});

export async function rejectUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(400, 'Invalid user id', 'VALIDATION_ERROR');
    }
    if (!req.user) {
      throw new AppError(401, 'Authentication required', 'UNAUTHORIZED');
    }
    if (req.user.id === id) {
      throw new AppError(403, 'You cannot reject your own account', 'FORBIDDEN');
    }

    const body = rejectSchema.parse(req.body ?? {});
    const user = await User.findOne({ _id: id, isDeleted: false });
    if (!user) {
      throw new AppError(404, 'User not found', 'NOT_FOUND');
    }

    const isSuper = req.user.roles.includes('super_admin');
    if (!isSuper) {
      // Tenant admin can reject pending (null tenant) or same-tenant users
      if (user.tenantId && String(user.tenantId) !== req.user.tenantId) {
        throw new AppError(403, 'Insufficient permissions', 'FORBIDDEN');
      }
    }

    user.approvalStatus = 'rejected';
    user.isActive = false;
    user.rejectionReason = body.reason?.trim() || null;
    user.approvedBy = new mongoose.Types.ObjectId(req.user.id);
    user.approvedAt = new Date();
    user.refreshTokens = [];
    await user.save();

    res.status(200).json({
      success: true,
      data: mapUser(user.toObject() as Record<string, unknown>),
      message: 'User rejected',
    });
  } catch (err) {
    next(err);
  }
}

const setActiveSchema = z.object({
  isActive: z.boolean(),
});

export async function setUserActive(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(400, 'Invalid user id', 'VALIDATION_ERROR');
    }
    if (!req.user) {
      throw new AppError(401, 'Authentication required', 'UNAUTHORIZED');
    }
    if (req.user.id === id) {
      throw new AppError(403, 'You cannot change your own active status here', 'FORBIDDEN');
    }

    const body = setActiveSchema.parse(req.body);
    const user = await User.findOne({ _id: id, isDeleted: false });
    if (!user) {
      throw new AppError(404, 'User not found', 'NOT_FOUND');
    }

    if (user.roles.includes('super_admin') && !req.user.roles.includes('super_admin')) {
      throw new AppError(403, 'Cannot modify Super Admin', 'FORBIDDEN');
    }

    const isSuper = req.user.roles.includes('super_admin');
    if (!isSuper) {
      if (!user.tenantId || String(user.tenantId) !== req.user.tenantId) {
        throw new AppError(403, 'Insufficient permissions', 'FORBIDDEN');
      }
    }

    if (body.isActive && user.approvalStatus !== 'approved') {
      throw new AppError(400, 'User must be approved before activation', 'VALIDATION_ERROR');
    }

    user.isActive = body.isActive;
    if (!body.isActive) {
      user.refreshTokens = [];
    }
    await user.save();

    res.status(200).json({
      success: true,
      data: mapUser(user.toObject() as Record<string, unknown>),
      message: body.isActive ? 'User activated' : 'User deactivated',
    });
  } catch (err) {
    next(err);
  }
}
