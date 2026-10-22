import { Router } from 'express';
import * as ctrl from './faculty.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { resolveTenant } from '../../middleware/tenant.middleware';
import { requirePermission, requireRoles } from '../../middleware/rbac.middleware';
import { requireLimit } from '../../services/featureFlags';

export const facultyRouter = Router();

facultyRouter.use(authenticate, resolveTenant);

facultyRouter.get(
  '/me',
  requireRoles('faculty', 'tenant_admin', 'university_admin', 'super_admin', 'department_head'),
  ctrl.getMe
);

facultyRouter.get(
  '/me/courses',
  requireRoles('faculty', 'tenant_admin', 'university_admin', 'super_admin', 'department_head'),
  ctrl.getMyCourses
);

facultyRouter.get('/stats', requirePermission('faculty', 'read'), ctrl.stats);

facultyRouter.get('/', requirePermission('faculty', 'read'), ctrl.list);
facultyRouter.post(
  '/',
  requirePermission('faculty', 'create'),
  requireLimit('activeFaculty'),
  ctrl.create
);

facultyRouter.get('/:id', requirePermission('faculty', 'read'), ctrl.getById);
facultyRouter.patch('/:id', requirePermission('faculty', 'update'), ctrl.update);
facultyRouter.delete('/:id', requirePermission('faculty', 'delete'), ctrl.remove);

facultyRouter.post('/:id/status', requirePermission('faculty', 'manage'), ctrl.changeStatus);
facultyRouter.post(
  '/:id/assign-department',
  requirePermission('faculty', 'manage'),
  ctrl.assignDepartment
);

facultyRouter.get('/:id/assignments', requirePermission('faculty', 'read'), ctrl.listAssignments);
facultyRouter.post('/:id/assignments', requirePermission('faculty', 'manage'), ctrl.addAssignment);
facultyRouter.delete(
  '/:id/assignments/:assignmentId',
  requirePermission('faculty', 'manage'),
  ctrl.removeAssignment
);
