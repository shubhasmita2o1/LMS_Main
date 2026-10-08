import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { defaultApiRateLimit } from './middleware/rateLimit';
import { healthRouter } from './modules/health/health.routes';
import { authRouter } from './modules/auth/auth.routes';
import { userRouter } from './modules/users/user.routes';
import { adminRouter } from './modules/admin/admin.routes';
import { tenantRouter } from './modules/tenants/tenant.routes';
import { billingRouter, webhookRouter } from './modules/billing/billing.routes';
import { env } from './config/env';

export function createApp() {
  const app = express();

  // Trust proxy when behind CDN / load balancer (custom domains, Cloudflare, etc.)
  app.set('trust proxy', 1);

  // Security & basics
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    })
  );

  // Stripe webhooks need raw body for signature verification in production.
  // For skeleton we accept JSON; mount raw parser selectively if needed later.
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  // Global rate limit (skeleton — tighten per-route later)
  app.use(defaultApiRateLimit);

  // Health check (no auth)
  app.use('/health', healthRouter);

  // API version prefix
  app.get('/api/v1', (_req, res) => {
    res.json({
      success: true,
      message: 'University LMS API v1',
      version: '0.3.0',
      phase: 3,
      docs: '/api/v1 (OpenAPI coming in later phases)',
    });
  });

  // Phase 2 modules
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/users', userRouter);

  // Phase 3 modules
  app.use('/api/v1/admin', adminRouter);
  app.use('/api/v1/tenants', tenantRouter);
  app.use('/api/v1/billing', billingRouter);
  app.use('/api/v1/webhooks', webhookRouter);

  // 404 & error handlers (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
