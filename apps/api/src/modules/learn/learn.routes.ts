import { Router } from 'express';
import * as ctrl from './learn.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { resolveTenant } from '../../middleware/tenant.middleware';
import { requirePermission, requireRoles } from '../../middleware/rbac.middleware';

export const learnRouter = Router();

learnRouter.use(authenticate, resolveTenant);

// Student learning
learnRouter.get('/my-courses', requireRoles('student', 'tenant_admin', 'university_admin', 'faculty', 'super_admin'), ctrl.myCourses);
learnRouter.get('/courses/:id/outline', requirePermission('course', 'read'), ctrl.courseOutline);
learnRouter.get('/courses/:id/progress', requireRoles('student'), ctrl.courseProgress);
learnRouter.get('/courses/:id/bookmarks', requireRoles('student'), ctrl.listBookmarks);

learnRouter.get('/lessons/:id', requirePermission('course', 'read'), ctrl.lessonDetail);
learnRouter.post('/lessons/:id/progress', requireRoles('student'), ctrl.updateProgress);
learnRouter.post('/lessons/:id/notes', requireRoles('student'), ctrl.createNote);
learnRouter.get('/lessons/:id/notes', requireRoles('student'), ctrl.listNotes);
learnRouter.post('/lessons/:id/bookmarks', requireRoles('student'), ctrl.addBookmark);
learnRouter.post(
  '/lessons/:id/content',
  requirePermission('course', 'update'),
  ctrl.attachContent
);

learnRouter.patch('/notes/:id', requireRoles('student'), ctrl.updateNote);
learnRouter.delete('/notes/:id', requireRoles('student'), ctrl.deleteNote);
learnRouter.delete('/bookmarks/:id', requireRoles('student'), ctrl.removeBookmark);

// Live classes
learnRouter.post('/live-classes', requirePermission('course', 'manage'), ctrl.createLiveClass);
learnRouter.get('/live-classes', requirePermission('course', 'read'), ctrl.listLiveClasses);
learnRouter.get('/live-classes/:id', requirePermission('course', 'read'), ctrl.getLiveClass);
learnRouter.patch('/live-classes/:id', requirePermission('course', 'manage'), ctrl.updateLiveClass);
learnRouter.post('/live-classes/:id/start', requirePermission('course', 'manage'), ctrl.startLiveClass);
learnRouter.post(
  '/live-classes/:id/complete',
  requirePermission('course', 'manage'),
  ctrl.completeLiveClass
);

// Content upload (base64 JSON for MVP — no multer required)
learnRouter.post('/content/upload', requirePermission('course', 'update'), ctrl.uploadContent);
