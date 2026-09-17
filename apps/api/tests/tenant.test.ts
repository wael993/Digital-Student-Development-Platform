import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { env } from '../src/config/env';
import {
  clearAuthData,
  connectTestDb,
  disconnectTestDb,
  insertOrganization,
  insertUser,
  setOrganizationStatus,
} from './helpers';

const app = createApp();
const password = 'Password123!';

async function login(email: string): Promise<string> {
  const response = await request(app).post('/api/v1/auth/login').send({ email, password });
  expect(response.status).toBe(200);
  return response.body.accessToken as string;
}

describe('tenant isolation and RBAC', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearAuthData();
  });

  it('returns 401 for unauthenticated, invalid, and expired tokens', async () => {
    const missing = await request(app).get('/api/v1/campuses');
    expect(missing.status).toBe(401);
    expect(missing.body.error).toEqual({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    });

    const invalid = await request(app)
      .get('/api/v1/campuses')
      .set('Authorization', 'Bearer not-a-token');
    expect(invalid.status).toBe(401);
    expect(invalid.body.error.code).toBe('UNAUTHORIZED');

    const user = await insertUser({ email: 'teacher.a@example.com', password });
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

    const expiredRes = await request(app)
      .get('/api/v1/campuses')
      .set('Authorization', `Bearer ${expired}`);
    expect(expiredRes.status).toBe(401);
    expect(expiredRes.body.error.code).toBe('ACCESS_TOKEN_EXPIRED');
  });

  it('exposes tenant context from the authenticated user, not client input', async () => {
    const orgA = await insertOrganization({ name: 'Nursery A' });
    const orgB = await insertOrganization({ name: 'Nursery B' });
    const teacher = await insertUser({
      email: 'teacher.a@example.com',
      password,
      organizationId: orgA.id,
      role: 'TEACHER',
    });
    const token = await login('teacher.a@example.com');

    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Organization-Id', orgB.id)
      .query({ organizationId: orgB.id });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: teacher.id,
      organizationId: orgA.id,
      role: 'TEACHER',
    });
  });

  it('rejects a JWT whose organizationId does not match the user row', async () => {
    const orgA = await insertOrganization({ name: 'Nursery A' });
    const orgB = await insertOrganization({ name: 'Nursery B' });
    const teacher = await insertUser({
      email: 'teacher.a@example.com',
      password,
      organizationId: orgA.id,
    });
    const forged = jwt.sign(
      {
        sub: teacher.id,
        organizationId: orgB.id,
        role: 'TEACHER',
        type: 'access',
      },
      env.jwtAccessSecret,
      { algorithm: 'HS256', expiresIn: '15m' },
    );

    const response = await request(app)
      .get('/api/v1/campuses')
      .set('Authorization', `Bearer ${forged}`);

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 403 when an authenticated role lacks permission', async () => {
    const org = await insertOrganization({ name: 'Nursery A' });
    await insertUser({
      email: 'teacher.a@example.com',
      password,
      organizationId: org.id,
      role: 'TEACHER',
    });
    await insertUser({
      email: 'admin.a@example.com',
      password,
      organizationId: org.id,
      role: 'ADMIN',
    });

    const teacherToken = await login('teacher.a@example.com');
    const forbidden = await request(app)
      .patch('/api/v1/organizations/current')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ name: 'Hacked' });

    expect(forbidden.status).toBe(403);
    expect(forbidden.body.error).toEqual({
      code: 'FORBIDDEN',
      message: 'You do not have permission to perform this action',
    });

    const adminToken = await login('admin.a@example.com');
    const allowed = await request(app)
      .patch('/api/v1/organizations/current')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Nursery A Updated', organizationId: 'org-b' });

    expect(allowed.status).toBe(200);
    expect(allowed.body).toMatchObject({ id: org.id, name: 'Nursery A Updated' });
  });

  it('keeps Organization A from reading, updating, or deleting Organization B resources', async () => {
    const orgA = await insertOrganization({ name: 'Nursery A' });
    const orgB = await insertOrganization({ name: 'Nursery B' });
    await insertUser({
      email: 'admin.a@example.com',
      password,
      organizationId: orgA.id,
      role: 'ADMIN',
    });
    await insertUser({
      email: 'admin.b@example.com',
      password,
      organizationId: orgB.id,
      role: 'ADMIN',
    });

    const tokenA = await login('admin.a@example.com');
    const tokenB = await login('admin.b@example.com');

    const createdB = await request(app)
      .post('/api/v1/campuses')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ name: 'Org B campus' });
    expect(createdB.status).toBe(201);
    const campusBId = createdB.body.id as string;

    const createdA = await request(app)
      .post('/api/v1/campuses')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('X-Organization-Id', orgB.id)
      .send({ name: 'Org A campus', organizationId: orgB.id });
    expect(createdA.status).toBe(201);
    expect(createdA.body.organizationId).toBe(orgA.id);

    const listWithQuery = await request(app)
      .get('/api/v1/campuses')
      .set('Authorization', `Bearer ${tokenA}`)
      .query({ organizationId: orgB.id });
    expect(listWithQuery.status).toBe(200);
    expect(listWithQuery.body.data).toHaveLength(1);
    expect(listWithQuery.body.data[0].id).toBe(createdA.body.id);

    const crossGet = await request(app)
      .get(`/api/v1/campuses/${campusBId}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(crossGet.status).toBe(404);
    expect(crossGet.body.error.code).toBe('NOT_FOUND');

    const crossPatch = await request(app)
      .patch(`/api/v1/campuses/${campusBId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Hijacked', organizationId: orgB.id });
    expect(crossPatch.status).toBe(404);

    const stillB = await request(app)
      .get(`/api/v1/campuses/${campusBId}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(stillB.status).toBe(200);
    expect(stillB.body.name).toBe('Org B campus');
  });

  it('rejects login when the organization is inactive', async () => {
    const org = await insertOrganization({ name: 'Closed', status: 'INACTIVE' });
    await insertUser({
      email: 'admin.a@example.com',
      password,
      organizationId: org.id,
      role: 'ADMIN',
    });

    const response = await request(app).post('/api/v1/auth/login').send({
      email: 'admin.a@example.com',
      password,
    });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('TENANT_INACTIVE');
  });

  it('ignores a forged JWT role and still uses the user row', async () => {
    const org = await insertOrganization({ name: 'Nursery A' });
    const teacher = await insertUser({
      email: 'teacher.a@example.com',
      password,
      organizationId: org.id,
      role: 'TEACHER',
    });
    const forged = jwt.sign(
      {
        sub: teacher.id,
        organizationId: org.id,
        role: 'ADMIN',
        type: 'access',
      },
      env.jwtAccessSecret,
      { algorithm: 'HS256', expiresIn: '15m' },
    );

    const response = await request(app)
      .patch('/api/v1/organizations/current')
      .set('Authorization', `Bearer ${forged}`)
      .send({ name: 'Hacked' });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
  });

  it('returns 403 for a valid token after the organization is deactivated', async () => {
    const org = await insertOrganization({ name: 'Nursery A' });
    await insertUser({
      email: 'admin.a@example.com',
      password,
      organizationId: org.id,
      role: 'ADMIN',
    });
    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'admin.a@example.com',
      password,
    });
    expect(loginRes.status).toBe(200);
    const accessToken = loginRes.body.accessToken as string;
    const refreshToken = loginRes.body.refreshToken as string;

    await setOrganizationStatus(org.id, 'INACTIVE');

    const probe = await request(app)
      .get('/api/v1/campuses')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(probe.status).toBe(403);
    expect(probe.body.error.code).toBe('TENANT_INACTIVE');

    const me = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(me.status).toBe(403);

    const refreshed = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });
    expect(refreshed.status).toBe(403);
    expect(refreshed.body.error.code).toBe('TENANT_INACTIVE');
  });

  it('returns 404 for an invalid resource id', async () => {
    const org = await insertOrganization({ name: 'Nursery A' });
    await insertUser({
      email: 'admin.a@example.com',
      password,
      organizationId: org.id,
      role: 'ADMIN',
    });
    const token = await login('admin.a@example.com');

    const response = await request(app)
      .get('/api/v1/campuses/not-an-id')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
