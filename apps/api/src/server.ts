import { createApp } from './app';
import { connectDatabase, disconnectDatabase } from './config/database';
import { env } from './config/env';
import { logger } from './utils/logger';
import { seedPlans } from './modules/plans/plan.model';

async function bootstrap() {
  try {
    await connectDatabase();

    // Idempotent seed of plan catalog
    try {
      await seedPlans();
      logger.info('Plan catalog seeded');
    } catch (seedErr) {
      logger.error('Plan seed failed (non-fatal)', {
        error: seedErr instanceof Error ? seedErr.message : String(seedErr),
      });
    }

    const app = createApp();

    const server = app.listen(env.PORT, () => {
      logger.info('University LMS API started', {
        port: env.PORT,
        environment: env.NODE_ENV,
        phase: 3,
        health: `http://localhost:${env.PORT}/health`,
      });
    });

    const shutdown = async (signal: string) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await disconnectDatabase();
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => void shutdown('SIGTERM'));
    process.on('SIGINT', () => void shutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

void bootstrap();
