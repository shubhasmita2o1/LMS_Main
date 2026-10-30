import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { resolveTenant } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import * as ctrl from './support.controller';

export const supportRouter = Router();
supportRouter.use(authenticate, resolveTenant);

supportRouter.post('/tickets', requirePermission('support', 'create'), ctrl.createTicket);
supportRouter.get('/tickets', requirePermission('support', 'read'), ctrl.listTickets);
supportRouter.get('/tickets/me', requirePermission('support', 'read'), ctrl.listTickets);
supportRouter.get('/tickets/:id', requirePermission('support', 'read'), ctrl.getTicket);
supportRouter.patch('/tickets/:id', requirePermission('support', 'manage'), ctrl.updateTicket);
supportRouter.post(
  '/tickets/:id/escalate',
  requirePermission('support', 'manage'),
  ctrl.escalateTicket
);
supportRouter.get('/tickets/:id/messages', requirePermission('support', 'read'), ctrl.listMessages);
supportRouter.post(
  '/tickets/:id/messages',
  requirePermission('support', 'create'),
  ctrl.addMessage
);
