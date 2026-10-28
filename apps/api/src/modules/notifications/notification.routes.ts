import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { resolveTenant } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import * as ctrl from './notification.controller';

export const notificationRouter = Router();

notificationRouter.use(authenticate, resolveTenant);

// User-facing (static paths before :id)
notificationRouter.get('/', requirePermission('notification', 'read'), ctrl.list);
notificationRouter.get('/unread-count', requirePermission('notification', 'read'), ctrl.getUnreadCount);
notificationRouter.post('/read-all', requirePermission('notification', 'read'), ctrl.markAllRead);
notificationRouter.get('/preferences', requirePermission('notification', 'read'), ctrl.getPreferences);
notificationRouter.patch('/preferences', requirePermission('notification', 'read'), ctrl.patchPreferences);

// Admin static paths
notificationRouter.get(
  '/admin/delivery-logs',
  requirePermission('notification', 'manage'),
  ctrl.listDeliveryLogs
);
notificationRouter.get('/templates', requirePermission('notification', 'manage'), ctrl.listTemplates);
notificationRouter.post('/templates', requirePermission('notification', 'manage'), ctrl.createTemplate);
notificationRouter.patch(
  '/templates/:id',
  requirePermission('notification', 'manage'),
  ctrl.updateTemplate
);
notificationRouter.delete(
  '/templates/:id',
  requirePermission('notification', 'manage'),
  ctrl.deleteTemplate
);

notificationRouter.post('/:id/read', requirePermission('notification', 'read'), ctrl.markRead);
