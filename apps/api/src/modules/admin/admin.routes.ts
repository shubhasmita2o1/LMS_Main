import { Router } from 'express';
import * as tenantCtrl from '../tenants/tenant.controller';
import * as adminCtrl from './admin.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { resolveTenant } from '../../middleware/tenant.middleware';
import { requireRoles } from '../../middleware/rbac.middleware';

export const adminRouter = Router();

adminRouter.use(authenticate, resolveTenant);

// Overview stats accessible to super_admin, tenant_admin, university_admin, department_head
adminRouter.get(
  '/stats/overview',
  requireRoles('super_admin', 'tenant_admin', 'university_admin', 'department_head'),
  adminCtrl.overviewStats
);

/**
 * Super-Admin control plane
 * All remaining routes require super_admin role
 */
adminRouter.use(requireRoles('super_admin'));

adminRouter.get('/tenants', tenantCtrl.listTenants);
adminRouter.post('/tenants', tenantCtrl.createTenant);
adminRouter.get('/tenants/:id', tenantCtrl.getTenant);
adminRouter.patch('/tenants/:id', tenantCtrl.updateTenant);
adminRouter.post('/tenants/:id/suspend', tenantCtrl.suspendTenant);
adminRouter.post('/tenants/:id/activate', tenantCtrl.activateTenant);
adminRouter.get('/stats', tenantCtrl.platformStats);

