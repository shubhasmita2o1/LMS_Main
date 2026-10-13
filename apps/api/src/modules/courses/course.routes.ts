import { Router } from 'express';
import * as ctrl from './course.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { resolveTenant } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { requireLimit } from '../../services/featureFlags';

export const courseRouter = Router();

courseRouter.use(authenticate, resolveTenant);

courseRouter.get('/stats', requirePermission('course', 'read'), ctrl.stats);

courseRouter.get('/', requirePermission('course', 'read'), ctrl.list);
courseRouter.post(
  '/',
  requirePermission('course', 'create'),
  requireLimit('courses'),
  ctrl.create
);

// Curriculum (before /:id to avoid conflict)
courseRouter.get(
  '/curriculum/:programId',
  requirePermission('course', 'read'),
  ctrl.getCurriculum
);
courseRouter.post('/curriculum', requirePermission('course', 'manage'), ctrl.addCurriculum);
courseRouter.delete(
  '/curriculum/:entryId',
  requirePermission('course', 'manage'),
  ctrl.removeCurriculum
);

// Enrollments
courseRouter.get('/enrollments', requirePermission('course', 'read'), ctrl.listEnrollments);
courseRouter.post('/enrollments', requirePermission('course', 'manage'), ctrl.enroll);

// Module / lesson routes that use moduleId / lessonId (before /:id)
courseRouter.patch(
  '/modules/:moduleId',
  requirePermission('course', 'update'),
  ctrl.updateModule
);
courseRouter.delete(
  '/modules/:moduleId',
  requirePermission('course', 'update'),
  ctrl.removeModule
);
courseRouter.get(
  '/modules/:moduleId/lessons',
  requirePermission('course', 'read'),
  ctrl.listLessons
);
courseRouter.post(
  '/modules/:moduleId/lessons',
  requirePermission('course', 'update'),
  ctrl.createLesson
);
courseRouter.patch(
  '/lessons/:lessonId',
  requirePermission('course', 'update'),
  ctrl.updateLesson
);
courseRouter.delete(
  '/lessons/:lessonId',
  requirePermission('course', 'update'),
  ctrl.removeLesson
);

// Offering faculty assign
courseRouter.post(
  '/offerings/:id/assign-faculty',
  requirePermission('course', 'manage'),
  ctrl.assignFaculty
);

// Course by id
courseRouter.get('/:id', requirePermission('course', 'read'), ctrl.getById);
courseRouter.patch('/:id', requirePermission('course', 'update'), ctrl.update);
courseRouter.delete('/:id', requirePermission('course', 'delete'), ctrl.remove);

courseRouter.post(
  '/:id/prerequisites',
  requirePermission('course', 'update'),
  ctrl.setPrerequisites
);

courseRouter.get('/:id/modules', requirePermission('course', 'read'), ctrl.listModules);
courseRouter.post('/:id/modules', requirePermission('course', 'update'), ctrl.createModule);

courseRouter.get('/:id/offerings', requirePermission('course', 'read'), ctrl.listOfferings);
courseRouter.post(
  '/:id/offerings',
  requirePermission('course', 'manage'),
  ctrl.createOffering
);
