import { Queue, Worker, type Job } from 'bullmq';
import { env, isTest } from '../../../config/env';
import { logger } from '../../../utils/logger';

export type NotificationJob = {
  notificationId: string;
  organizationId: string;
  userId: string;
  studentId: string;
  type: string;
};

const MAX_ATTEMPTS = 3;

let pending: NotificationJob[] = [];
let bullQueue: Queue<NotificationJob> | null = null;
let bullWorker: Worker<NotificationJob> | null = null;
let bullEnabled = false;

export async function enqueueNotificationJob(job: NotificationJob): Promise<void> {
  if (bullEnabled && bullQueue) {
    await bullQueue.add('SEND_PUSH_NOTIFICATION', job, {
      attempts: MAX_ATTEMPTS,
      backoff: { type: 'exponential', delay: 200 },
      removeOnComplete: 100,
      removeOnFail: 100,
    });
    return;
  }
  pending.push(job);
  if (!isTest) {
    queueMicrotask(() => {
      void flushNotificationJobs();
    });
  }
}

export async function flushNotificationJobs(): Promise<void> {
  const jobs = pending;
  pending = [];
  for (const job of jobs) {
    await runWithRetries(job);
  }
}

export function resetNotificationQueue(): void {
  pending = [];
}

export async function startNotificationWorker(): Promise<void> {
  if (isTest) {
    return;
  }
  if (!env.redisUrl) {
    bullEnabled = false;
    logger.info('Redis unset; using in-process notification queue');
    return;
  }
  try {
    const { default: IORedis } = await import('ioredis');
    const redis = new IORedis(env.redisUrl, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy: () => null,
    });
    await redis.connect();
    await redis.ping();
    bullQueue = new Queue<NotificationJob>('notificationQueue', { connection: redis });
    bullWorker = new Worker<NotificationJob>(
      'notificationQueue',
      async (job: Job<NotificationJob>) => {
        await deliver(job.data);
      },
      {
        connection: redis.duplicate({
          maxRetriesPerRequest: null,
          enableOfflineQueue: false,
        }),
        concurrency: 5,
      },
    );
    bullWorker.on('failed', (job, err) => {
      if (!job || job.attemptsMade < MAX_ATTEMPTS) {
        return;
      }
      void markFailed(job.data).catch((markErr: unknown) => {
        logger.error('Failed to mark notification FAILED', markErr);
      });
      logger.error('Notification job failed', err);
    });
    bullEnabled = true;
    logger.info('Notification worker listening on notificationQueue');
  } catch (err) {
    bullEnabled = false;
    await stopNotificationWorker().catch(() => undefined);
    logger.warn('BullMQ unavailable; using in-process notification queue', err);
  }
}

export async function stopNotificationWorker(): Promise<void> {
  bullEnabled = false;
  await Promise.all([bullWorker?.close(), bullQueue?.close()]);
  bullWorker = null;
  bullQueue = null;
}

async function runWithRetries(job: NotificationJob): Promise<void> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      await deliver(job);
      return;
    } catch (err) {
      lastError = err;
      if (attempt < MAX_ATTEMPTS && !isTest) {
        await sleep(200 * 2 ** (attempt - 1));
      }
    }
  }
  await markFailed(job);
  if (lastError) {
    logger.error('Notification delivery failed after retries', lastError);
  }
}

async function deliver(job: NotificationJob): Promise<void> {
  const { deliverQueuedNotification } = await import('../notification.service');
  await deliverQueuedNotification(job);
}

async function markFailed(job: NotificationJob): Promise<void> {
  const { markNotificationFailed } = await import('../notification.service');
  await markNotificationFailed(job.organizationId, job.notificationId);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
