import { Request, Response, NextFunction } from 'express';
import * as tenantService from './tenant.service';
import {
  createTenantSchema,
  updateTenantSchema,
  updateTenantMeSchema,
  onboardTenantSchema,
  listTenantsQuerySchema,
} from './tenant.validation';
import { AppError } from '../../middleware/errorHandler';

export async function listTenants(req: Request, res: Response, next: NextFunction) {
  try {
    const query = listTenantsQuerySchema.parse(req.query);
    const result = await tenantService.listTenants(query);
    res.status(200).json({
      success: true,
      data: result.items,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function createTenant(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createTenantSchema.parse(req.body);
    const result = await tenantService.createTenant(body, req.user?.id);
    res.status(201).json({
      success: true,
      data: result.tenant,
      message: 'Tenant created',
    });
  } catch (err) {
    next(err);
  }
}

export async function getTenant(req: Request, res: Response, next: NextFunction) {
  try {
    const tenant = await tenantService.getTenantById(req.params.id);
    res.status(200).json({ success: true, data: tenant });
  } catch (err) {
    next(err);
  }
}

export async function updateTenant(req: Request, res: Response, next: NextFunction) {
  try {
    const body = updateTenantSchema.parse(req.body);
    const tenant = await tenantService.updateTenant(req.params.id, body);
    res.status(200).json({ success: true, data: tenant, message: 'Tenant updated' });
  } catch (err) {
    next(err);
  }
}

export async function suspendTenant(req: Request, res: Response, next: NextFunction) {
  try {
    const tenant = await tenantService.suspendTenant(req.params.id);
    res.status(200).json({ success: true, data: tenant, message: 'Tenant suspended' });
  } catch (err) {
    next(err);
  }
}

export async function activateTenant(req: Request, res: Response, next: NextFunction) {
  try {
    const tenant = await tenantService.activateTenant(req.params.id);
    res.status(200).json({ success: true, data: tenant, message: 'Tenant activated' });
  } catch (err) {
    next(err);
  }
}

export async function platformStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await tenantService.getPlatformStats();
    res.status(200).json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
}

export async function getMyTenant(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new AppError(400, 'No tenant associated with this account', 'TENANT_REQUIRED');
    }
    const tenant = await tenantService.getTenantById(tenantId);
    res.status(200).json({ success: true, data: tenant });
  } catch (err) {
    next(err);
  }
}

export async function updateMyTenant(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new AppError(400, 'No tenant associated with this account', 'TENANT_REQUIRED');
    }
    const body = updateTenantMeSchema.parse(req.body);
    const tenant = await tenantService.updateTenantMe(tenantId, body);
    res.status(200).json({ success: true, data: tenant, message: 'Settings updated' });
  } catch (err) {
    next(err);
  }
}

export async function getMyUsage(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new AppError(400, 'No tenant associated with this account', 'TENANT_REQUIRED');
    }
    const usage = await tenantService.getTenantUsage(tenantId);
    res.status(200).json({ success: true, data: usage });
  } catch (err) {
    next(err);
  }
}

export async function onboard(req: Request, res: Response, next: NextFunction) {
  try {
    const body = onboardTenantSchema.parse(req.body);
    const result = await tenantService.onboardTenant(body);
    res.status(201).json({
      success: true,
      data: {
        tenant: result.tenant,
        ownerId: result.ownerId,
      },
      message: 'Tenant onboarded successfully',
    });
  } catch (err) {
    next(err);
  }
}
