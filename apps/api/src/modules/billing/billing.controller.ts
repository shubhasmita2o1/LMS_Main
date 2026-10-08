import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as billingService from './billing.service';
import { WebhookEvent } from './webhookEvent.model';
import { AppError } from '../../middleware/errorHandler';
import { Plan } from '../plans/plan.model';

const checkoutSchema = z.object({
  planTier: z.enum(['free', 'starter', 'professional', 'enterprise']),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  provider: z.enum(['stripe', 'razorpay']).optional(),
});

const portalSchema = z.object({
  returnUrl: z.string().url(),
});

export async function createCheckout(req: Request, res: Response, next: NextFunction) {
  try {
    const body = checkoutSchema.parse(req.body);
    const tenantId = req.user?.tenantId;
    if (!tenantId && !req.user?.roles.includes('super_admin')) {
      throw new AppError(400, 'Tenant context required', 'TENANT_REQUIRED');
    }
    // Super admin must pass tenant via header / body override in future; for now require tenant user
    if (!tenantId) {
      throw new AppError(400, 'Tenant context required for checkout', 'TENANT_REQUIRED');
    }

    const session = await billingService.createCheckoutSession({
      tenantId,
      planTier: body.planTier,
      successUrl: body.successUrl,
      cancelUrl: body.cancelUrl,
      provider: body.provider,
    });

    res.status(200).json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
}

export async function createPortal(req: Request, res: Response, next: NextFunction) {
  try {
    const body = portalSchema.parse(req.body);
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new AppError(400, 'Tenant context required', 'TENANT_REQUIRED');
    }

    const portal = await billingService.createCustomerPortalLink({
      tenantId,
      returnUrl: body.returnUrl,
    });

    res.status(200).json({ success: true, data: portal });
  } catch (err) {
    next(err);
  }
}

export async function listPlans(_req: Request, res: Response, next: NextFunction) {
  try {
    const plans = await Plan.find({ isActive: true, isPublic: true })
      .sort({ sortOrder: 1 })
      .lean();

    res.status(200).json({
      success: true,
      data: plans.map((p) => ({
        id: String(p._id),
        key: p.key,
        name: p.name,
        description: p.description,
        price: p.price,
        currency: p.currency,
        interval: p.interval,
        features: p.features,
        featureFlags: p.featureFlags,
        limits: p.limits,
        isActive: p.isActive,
        isPublic: p.isPublic,
        trialDays: p.trialDays,
        sortOrder: p.sortOrder,
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function stripeWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const signature = req.headers['stripe-signature'] as string | undefined;
    const rawBody =
      typeof req.body === 'string' || Buffer.isBuffer(req.body)
        ? req.body
        : JSON.stringify(req.body);

    if (!billingService.verifyStripeSignature(rawBody, signature)) {
      throw new AppError(400, 'Invalid Stripe signature', 'INVALID_SIGNATURE');
    }

    const event =
      typeof req.body === 'object' && !Buffer.isBuffer(req.body)
        ? req.body
        : JSON.parse(String(rawBody));

    const eventId = String(event.id || event.event_id || '');
    const type = String(event.type || '');

    if (!eventId || !type) {
      throw new AppError(400, 'Invalid webhook payload', 'VALIDATION_ERROR');
    }

    const { isNew, event: record } = await billingService.recordWebhookEvent({
      provider: 'stripe',
      eventId,
      type,
      payload: event,
    });

    if (!isNew) {
      res.status(200).json({ success: true, message: 'Already processed' });
      return;
    }

    try {
      await billingService.processStripeEvent(type, event);
      record.status = 'processed';
      record.processedAt = new Date();
      await record.save();
    } catch (processErr) {
      record.status = 'failed';
      record.errorMessage =
        processErr instanceof Error ? processErr.message : 'Processing failed';
      await record.save();
      throw processErr;
    }

    res.status(200).json({ success: true, message: 'Webhook processed' });
  } catch (err) {
    next(err);
  }
}

export async function razorpayWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const signature =
      (req.headers['x-razorpay-signature'] as string | undefined) ||
      (req.headers['x-razorpay-signature'.toLowerCase()] as string | undefined);

    const body = req.body as Record<string, unknown>;

    if (!billingService.verifyRazorpaySignature(body, signature)) {
      throw new AppError(400, 'Invalid Razorpay signature', 'INVALID_SIGNATURE');
    }

    const eventId = String(
      body.id || (body.payload as { payment?: { entity?: { id?: string } } })?.payment?.entity?.id || ''
    );
    const type = String(body.event || body.type || '');

    if (!eventId || !type) {
      throw new AppError(400, 'Invalid webhook payload', 'VALIDATION_ERROR');
    }

    const { isNew, event: record } = await billingService.recordWebhookEvent({
      provider: 'razorpay',
      eventId,
      type,
      payload: body,
    });

    if (!isNew) {
      res.status(200).json({ success: true, message: 'Already processed' });
      return;
    }

    try {
      await billingService.processRazorpayEvent(type, body);
      record.status = 'processed';
      record.processedAt = new Date();
      await record.save();
    } catch (processErr) {
      record.status = 'failed';
      record.errorMessage =
        processErr instanceof Error ? processErr.message : 'Processing failed';
      await record.save();
      throw processErr;
    }

    res.status(200).json({ success: true, message: 'Webhook processed' });
  } catch (err) {
    next(err);
  }
}
