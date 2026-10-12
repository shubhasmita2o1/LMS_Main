import { Router } from 'express';
import * as ctrl from './student.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { resolveTenant } from '../../middleware/tenant.middleware';
import { requirePermission, requireRoles } from '../../middleware/rbac.middleware';
import { requireLimit } from '../../services/featureFlags';

export const studentRouter = Router();

studentRouter.use(authenticate, resolveTenant);

// Self profile for linked student user — before /:id
studentRouter.get(
  '/me',
  requireRoles('student', 'tenant_admin', 'university_admin', 'super_admin'),
  ctrl.getMe
);

studentRouter.get('/stats', requirePermission('student', 'read'), ctrl.stats);
studentRouter.get('/export', requirePermission('student', 'export'), ctrl.exportList);
studentRouter.post('/bulk', requirePermission('student', 'import'), ctrl.bulk);

studentRouter.get('/', requirePermission('student', 'read'), ctrl.list);
studentRouter.post(
  '/',
  requirePermission('student', 'create'),
  requireLimit('activeStudents'),
  ctrl.create
);

studentRouter.get('/:id', requirePermission('student', 'read'), ctrl.getById);
studentRouter.patch('/:id', requirePermission('student', 'update'), ctrl.update);
studentRouter.delete('/:id', requirePermission('student', 'delete'), ctrl.remove);

studentRouter.post('/:id/status', requirePermission('student', 'manage'), ctrl.changeStatus);
studentRouter.post('/:id/enroll', requirePermission('student', 'manage'), ctrl.enroll);

studentRouter.get('/:id/documents', requirePermission('student', 'read'), ctrl.listDocuments);
studentRouter.post('/:id/documents', requirePermission('student', 'update'), ctrl.addDocument);
studentRouter.delete(
  '/:id/documents/:docId',
  requirePermission('student', 'update'),
  ctrl.removeDocument
);
