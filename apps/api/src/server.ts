import { createApp } from './app';
import { env, isTest } from './config/env';
import { connectMongo } from './config/mongodb';
import { startNotificationWorker } from './modules/notifications/jobs/notification.queue';
import { logger } from './utils/logger';

async function start(): Promise<void> {
  if (!isTest) {
    await connectMongo();
    await startNotificationWorker();
  }

  const app = createApp();

  app.listen(env.port, '0.0.0.0', () => {
    logger.info(`API listening on port ${env.port}`);
  });
}

start().catch((error: unknown) => {
  logger.error('Failed to start server', error);
  process.exit(1);
});
