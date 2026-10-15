import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { resolveTenant } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import * as ctrl from './assignment.controller';

export const assignmentRouter = Router();

assignmentRouter.use(authenticate, resolveTenant);

assignmentRouter.get('/', requirePermission('assignment', 'read'), ctrl.list);
assignmentRouter.post('/', requirePermission('assignment', 'manage'), ctrl.create);

assignmentRouter.patch(
  '/submissions/:id',
  requirePermission('assignment', 'read'),
  ctrl.updateSubmission
);
assignmentRouter.post(
  '/submissions/:id/grade',
  requirePermission('assignment', 'manage'),
  ctrl.grade
);

assignmentRouter.get('/:id', requirePermission('assignment', 'read'), ctrl.getById);
assignmentRouter.patch('/:id', requirePermission('assignment', 'manage'), ctrl.update);
assignmentRouter.delete('/:id', requirePermission('assignment', 'manage'), ctrl.remove);
assignmentRouter.post('/:id/publish', requirePermission('assignment', 'manage'), ctrl.publish);
assignmentRouter.post('/:id/close', requirePermission('assignment', 'manage'), ctrl.close);
assignmentRouter.get(
  '/:id/submissions',
  requirePermission('assignment', 'manage'),
  ctrl.listSubmissions
);
assignmentRouter.get(
  '/:id/my-submission',
  requirePermission('assignment', 'read'),
  ctrl.mySubmission
);
assignmentRouter.post(
  '/:id/submissions',
  requirePermission('assignment', 'read'),
  ctrl.submit
);
