import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { resolveTenant } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import * as ctrl from './library.controller';

export const libraryRouter = Router();
libraryRouter.use(authenticate, resolveTenant);

// Catalog
libraryRouter.get('/items', requirePermission('library', 'read'), ctrl.listItems);
libraryRouter.get('/items/:id', requirePermission('library', 'read'), ctrl.getItem);
libraryRouter.post('/items', requirePermission('library', 'manage'), ctrl.createItem);
libraryRouter.patch('/items/:id', requirePermission('library', 'manage'), ctrl.updateItem);
libraryRouter.delete('/items/:id', requirePermission('library', 'manage'), ctrl.deleteItem);

// Circulation
libraryRouter.get('/loans', requirePermission('library', 'read'), ctrl.listLoans);
libraryRouter.get('/loans/me', requirePermission('library', 'read'), ctrl.listLoans);
libraryRouter.post('/loans', requirePermission('library', 'circulate'), ctrl.createLoan);
libraryRouter.post('/loans/:id/return', requirePermission('library', 'circulate'), ctrl.returnLoan);

// Reservations
libraryRouter.get('/reservations', requirePermission('library', 'read'), ctrl.listReservations);
libraryRouter.get('/reservations/me', requirePermission('library', 'read'), ctrl.listReservations);
libraryRouter.post('/reservations', requirePermission('library', 'read'), ctrl.createReservation);
libraryRouter.post(
  '/reservations/:id/cancel',
  requirePermission('library', 'read'),
  ctrl.cancelReservation
);

// Fines (no payment — record / waive only)
libraryRouter.get('/fines', requirePermission('library', 'read'), ctrl.listFines);
libraryRouter.get('/fines/me', requirePermission('library', 'read'), ctrl.listFines);
libraryRouter.post('/fines/:id/waive', requirePermission('library', 'manage'), ctrl.waiveFine);

// Maintenance
libraryRouter.post('/overdue/refresh', requirePermission('library', 'manage'), ctrl.refreshOverdue);
