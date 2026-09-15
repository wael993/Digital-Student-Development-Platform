import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { buildMongoUri, buildRedisUrl } from './connection-urls';

const isTestEnv = process.env.NODE_ENV === 'test';

const envCandidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../../.env'),
];

if (!isTestEnv) {
  for (const candidate of envCandidates) {
    if (fs.existsSync(candidate)) {
      dotenv.config({ path: candidate });
      break;
    }
  }
}

function readEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  mongodbUri: buildMongoUri(process.env),
  // Empty = Redis/BullMQ disabled; notifications run in-process.
  redisUrl: buildRedisUrl(process.env),
  jwtAccessSecret: readEnv('JWT_ACCESS_SECRET', isTestEnv ? 'test-access-secret' : undefined),
  jwtRefreshSecret: readEnv('JWT_REFRESH_SECRET', isTestEnv ? 'test-refresh-secret' : undefined),
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  apiPublicUrl:
    process.env.API_PUBLIC_URL ?? `http://localhost:${Number(process.env.PORT ?? 3000)}`,
  mediaMaxUploadBytes: Number(process.env.MEDIA_MAX_UPLOAD_BYTES ?? 10 * 1024 * 1024),
  mediaSignedUrlTtlSeconds: Number(process.env.MEDIA_SIGNED_URL_TTL_SECONDS ?? 600),
  mediaStorageDir: process.env.MEDIA_STORAGE_DIR ?? path.resolve(process.cwd(), 'data/media'),
  storageSecret: process.env.STORAGE_SECRET_KEY ?? '',
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY ?? '',
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET ?? '',
  fcmProjectId: process.env.FCM_PROJECT_ID ?? '',
  fcmClientEmail: process.env.FCM_CLIENT_EMAIL ?? '',
  fcmPrivateKey: process.env.FCM_PRIVATE_KEY ?? '',
};

export const isTest = env.nodeEnv === 'test';
