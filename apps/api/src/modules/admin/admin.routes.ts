import { Router } from 'express';
import * as tenantCtrl from '../tenants/tenant.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRoles } from '../../middleware/rbac.middleware';

/**
 * Super-Admin control plane
 * All routes require super_admin role
 */
export const adminRouter = Router();

adminRouter.use(authenticate, requireRoles('super_admin'));

adminRouter.get('/tenants', tenantCtrl.listTenants);
adminRouter.post('/tenants', tenantCtrl.createTenant);
adminRouter.get('/tenants/:id', tenantCtrl.getTenant);
adminRouter.patch('/tenants/:id', tenantCtrl.updateTenant);
adminRouter.post('/tenants/:id/suspend', tenantCtrl.suspendTenant);
adminRouter.post('/tenants/:id/activate', tenantCtrl.activateTenant);
adminRouter.get('/stats', tenantCtrl.platformStats);
