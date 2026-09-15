import { describe, expect, it } from 'vitest';
import { buildMongoUri, buildRedisUrl } from '../src/config/connection-urls';

describe('buildMongoUri', () => {
  it('prefers MONGODB_URI when set', () => {
    expect(
      buildMongoUri({
        MONGODB_URI: 'mongodb://localhost:27017/dev-platform',
        MONGODB_HOST: 'cluster0.example.mongodb.net',
        MONGODB_DATABASE: 'ignored',
      }),
    ).toBe('mongodb://localhost:27017/dev-platform');
  });

  it('builds an Atlas srv URI from split credentials', () => {
    expect(
      buildMongoUri({
        MONGODB_HOST: 'cluster0.rhq1nat.mongodb.net',
        MONGODB_DATABASE: 'dev-platform',
        MONGODB_USERNAME: 'waelman99_db_user',
        MONGODB_PASSWORD: 'secret',
      }),
    ).toBe(
      'mongodb+srv://waelman99_db_user:secret@cluster0.rhq1nat.mongodb.net/dev-platform?appName=Cluster0',
    );
  });

  it('accepts BUSINESS_PLATFORM_MONGO_DB_* aliases', () => {
    expect(
      buildMongoUri({
        MONGODB_HOST: 'cluster0.rhq1nat.mongodb.net',
        BUSINESS_PLATFORM_MONGO_DB_DATABASE_NAME: 'dev-platform',
        BUSINESS_PLATFORM_MONGO_DB_USERNAME: 'atlas-user',
        BUSINESS_PLATFORM_MONGO_DB_PASSWORD: 'p@ss',
      }),
    ).toBe(
      'mongodb+srv://atlas-user:p%40ss@cluster0.rhq1nat.mongodb.net/dev-platform?appName=Cluster0',
    );
  });
});

describe('buildRedisUrl', () => {
  it('returns empty when Redis is unset', () => {
    expect(buildRedisUrl({})).toBe('');
  });

  it('treats an explicit empty REDIS_URL as disabled', () => {
    expect(buildRedisUrl({ REDIS_URL: '', REDIS_HOST: 'example.com' })).toBe('');
  });

  it('prefers REDIS_URL when set', () => {
    expect(buildRedisUrl({ REDIS_URL: 'redis://localhost:6379', REDIS_HOST: 'ignored' })).toBe(
      'redis://localhost:6379',
    );
  });

  it('builds a URL from host, port, username, and password', () => {
    expect(
      buildRedisUrl({
        REDIS_HOST: 'view-bucket-ennobling-82863.db.redis.io',
        REDIS_PORT: '14528',
        REDIS_USERNAME: 'default',
        REDIS_PASSWORD: 'secret',
      }),
    ).toBe('redis://default:secret@view-bucket-ennobling-82863.db.redis.io:14528');
  });
});
