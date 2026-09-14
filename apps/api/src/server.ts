import { createApp } from './app';
import { env, isTest } from './config/env';
import { connectMongo } from './config/mongodb';
import { connectRedis } from './config/redis';
import { logger } from './utils/logger';

async function start(): Promise<void> {
  if (!isTest) {
    await connectMongo();
    await connectRedis();
  }

  const app = createApp();

  app.listen(env.port, () => {
    logger.info(`API listening on port ${env.port}`);
  });
}

start().catch((error: unknown) => {
  logger.error('Failed to start server', error);
  process.exit(1);
});
