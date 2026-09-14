import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

const envCandidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../../.env'),
];

for (const candidate of envCandidates) {
  if (fs.existsSync(candidate)) {
    dotenv.config({ path: candidate });
    break;
  }
}

function readEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const isTestEnv = process.env.NODE_ENV === 'test';

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  mongodbUri: readEnv(
    'MONGODB_URI',
    isTestEnv ? 'mongodb://localhost:27017/dev-platform-test' : undefined,
  ),
  redisUrl: readEnv('REDIS_URL', isTestEnv ? 'redis://localhost:6379' : undefined),
  jwtAccessSecret: readEnv('JWT_ACCESS_SECRET', isTestEnv ? 'test-access-secret' : undefined),
  jwtRefreshSecret: readEnv('JWT_REFRESH_SECRET', isTestEnv ? 'test-refresh-secret' : undefined),
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
};

export const isTest = env.nodeEnv === 'test';
