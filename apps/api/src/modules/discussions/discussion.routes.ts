import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { resolveTenant } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { rateLimit } from '../../middleware/rateLimit';
import * as ctrl from './discussion.controller';

const createLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: (req) => `disc-create:${req.user?.id || req.ip || 'anon'}`,
});

const reportLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => `disc-report:${req.user?.id || req.ip || 'anon'}`,
});

/** Nested under /api/v1/courses/:courseId/discussions */
export const courseDiscussionRouter = Router({ mergeParams: true });
courseDiscussionRouter.use(authenticate, resolveTenant);

courseDiscussionRouter.get('/threads', requirePermission('discussion', 'read'), ctrl.listThreads);
courseDiscussionRouter.post(
  '/threads',
  requirePermission('discussion', 'create'),
  createLimit,
  ctrl.createThread
);
courseDiscussionRouter.get(
  '/threads/:threadId',
  requirePermission('discussion', 'read'),
  ctrl.getThread
);
courseDiscussionRouter.post(
  '/threads/:threadId/replies',
  requirePermission('discussion', 'create'),
  createLimit,
  ctrl.createReply
);
courseDiscussionRouter.post(
  '/threads/:threadId/lock',
  requirePermission('discussion', 'moderate'),
  ctrl.lockThread
);
courseDiscussionRouter.post(
  '/threads/:threadId/pin',
  requirePermission('discussion', 'moderate'),
  ctrl.pinThread
);

/** Top-level /api/v1/discussions for replies moderation + reports */
export const discussionRouter = Router();
discussionRouter.use(authenticate, resolveTenant);

discussionRouter.post(
  '/replies/:replyId/hide',
  requirePermission('discussion', 'moderate'),
  ctrl.hideReply
);
discussionRouter.post(
  '/replies/:replyId/mark-answer',
  requirePermission('discussion', 'moderate'),
  ctrl.markAnswer
);
discussionRouter.post(
  '/reports',
  requirePermission('discussion', 'create'),
  reportLimit,
  ctrl.createReport
);
discussionRouter.get('/reports', requirePermission('discussion', 'moderate'), ctrl.listReports);
discussionRouter.post(
  '/reports/:reportId/resolve',
  requirePermission('discussion', 'moderate'),
  ctrl.resolveReport
);
