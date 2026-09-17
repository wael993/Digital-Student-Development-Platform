import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { UserInvitationModel } from '../src/modules/invitations/invitation.model';
import { UserModel } from '../src/modules/users/user.model';
import {
  clearAuthData,
  connectTestDb,
  disconnectTestDb,
  insertCampus,
  insertClassroom,
  insertOrganization,
  insertPlatformAdmin,
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

describe('tenant users API', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearAuthData();
  });

  it('lists, creates, patches, disables, and enables users as tenant ADMIN', async () => {
    const org = await insertOrganization({ name: 'User School' });
    await insertUser({
      email: 'admin@users.example',
      password,
      role: 'ADMIN',
      organizationId: org.id,
    });
    const campus = await insertCampus(org.id, 'Main');
    const token = await login('admin@users.example');

    const created = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'teacher@users.example',
        firstName: 'Layla',
        lastName: 'Hassan',
        role: 'TEACHER',
        password: 'TeacherPass1!',
        invite: false,
      });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({
      email: 'teacher@users.example',
      role: 'TEACHER',
      status: 'ACTIVE',
    });
    expect(created.body.passwordHash).toBeUndefined();

    const supervisor = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'super@users.example',
        firstName: 'Sam',
        lastName: 'Super',
        role: 'SUPERVISOR',
        password: 'SuperPass1!',
        invite: false,
        campusIds: [campus.id],
      });
    expect(supervisor.status).toBe(201);
    expect(supervisor.body.campusIds).toEqual([campus.id]);

    const list = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.meta.total).toBeGreaterThanOrEqual(2);

    const userId = created.body.id as string;
    const patched = await request(app)
      .patch(`/api/v1/users/${userId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ firstName: 'Layla Updated' });
    expect(patched.status).toBe(200);
    expect(patched.body.firstName).toBe('Layla Updated');

    const disabled = await request(app)
      .post(`/api/v1/users/${userId}/disable`)
      .set('Authorization', `Bearer ${token}`);
    expect(disabled.status).toBe(200);
    expect(disabled.body.status).toBe('INACTIVE');

    const enabled = await request(app)
      .post(`/api/v1/users/${userId}/enable`)
      .set('Authorization', `Bearer ${token}`);
    expect(enabled.status).toBe(200);
    expect(enabled.body.status).toBe('ACTIVE');
  });

  it('rejects PLATFORM_ADMIN role on create', async () => {
    const org = await insertOrganization({ name: 'Role School' });
    await insertUser({
      email: 'admin@role.example',
      password,
      role: 'ADMIN',
      organizationId: org.id,
    });
    const token = await login('admin@role.example');

    const response = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'ops@role.example',
        firstName: 'Ops',
        lastName: 'Admin',
        role: 'PLATFORM_ADMIN',
        password: 'OpsPass1!',
        invite: false,
      });
    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('USER_ROLE_NOT_ALLOWED');
  });

  it('blocks tenant ADMIN from platform APIs and platform admin from users API', async () => {
    const org = await insertOrganization({ name: 'Boundary School' });
    await insertUser({
      email: 'admin@boundary.example',
      password,
      role: 'ADMIN',
      organizationId: org.id,
    });
    await insertPlatformAdmin({ email: 'ops@boundary.example', password });

    const adminToken = await login('admin@boundary.example');
    const platformDenied = await request(app)
      .get('/api/v1/platform/organizations')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(platformDenied.status).toBe(403);

    const platformToken = await login('ops@boundary.example');
    const usersDenied = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${platformToken}`);
    expect(usersDenied.status).toBe(403);
  });

  it('returns 404 for cross-tenant user GET', async () => {
    const orgA = await insertOrganization({ name: 'Org A' });
    const orgB = await insertOrganization({ name: 'Org B' });
    const userB = await insertUser({
      email: 'teacher@org-b.example',
      password,
      role: 'TEACHER',
      organizationId: orgB.id,
    });
    await insertUser({
      email: 'admin@org-a.example',
      password,
      role: 'ADMIN',
      organizationId: orgA.id,
    });
    const token = await login('admin@org-a.example');

    const response = await request(app)
      .get(`/api/v1/users/${userB.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(404);
  });

  it('creates and accepts a TEACHER invitation with classroom assignments', async () => {
    const org = await insertOrganization({ name: 'Invite School' });
    const campus = await insertCampus(org.id, 'Main');
    const classroom = await insertClassroom(org.id, campus.id, 'Room A');
    const admin = await insertUser({
      email: 'admin@invite.example',
      password,
      role: 'ADMIN',
      organizationId: org.id,
    });
    const token = await login('admin@invite.example');

    const invited = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'newteacher@invite.example',
        firstName: 'Nora',
        lastName: 'Ali',
        role: 'TEACHER',
        invite: true,
        classroomIds: [classroom.id],
      });
    expect(invited.status).toBe(201);
    expect(invited.body.invitation).toMatchObject({
      email: 'newteacher@invite.example',
      status: 'PENDING',
    });
    expect(invited.body.invitation.token).toBeUndefined();

    const stored = await UserInvitationModel.findById(invited.body.invitation.invitationId);
    expect(stored?.classroomIds.map(String)).toEqual([classroom.id]);

    const { createUserInvitation } = await import('../src/modules/invitations/invitation.service');
    await UserInvitationModel.deleteMany({ email: 'accept-teacher@invite.example' });
    const withToken = await createUserInvitation({
      actor: {
        userId: admin.id,
        organizationId: org.id,
        role: 'ADMIN',
        campusIds: [],
        classroomIds: [],
        routeIds: [],
      },
      organizationId: org.id,
      email: 'accept-teacher@invite.example',
      firstName: 'Accept',
      lastName: 'Teacher',
      role: 'TEACHER',
      classroomIds: [classroom.id],
    });

    const accepted = await request(app)
      .post(`/api/v1/platform/invitations/${withToken.token}/accept`)
      .send({ password: 'TeacherPass1!' });
    expect(accepted.status).toBe(200);
    expect(accepted.body.email).toBe('accept-teacher@invite.example');

    const user = await UserModel.findById(accepted.body.userId);
    expect(user?.role).toBe('TEACHER');
    expect(user?.classroomIds.map(String)).toEqual([classroom.id]);
  });

  it('blocks suspended tenant from users API', async () => {
    const org = await insertOrganization({ name: 'Suspended Users', status: 'ACTIVE' });
    await insertUser({
      email: 'admin@suspended-users.example',
      password,
      role: 'ADMIN',
      organizationId: org.id,
    });
    const token = await login('admin@suspended-users.example');
    await setOrganizationStatus(org.id, 'SUSPENDED');

    const response = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('TENANT_SUSPENDED');
  });
});
