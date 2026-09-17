import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app';
import { AuditLogModel } from '../src/modules/audit/audit.model';
import {
  bootstrapPlatformAdmin,
  changePlatformAdminPassword,
  setPlatformAdminStatus,
} from '../src/modules/platform/platform-admin.service';
import { UserModel } from '../src/modules/users/user.model';
import type { AuthContext } from '../src/types';
import {
  clearAuthData,
  connectTestDb,
  disconnectTestDb,
  insertOrganization,
  insertPlatformAdmin,
  insertUser,
} from './helpers';

const app = createApp();
const password = 'BootstrapSecret1!';
const email = 'wael@rivo.com';

function platformActor(userId: string): AuthContext {
  return {
    userId,
    organizationId: '',
    role: 'PLATFORM_ADMIN',
    campusIds: [],
    classroomIds: [],
    routeIds: [],
  };
}

describe('PLATFORM-002 bootstrap + platform auth', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearAuthData();
  });

  describe('bootstrap', () => {
    it('creates platform admin when none exists', async () => {
      const result = await bootstrapPlatformAdmin({ email, password });
      expect(result).toMatchObject({ status: 'created', email });

      const user = await UserModel.findOne({ email }).select('+passwordHash');
      expect(user).toBeTruthy();
      expect(user!.role).toBe('PLATFORM_ADMIN');
      expect(user!.organizationId).toBeNull();
      expect(user!.status).toBe('ACTIVE');
      expect(user!.mfaEnabled).toBe(false);
      expect(user!.passwordHash).toBeTruthy();
      expect(user!.passwordHash).not.toBe(password);
      expect(await bcrypt.compare(password, user!.passwordHash)).toBe(true);
      expect((user as unknown as { password?: string }).password).toBeUndefined();

      const audits = await AuditLogModel.find({ action: 'PLATFORM_ADMIN_CREATED' });
      expect(audits).toHaveLength(1);
      expect(audits[0].metadata).toEqual({ email });
    });

    it('is idempotent and does not overwrite an existing platform admin', async () => {
      await bootstrapPlatformAdmin({ email, password });
      const first = await UserModel.findOne({ email }).select('+passwordHash');
      const firstHash = first!.passwordHash;

      const second = await bootstrapPlatformAdmin({
        email: 'other@rivo.com',
        password: 'DifferentSecret9!',
      });
      expect(second).toEqual({
        status: 'already_exists',
        message: 'Platform admin already exists. No changes made.',
      });

      expect(await UserModel.countDocuments({ role: 'PLATFORM_ADMIN' })).toBe(1);
      const after = await UserModel.findOne({ email }).select('+passwordHash');
      expect(after!.passwordHash).toBe(firstHash);
      expect(await bcrypt.compare(password, after!.passwordHash)).toBe(true);
    });

    it('rejects missing credentials', async () => {
      await expect(bootstrapPlatformAdmin({ email: '', password: '' })).rejects.toMatchObject({
        statusCode: 422,
        code: 'VALIDATION_ERROR',
      });
    });
  });

  describe('authentication', () => {
    it('logs in platform admin with JWT that has no organizationId', async () => {
      await bootstrapPlatformAdmin({ email, password });

      const response = await request(app).post('/api/v1/auth/login').send({ email, password });
      expect(response.status).toBe(200);
      expect(response.body.user).toMatchObject({
        email,
        role: 'PLATFORM_ADMIN',
        organizationId: null,
      });
      expect(response.body.user.passwordHash).toBeUndefined();
      expect(JSON.stringify(response.body)).not.toContain(password);

      const payload = jwt.decode(response.body.accessToken) as jwt.JwtPayload;
      expect(payload.role).toBe('PLATFORM_ADMIN');
      expect(payload.organizationId).toBeUndefined();
      expect(Object.prototype.hasOwnProperty.call(payload, 'organizationId')).toBe(false);

      const loginAudits = await AuditLogModel.find({ action: 'PLATFORM_ADMIN_LOGIN' });
      expect(loginAudits).toHaveLength(1);

      const refreshed = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: response.body.refreshToken });
      expect(refreshed.status).toBe(200);
      expect(refreshed.body.accessToken).toEqual(expect.any(String));

      const logout = await request(app)
        .post('/api/v1/auth/logout')
        .send({ refreshToken: response.body.refreshToken });
      expect(logout.status).toBe(204);

      const afterLogout = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: response.body.refreshToken });
      expect(afterLogout.status).toBe(401);
    });

    it('rejects wrong password and inactive platform admin', async () => {
      const created = await bootstrapPlatformAdmin({ email, password });
      if (created.status !== 'created') {
        expect.fail('expected bootstrap to create platform admin');
      }

      const bad = await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password: 'wrong-password' });
      expect(bad.status).toBe(401);
      expect(JSON.stringify(bad.body)).not.toContain(password);
      expect(JSON.stringify(bad.body)).not.toContain('wrong-password');

      const failed = await AuditLogModel.find({ action: 'PLATFORM_ADMIN_LOGIN_FAILED' });
      expect(failed.length).toBeGreaterThanOrEqual(1);

      await setPlatformAdminStatus(created.userId, 'INACTIVE', platformActor(created.userId));
      const inactive = await request(app).post('/api/v1/auth/login').send({ email, password });
      expect(inactive.status).toBe(403);
      expect(inactive.body.error.code).toBe('ACCOUNT_INACTIVE');

      const disabled = await AuditLogModel.find({ action: 'PLATFORM_ADMIN_DISABLED' });
      expect(disabled).toHaveLength(1);
    });

    it('audits password change without storing plaintext', async () => {
      const created = await bootstrapPlatformAdmin({ email, password });
      if (created.status !== 'created') {
        expect.fail('expected bootstrap to create platform admin');
      }

      await changePlatformAdminPassword(
        created.userId,
        'NewSecretPass2!',
        platformActor(created.userId),
      );

      const changed = await AuditLogModel.find({ action: 'PLATFORM_ADMIN_PASSWORD_CHANGED' });
      expect(changed).toHaveLength(1);
      expect(JSON.stringify(changed[0].toObject())).not.toContain('NewSecretPass2!');

      const oldLogin = await request(app).post('/api/v1/auth/login').send({ email, password });
      expect(oldLogin.status).toBe(401);

      const newLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password: 'NewSecretPass2!' });
      expect(newLogin.status).toBe(200);
    });
  });

  describe('authorization', () => {
    it('allows platform admin on platform APIs and denies tenant roles', async () => {
      await bootstrapPlatformAdmin({ email, password });
      const platformLogin = await request(app).post('/api/v1/auth/login').send({ email, password });
      const platformToken = platformLogin.body.accessToken as string;

      const list = await request(app)
        .get('/api/v1/platform/organizations')
        .set('Authorization', `Bearer ${platformToken}`);
      expect(list.status).toBe(200);

      const org = await insertOrganization({ name: 'Ops School' });
      const roles = ['ADMIN', 'SUPERVISOR', 'TEACHER', 'DRIVER', 'GUARDIAN'] as const;
      for (const role of roles) {
        await insertUser({
          email: `${role.toLowerCase()}@school.example`,
          password,
          role,
          organizationId: org.id,
        });
        const tokenRes = await request(app)
          .post('/api/v1/auth/login')
          .send({ email: `${role.toLowerCase()}@school.example`, password });
        expect(tokenRes.status).toBe(200);
        const denied = await request(app)
          .get('/api/v1/platform/organizations')
          .set('Authorization', `Bearer ${tokenRes.body.accessToken}`);
        expect(denied.status).toBe(403);
      }

      const campuses = await request(app)
        .get('/api/v1/campuses')
        .set('Authorization', `Bearer ${platformToken}`);
      expect(campuses.status).toBe(403);
    });
  });

  describe('security', () => {
    it('does not log bootstrap secrets or passwords', async () => {
      const infoSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      try {
        await bootstrapPlatformAdmin({ email, password });
        await request(app).post('/api/v1/auth/login').send({ email, password });
        await request(app).post('/api/v1/auth/login').send({ email, password: 'bad' });

        const all = [...infoSpy.mock.calls, ...errorSpy.mock.calls, ...warnSpy.mock.calls]
          .flat()
          .map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg)))
          .join('\n');

        expect(all).not.toContain(password);
        expect(all).not.toContain('BootstrapSecret');
      } finally {
        infoSpy.mockRestore();
        errorSpy.mockRestore();
        warnSpy.mockRestore();
      }
    });

    it('does not authenticate against environment variables', async () => {
      process.env.PLATFORM_BOOTSTRAP_PASSWORD = 'EnvOnlyPassword1!';
      await insertPlatformAdmin({ email: 'ops@example.com', password: 'DbPassword1!' });

      const envLogin = await request(app).post('/api/v1/auth/login').send({
        email: 'ops@example.com',
        password: 'EnvOnlyPassword1!',
      });
      expect(envLogin.status).toBe(401);

      const dbLogin = await request(app).post('/api/v1/auth/login').send({
        email: 'ops@example.com',
        password: 'DbPassword1!',
      });
      expect(dbLogin.status).toBe(200);

      delete process.env.PLATFORM_BOOTSTRAP_PASSWORD;
    });
  });
});
