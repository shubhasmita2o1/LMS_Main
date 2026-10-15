import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { resolveTenant } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import * as ctrl from './gradebook.controller';

export const gradebookRouter = Router();

gradebookRouter.use(authenticate, resolveTenant);

gradebookRouter.get('/me/transcript', requirePermission('result', 'read'), ctrl.transcript);

gradebookRouter.get('/', requirePermission('grade', 'read'), ctrl.list);
gradebookRouter.post('/', requirePermission('grade', 'manage'), ctrl.create);

gradebookRouter.get('/:id', requirePermission('grade', 'read'), ctrl.getById);
gradebookRouter.patch('/:id', requirePermission('grade', 'manage'), ctrl.update);
gradebookRouter.post('/:id/lock', requirePermission('grade', 'manage'), ctrl.lock);
gradebookRouter.post('/:id/unlock', requirePermission('grade', 'manage'), ctrl.unlock);
gradebookRouter.post('/:id/recompute', requirePermission('grade', 'manage'), ctrl.recompute);
gradebookRouter.get('/:id/roster', requirePermission('grade', 'manage'), ctrl.roster);
gradebookRouter.patch('/:id/entries', requirePermission('grade', 'manage'), ctrl.upsertEntries);
gradebookRouter.post(
  '/:id/publish-results',
  requirePermission('result', 'manage'),
  ctrl.publishResults
);
gradebookRouter.get('/:id/my-grades', requirePermission('result', 'read'), ctrl.myGrades);
