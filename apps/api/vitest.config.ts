import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    env: {
      NODE_ENV: 'test',
      PORT: '3000',
      MONGODB_URI: 'mongodb://localhost:27017/digital-student-test',
      REDIS_URL: 'redis://localhost:6379',
    },
  },
});
