import { Router } from 'express';
import * as ctrl from './billing.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { resolveTenant } from '../../middleware/tenant.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';

export const billingRouter = Router();
export const webhookRouter = Router();

/** Public plan catalog */
billingRouter.get('/plans', ctrl.listPlans);

/** Authenticated billing actions */
billingRouter.post(
  '/checkout',
  authenticate,
  resolveTenant,
  requirePermission('billing', 'manage'),
  ctrl.createCheckout
);

billingRouter.post(
  '/portal',
  authenticate,
  resolveTenant,
  requirePermission('billing', 'manage'),
  ctrl.createPortal
);

/** Webhooks — no JWT auth; verified via provider signatures */
webhookRouter.post('/stripe', ctrl.stripeWebhook);
webhookRouter.post('/razorpay', ctrl.razorpayWebhook);
