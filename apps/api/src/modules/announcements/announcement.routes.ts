import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { resolveTenant } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import * as ctrl from './announcement.controller';

export const announcementRouter = Router();

announcementRouter.use(authenticate, resolveTenant);

announcementRouter.get('/', requirePermission('announcement', 'read'), ctrl.list);
announcementRouter.get('/:id', requirePermission('announcement', 'read'), ctrl.getOne);
announcementRouter.post('/', requirePermission('announcement', 'manage'), ctrl.create);
announcementRouter.patch('/:id', requirePermission('announcement', 'manage'), ctrl.update);
announcementRouter.post('/:id/publish', requirePermission('announcement', 'manage'), ctrl.publish);
announcementRouter.post('/:id/archive', requirePermission('announcement', 'manage'), ctrl.archive);
