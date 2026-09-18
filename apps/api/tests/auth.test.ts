import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { env } from '../src/config/env';
import { clearAuthData, connectTestDb, disconnectTestDb, insertUser } from './helpers';

const app = createApp();

describe('auth', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearAuthData();
  });

  it('logs in with valid credentials and returns tokens without a password hash', async () => {
    const user = await insertUser({ email: 'teacher@example.com', password: 'Password123!' });

    const response = await request(app).post('/api/v1/auth/login').send({
      email: 'teacher@example.com',
      password: 'Password123!',
    });

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({
      id: user.id,
      organizationId: String(user.organizationId),
      firstName: 'John',
      lastName: 'Smith',
      email: 'teacher@example.com',
      role: 'TEACHER',
    });
    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.refreshToken).toEqual(expect.any(String));
    expect(response.body.user.passwordHash).toBeUndefined();
    expect(response.body.passwordHash).toBeUndefined();

    const payload = jwt.decode(response.body.accessToken) as jwt.JwtPayload;
    expect(payload.sub).toBe(user.id);
    expect(payload.organizationId).toBe(String(user.organizationId));
    expect(payload.role).toBe('TEACHER');
    expect(payload.type).toBe('access');
  });

  it('rejects an unknown email with a generic error', async () => {
    const response = await request(app).post('/api/v1/auth/login').send({
      email: 'missing@example.com',
      password: 'Password123!',
    });

    expect(response.status).toBe(401);
    expect(response.body.error).toEqual({
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password',
    });
  });

  it('rejects an invalid password with a generic error', async () => {
    await insertUser({ email: 'teacher@example.com', password: 'Password123!' });

    const response = await request(app).post('/api/v1/auth/login').send({
      email: 'teacher@example.com',
      password: 'wrong',
    });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('rejects an inactive user', async () => {
    await insertUser({
      email: 'teacher@example.com',
      password: 'Password123!',
      status: 'INACTIVE',
    });

    const response = await request(app).post('/api/v1/auth/login').send({
      email: 'teacher@example.com',
      password: 'Password123!',
    });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('ACCOUNT_INACTIVE');
  });

  it('returns 401 when /auth/me is called without a token', async () => {
    const response = await request(app).get('/api/v1/auth/me');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 for an invalid access token', async () => {
    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer not-a-token');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 for an expired access token', async () => {
    const user = await insertUser({ email: 'teacher@example.com', password: 'Password123!' });
    const expired = jwt.sign(
      {
        sub: user.id,
        organizationId: String(user.organizationId),
        role: 'TEACHER',
        type: 'access',
      },
      env.jwtAccessSecret,
      { expiresIn: '1ms' },
    );

    await new Promise((resolve) => setTimeout(resolve, 5));

    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${expired}`);

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('ACCESS_TOKEN_EXPIRED');
  });

  it('returns the current user for a valid access token', async () => {
    const user = await insertUser({ email: 'teacher@example.com', password: 'Password123!' });
    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'teacher@example.com',
      password: 'Password123!',
    });

    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${login.body.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: user.id,
      email: 'teacher@example.com',
      role: 'TEACHER',
    });
    expect(response.body.passwordHash).toBeUndefined();
  });

  it('rejects an access token for an inactive user', async () => {
    const user = await insertUser({
      email: 'teacher@example.com',
      password: 'Password123!',
      status: 'INACTIVE',
    });
    const token = jwt.sign(
      {
        sub: user.id,
        organizationId: String(user.organizationId),
        role: 'TEACHER',
        type: 'access',
      },
      env.jwtAccessSecret,
      { algorithm: 'HS256', expiresIn: '15m' },
    );

    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('issues a new access token from a valid refresh token', async () => {
    await insertUser({ email: 'teacher@example.com', password: 'Password123!' });
    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'teacher@example.com',
      password: 'Password123!',
    });

    const response = await request(app).post('/api/v1/auth/refresh').send({
      refreshToken: login.body.refreshToken,
    });

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toEqual(expect.any(String));

    const me = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${response.body.accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.email).toBe('teacher@example.com');
  });

  it('rejects an invalid refresh token', async () => {
    const response = await request(app).post('/api/v1/auth/refresh').send({
      refreshToken: 'not-a-token',
    });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_REFRESH_TOKEN');
  });

  it('rejects an expired refresh token', async () => {
    const user = await insertUser({ email: 'teacher@example.com', password: 'Password123!' });
    const expired = jwt.sign(
      {
        sub: user.id,
        organizationId: String(user.organizationId),
        role: 'TEACHER',
        type: 'refresh',
        jti: 'expired-jti',
      },
      env.jwtRefreshSecret,
      { expiresIn: '1ms' },
    );

    await new Promise((resolve) => setTimeout(resolve, 5));

    const response = await request(app).post('/api/v1/auth/refresh').send({
      refreshToken: expired,
    });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('REFRESH_TOKEN_EXPIRED');
  });

  it('rejects a revoked refresh token after logout', async () => {
    await insertUser({ email: 'teacher@example.com', password: 'Password123!' });
    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'teacher@example.com',
      password: 'Password123!',
    });

    const logout = await request(app).post('/api/v1/auth/logout').send({
      refreshToken: login.body.refreshToken,
    });
    expect(logout.status).toBe(204);

    const response = await request(app).post('/api/v1/auth/refresh').send({
      refreshToken: login.body.refreshToken,
    });
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_REFRESH_TOKEN');
  });

  it('changes password and revokes refresh sessions', async () => {
    await insertUser({ email: 'teacher@example.com', password: 'Password123!' });
    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'teacher@example.com',
      password: 'Password123!',
    });
    expect(login.status).toBe(200);

    const wrong = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .send({ currentPassword: 'wrong', newPassword: 'NewPassword1!' });
    expect(wrong.status).toBe(401);
    expect(wrong.body.error.code).toBe('INVALID_CURRENT_PASSWORD');

    const weak = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .send({ currentPassword: 'Password123!', newPassword: 'short' });
    expect(weak.status).toBe(422);
    expect(weak.body.error.code).toBe('PASSWORD_TOO_WEAK');

    const same = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .send({ currentPassword: 'Password123!', newPassword: 'Password123!' });
    expect(same.status).toBe(422);
    expect(same.body.error.code).toBe('PASSWORD_SAME_AS_CURRENT');

    const changed = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .send({ currentPassword: 'Password123!', newPassword: 'NewPassword1!' });
    expect(changed.status).toBe(204);

    const refresh = await request(app).post('/api/v1/auth/refresh').send({
      refreshToken: login.body.refreshToken,
    });
    expect(refresh.status).toBe(401);

    const oldLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'teacher@example.com',
      password: 'Password123!',
    });
    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'teacher@example.com',
      password: 'NewPassword1!',
    });
    expect(newLogin.status).toBe(200);
  });
});
