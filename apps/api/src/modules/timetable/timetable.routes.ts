import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { resolveTenant } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import * as ctrl from './timetable.controller';

export const timetableRouter = Router();

timetableRouter.use(authenticate, resolveTenant);

// Rooms
timetableRouter.get('/rooms', requirePermission('room', 'read'), ctrl.listRooms);
timetableRouter.post('/rooms', requirePermission('room', 'manage'), ctrl.createRoom);
timetableRouter.patch('/rooms/:id', requirePermission('room', 'manage'), ctrl.updateRoom);
timetableRouter.delete('/rooms/:id', requirePermission('room', 'manage'), ctrl.deleteRoom);

// Calendar (before :id paths)
timetableRouter.get('/calendar/me', requirePermission('timetable', 'read'), ctrl.calendarMe);
timetableRouter.post('/conflicts/check', requirePermission('timetable', 'manage'), ctrl.checkConflicts);

// Entries
timetableRouter.get('/entries', requirePermission('timetable', 'read'), ctrl.listEntries);
timetableRouter.post('/entries', requirePermission('timetable', 'manage'), ctrl.createEntry);
timetableRouter.patch('/entries/:id', requirePermission('timetable', 'manage'), ctrl.updateEntry);
timetableRouter.delete('/entries/:id', requirePermission('timetable', 'manage'), ctrl.deleteEntry);
timetableRouter.post('/entries/:id/cancel', requirePermission('timetable', 'manage'), ctrl.cancelEntry);
timetableRouter.post(
  '/entries/:id/substitute',
  requirePermission('timetable', 'manage'),
  ctrl.substituteEntry
);
