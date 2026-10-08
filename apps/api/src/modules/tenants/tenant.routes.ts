import { Router } from 'express';
import * as ctrl from './tenant.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { resolveTenant } from '../../middleware/tenant.middleware';
import { requireRoles, requirePermission } from '../../middleware/rbac.middleware';
import { authRateLimit } from '../../middleware/rateLimit';

export const tenantRouter = Router();

/** Public / lightly protected onboarding (rate-limited) */
tenantRouter.post('/onboard', authRateLimit, ctrl.onboard);

/** Authenticated tenant-scoped routes */
tenantRouter.use(authenticate, resolveTenant);

tenantRouter.get(
  '/me',
  requireRoles('tenant_admin', 'university_admin', 'super_admin'),
  ctrl.getMyTenant
);

tenantRouter.patch(
  '/me',
  requirePermission('tenant', 'update'),
  ctrl.updateMyTenant
);

tenantRouter.get(
  '/me/usage',
  requireRoles('tenant_admin', 'university_admin', 'super_admin'),
  ctrl.getMyUsage
);
