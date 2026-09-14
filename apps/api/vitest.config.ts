import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      PORT: '3000',
      MONGODB_URI: 'mongodb://localhost:27017/dev-platform-test',
      REDIS_URL: 'redis://localhost:6379',
      JWT_ACCESS_SECRET: 'test-access-secret',
      JWT_REFRESH_SECRET: 'test-refresh-secret',
      JWT_ACCESS_EXPIRES_IN: '15m',
      JWT_REFRESH_EXPIRES_IN: '7d',
      API_PUBLIC_URL: 'http://127.0.0.1:3000',
      MEDIA_MAX_UPLOAD_BYTES: '65536',
      MEDIA_SIGNED_URL_TTL_SECONDS: '600',
      MEDIA_STORAGE_DIR: '/tmp/digital-student-media-test',
    },
  },
});
