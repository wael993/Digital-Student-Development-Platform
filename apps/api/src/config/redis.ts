import Redis from 'ioredis';
import { logger } from '../utils/logger';
import { env } from './env';

let client: Redis | null = null;

export async function connectRedis(): Promise<Redis> {
  client = new Redis(env.redisUrl, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

  await client.connect();
  await client.ping();
  logger.info('Connected to Redis');
  return client;
}

export function getRedis(): Redis {
  if (!client) {
    throw new Error('Redis is not connected');
  }

  return client;
}

export async function disconnectRedis(): Promise<void> {
  if (!client) {
    return;
  }

  await client.quit();
  client = null;
}
