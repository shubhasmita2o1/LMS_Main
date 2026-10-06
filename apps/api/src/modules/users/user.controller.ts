import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { User } from './user.model';
import { AppError } from '../../middleware/errorHandler';
import { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } from '@university-lms/shared';
import mongoose from 'mongoose';

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(DEFAULT_PAGE),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
  search: z.string().optional(),
});

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const query = listQuerySchema.parse(req.query);
    const filter: Record<string, unknown> = { isDeleted: false };

    // Tenant isolation: non-super_admin only sees own tenant
    if (!req.user?.roles.includes('super_admin')) {
      if (!req.user?.tenantId) {
        throw new AppError(403, 'Tenant context required', 'FORBIDDEN');
      }
      filter.tenantId = new mongoose.Types.ObjectId(req.user.tenantId);
    } else if (req.tenantId) {
      // Super admin with tenant override
      filter.tenantId = new mongoose.Types.ObjectId(req.tenantId);
    }

    if (query.search) {
      const s = query.search.trim();
      filter.$or = [
        { email: { $regex: s, $options: 'i' } },
        { firstName: { $regex: s, $options: 'i' } },
        { lastName: { $regex: s, $options: 'i' } },
      ];
    }

    const skip = (query.page - 1) * query.limit;
    const [items, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(query.limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: items.map((u) => ({
        id: String(u._id),
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        roles: u.roles,
        tenantId: u.tenantId ? String(u.tenantId) : null,
        isActive: u.isActive,
        isEmailVerified: u.isEmailVerified,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
      })),
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
        id: String(user._id),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles,
        permissions: user.permissions,
        tenantId: user.tenantId ? String(user.tenantId) : null,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
}
