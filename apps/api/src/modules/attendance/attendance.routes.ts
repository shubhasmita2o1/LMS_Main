import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { resolveTenant } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import * as ctrl from './attendance.controller';

export const attendanceRouter = Router();

attendanceRouter.use(authenticate, resolveTenant);

attendanceRouter.get('/sessions', requirePermission('attendance', 'read'), ctrl.listSessions);
attendanceRouter.post('/sessions', requirePermission('attendance', 'manage'), ctrl.createSession);
attendanceRouter.get(
  '/sessions/:id',
  requirePermission('attendance', 'read'),
  ctrl.getSession
);
attendanceRouter.patch(
  '/sessions/:id',
  requirePermission('attendance', 'manage'),
  ctrl.updateSession
);
attendanceRouter.post(
  '/sessions/:id/close',
  requirePermission('attendance', 'manage'),
  ctrl.closeSession
);
attendanceRouter.put(
  '/sessions/:id/records',
  requirePermission('attendance', 'manage'),
  ctrl.bulkRecords
);
attendanceRouter.post(
  '/sessions/:id/records',
  requirePermission('attendance', 'manage'),
  ctrl.singleRecord
);

attendanceRouter.get('/summary', requirePermission('attendance', 'manage'), ctrl.summary);
attendanceRouter.get('/me', requirePermission('attendance', 'read'), ctrl.me);
attendanceRouter.get(
  '/shortage-report',
  requirePermission('attendance', 'manage'),
  ctrl.shortageReport
);
