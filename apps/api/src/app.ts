import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { defaultApiRateLimit } from './middleware/rateLimit';
import { healthRouter } from './modules/health/health.routes';
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
      version: '0.1.0',
      docs: '/api/v1 (OpenAPI coming in later phases)',
    });
  });

  // Future modules will be mounted here (Phase 2+):
  // app.use('/api/v1/auth', authRouter);
  // app.use('/api/v1/tenants', tenantRouter);
  // app.use('/api/v1/users', userRouter);
  // ...

  // 404 & error handlers (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
