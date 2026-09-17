import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { AuditLogModel } from '../src/modules/audit/audit.model';
import { UserInvitationModel } from '../src/modules/invitations/invitation.model';
import { hashInviteToken } from '../src/modules/invitations/invitation.service';
import { OrganizationModel } from '../src/modules/organizations/organization.model';
import { UserModel } from '../src/modules/users/user.model';
import * as subscriptionService from '../src/modules/subscriptions/subscription.service';
import {
  clearAuthData,
  connectTestDb,
  disconnectTestDb,
  insertCampus,
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

describe('platform SaaS layer', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearAuthData();
  });

  it('allows PLATFORM_ADMIN to login without organizationId in the JWT', async () => {
    await insertPlatformAdmin({ email: 'ops@example.com', password });
    const response = await request(app).post('/api/v1/auth/login').send({
      email: 'ops@example.com',
      password,
    });
    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({
      email: 'ops@example.com',
      role: 'PLATFORM_ADMIN',
      organizationId: null,
    });
    expect(response.body.accessToken).toEqual(expect.any(String));

    const me = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${response.body.accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.role).toBe('PLATFORM_ADMIN');
    expect(me.body.organizationId).toBeNull();
  });

  it('creates a tenant with slug, plan fields, invitation, and audit log', async () => {
    await insertPlatformAdmin({ email: 'ops@example.com', password });
    const token = await login('ops@example.com');

    const response = await request(app)
      .post('/api/v1/platform/organizations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Al Noor Education Group',
        country: 'SA',
        timezone: 'Asia/Riyadh',
        defaultLanguage: 'ar',
        contactEmail: 'contact@alnoor.example',
        contactPhone: '+966511111111',
        planCode: 'STARTER',
        admin: {
          email: 'admin@alnoor.example',
          firstName: 'Ahmed',
          lastName: 'Ali',
        },
      });

    expect(response.status).toBe(201);
    expect(response.body.organization).toMatchObject({
      name: 'Al Noor Education Group',
      status: 'TRIAL',
      country: 'SA',
      planCode: 'STARTER',
      subscriptionStatus: 'TRIAL',
      contactEmail: 'contact@alnoor.example',
    });
    expect(response.body.organization.slug).toMatch(/al-noor/);
    expect(response.body.invitation).toMatchObject({
      email: 'admin@alnoor.example',
      token: expect.any(String),
    });

    const audits = await AuditLogModel.find({ action: 'TENANT_CREATED' });
    expect(audits).toHaveLength(1);
    expect(String(audits[0].organizationId)).toBe(response.body.organization.id);

    const inviteAudits = await AuditLogModel.find({ action: 'USER_INVITED' });
    expect(inviteAudits).toHaveLength(1);

    const stored = await UserInvitationModel.findById(response.body.invitation.invitationId);
    expect(stored?.tokenHash).toBe(hashInviteToken(response.body.invitation.token));
    expect(stored?.tokenHash).not.toBe(response.body.invitation.token);
  });

  it('accepts an invitation once, then rejects reuse and expired tokens', async () => {
    await insertPlatformAdmin({ email: 'ops@example.com', password });
    const token = await login('ops@example.com');

    const created = await request(app)
      .post('/api/v1/platform/organizations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Future School',
        country: 'SA',
        contactEmail: 'hello@future.example',
        planCode: 'PROFESSIONAL',
        admin: {
          email: 'admin@future.example',
          firstName: 'Sara',
          lastName: 'Nasser',
        },
      });
    expect(created.status).toBe(201);
    const inviteToken = created.body.invitation.token as string;
    const organizationId = created.body.organization.id as string;

    const accepted = await request(app)
      .post(`/api/v1/platform/invitations/${inviteToken}/accept`)
      .send({ password: 'AdminPass1!' });
    expect(accepted.status).toBe(200);
    expect(accepted.body).toMatchObject({
      email: 'admin@future.example',
      organizationId,
    });

    const user = await UserModel.findById(accepted.body.userId);
    expect(user?.role).toBe('ADMIN');
    expect(String(user?.organizationId)).toBe(organizationId);

    const reuse = await request(app)
      .post(`/api/v1/platform/invitations/${inviteToken}/accept`)
      .send({ password: 'AdminPass1!' });
    expect(reuse.status).toBe(409);
    expect(reuse.body.error.code).toBe('INVITATION_ALREADY_USED');

    const secondInvite = await request(app)
      .post(`/api/v1/platform/organizations/${organizationId}/admin-invitation`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'admin2@future.example',
        firstName: 'Omar',
        lastName: 'Hassan',
      });
    expect(secondInvite.status).toBe(201);

    await UserInvitationModel.updateOne(
      { _id: secondInvite.body.invitationId },
      { expiresAt: new Date(Date.now() - 60_000) },
    );

    const expired = await request(app)
      .post(`/api/v1/platform/invitations/${secondInvite.body.token}/accept`)
      .send({ password: 'AdminPass1!' });
    expect(expired.status).toBe(410);
    expect(expired.body.error.code).toBe('INVITATION_EXPIRED');
  });

  it('blocks tenant ADMIN from platform APIs and blocks platform from tenant campuses', async () => {
    const org = await insertOrganization({ name: 'School A' });
    await insertUser({
      email: 'admin@school-a.example',
      password,
      role: 'ADMIN',
      organizationId: org.id,
    });
    await insertPlatformAdmin({ email: 'ops@example.com', password });

    const adminToken = await login('admin@school-a.example');
    const denied = await request(app)
      .get('/api/v1/platform/organizations')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(denied.status).toBe(403);

    const platformToken = await login('ops@example.com');
    const campuses = await request(app)
      .get('/api/v1/campuses')
      .set('Authorization', `Bearer ${platformToken}`);
    expect(campuses.status).toBe(403);
  });

  it('activates, suspends, and deactivates tenants with audit records', async () => {
    await insertPlatformAdmin({ email: 'ops@example.com', password });
    const token = await login('ops@example.com');

    const created = await request(app)
      .post('/api/v1/platform/organizations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Lifecycle School',
        country: 'SA',
        contactEmail: 'life@example.com',
        planCode: 'STARTER',
      });
    const organizationId = created.body.organization.id as string;

    const activated = await request(app)
      .post(`/api/v1/platform/organizations/${organizationId}/activate`)
      .set('Authorization', `Bearer ${token}`);
    expect(activated.status).toBe(200);
    expect(activated.body.status).toBe('ACTIVE');

    const suspended = await request(app)
      .post(`/api/v1/platform/organizations/${organizationId}/suspend`)
      .set('Authorization', `Bearer ${token}`);
    expect(suspended.status).toBe(200);
    expect(suspended.body.status).toBe('SUSPENDED');

    const reactivated = await request(app)
      .post(`/api/v1/platform/organizations/${organizationId}/activate`)
      .set('Authorization', `Bearer ${token}`);
    expect(reactivated.status).toBe(200);
    expect(reactivated.body.status).toBe('ACTIVE');

    const deactivated = await request(app)
      .post(`/api/v1/platform/organizations/${organizationId}/deactivate`)
      .set('Authorization', `Bearer ${token}`);
    expect(deactivated.status).toBe(200);
    expect(deactivated.body.status).toBe('INACTIVE');

    const actions = await AuditLogModel.find({
      organizationId,
      action: { $in: ['TENANT_ACTIVATED', 'TENANT_SUSPENDED', 'TENANT_DEACTIVATED'] },
    });
    expect(actions.length).toBeGreaterThanOrEqual(3);
    expect(new Set(actions.map((a) => a.action))).toEqual(
      new Set(['TENANT_ACTIVATED', 'TENANT_SUSPENDED', 'TENANT_DEACTIVATED']),
    );
  });

  it('blocks suspended tenant users from login and tenant operations', async () => {
    const org = await insertOrganization({ name: 'Suspended School', status: 'ACTIVE' });
    await insertUser({
      email: 'admin@suspended.example',
      password,
      role: 'ADMIN',
      organizationId: org.id,
    });

    await setOrganizationStatus(org.id, 'SUSPENDED');

    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@suspended.example',
      password,
    });
    expect(loginRes.status).toBe(403);
    expect(loginRes.body.error.code).toBe('TENANT_SUSPENDED');

    await setOrganizationStatus(org.id, 'ACTIVE');
    const token = await login('admin@suspended.example');
    await setOrganizationStatus(org.id, 'SUSPENDED');

    const campuses = await request(app)
      .get('/api/v1/campuses')
      .set('Authorization', `Bearer ${token}`);
    expect(campuses.status).toBe(403);
    expect(campuses.body.error.code).toBe('TENANT_SUSPENDED');
  });

  it('preserves tenant data on suspend', async () => {
    const org = await insertOrganization({ name: 'Keep Data School' });
    await insertCampus(org.id, 'Main');
    await setOrganizationStatus(org.id, 'SUSPENDED');
    const stillThere = await OrganizationModel.findById(org.id);
    expect(stillThere?.status).toBe('SUSPENDED');
    expect(stillThere?.name).toBe('Keep Data School');
  });

  it('returns usage and enforces STARTER campus limits via SubscriptionService', async () => {
    await insertPlatformAdmin({ email: 'ops@example.com', password });
    const token = await login('ops@example.com');

    const created = await request(app)
      .post('/api/v1/platform/organizations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Limit School',
        country: 'SA',
        contactEmail: 'limit@example.com',
        planCode: 'STARTER',
        status: 'ACTIVE',
      });
    const organizationId = created.body.organization.id as string;

    await insertCampus(organizationId, 'Only Campus');
    expect(await subscriptionService.canCreateCampus(organizationId)).toBe(false);

    const usage = await request(app)
      .get(`/api/v1/platform/organizations/${organizationId}/usage`)
      .set('Authorization', `Bearer ${token}`);
    expect(usage.status).toBe(200);
    expect(usage.body.usage.campusCount).toBe(1);
    expect(usage.body.limits.maxCampuses).toBe(1);

    const admin = await insertUser({
      email: 'admin@limit.example',
      password,
      role: 'ADMIN',
      organizationId,
    });
    void admin;
    const adminToken = await login('admin@limit.example');
    const createCampus = await request(app)
      .post('/api/v1/campuses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Second Campus' });
    expect(createCampus.status).toBe(403);
    expect(createCampus.body.error.code).toBe('PLAN_LIMIT');
  });

  it('updates subscription fields on the organization', async () => {
    await insertPlatformAdmin({ email: 'ops@example.com', password });
    const token = await login('ops@example.com');

    const created = await request(app)
      .post('/api/v1/platform/organizations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Sub School',
        country: 'SA',
        contactEmail: 'sub@example.com',
        planCode: 'STARTER',
      });
    const organizationId = created.body.organization.id as string;

    const patched = await request(app)
      .patch(`/api/v1/platform/organizations/${organizationId}/subscription`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        planCode: 'ENTERPRISE',
        subscriptionStatus: 'ACTIVE',
      });
    expect(patched.status).toBe(200);
    expect(patched.body.planCode).toBe('ENTERPRISE');
    expect(patched.body.subscriptionStatus).toBe('ACTIVE');
    expect(patched.body.plan.features.aiAssistant).toBe(true);

    const audit = await AuditLogModel.findOne({ action: 'SUBSCRIPTION_CHANGED' });
    expect(audit).toBeTruthy();
  });

  it('filters organizations by status and q, and returns dashboard metrics', async () => {
    await insertPlatformAdmin({ email: 'ops@example.com', password });
    const token = await login('ops@example.com');

    await request(app)
      .post('/api/v1/platform/organizations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Alpha Academy',
        country: 'SA',
        contactEmail: 'alpha@filter.example',
        planCode: 'STARTER',
        status: 'TRIAL',
      });
    await request(app)
      .post('/api/v1/platform/organizations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Beta School',
        country: 'SA',
        contactEmail: 'beta@other.example',
        planCode: 'STARTER',
        status: 'ACTIVE',
      });

    const filtered = await request(app)
      .get('/api/v1/platform/organizations')
      .set('Authorization', `Bearer ${token}`)
      .query({ status: 'TRIAL', q: 'alpha' });
    expect(filtered.status).toBe(200);
    expect(filtered.body.data).toHaveLength(1);
    expect(filtered.body.data[0].name).toBe('Alpha Academy');
    expect(filtered.body.data[0].usage).toMatchObject({
      campusCount: expect.any(Number),
      studentCount: expect.any(Number),
      userCount: expect.any(Number),
    });

    const dashboard = await request(app)
      .get('/api/v1/platform/dashboard')
      .set('Authorization', `Bearer ${token}`);
    expect(dashboard.status).toBe(200);
    expect(dashboard.body.organizations.total).toBeGreaterThanOrEqual(2);
    expect(dashboard.body).toMatchObject({
      students: expect.any(Number),
      teachers: expect.any(Number),
      buses: expect.any(Number),
    });
  });

  it('rejects invalid organization status transitions', async () => {
    await insertPlatformAdmin({ email: 'ops@example.com', password });
    const token = await login('ops@example.com');

    const created = await request(app)
      .post('/api/v1/platform/organizations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Transition School',
        country: 'SA',
        contactEmail: 'trans@example.com',
        planCode: 'STARTER',
        status: 'INACTIVE',
      });
    const organizationId = created.body.organization.id as string;

    const invalid = await request(app)
      .post(`/api/v1/platform/organizations/${organizationId}/activate`)
      .set('Authorization', `Bearer ${token}`);
    expect(invalid.status).toBe(422);
    expect(invalid.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('does not create PLATFORM_ADMIN via invitation accept', async () => {
    const org = await insertOrganization({ name: 'Safe Invite Org' });
    await insertPlatformAdmin({ email: 'ops@example.com', password });
    const token = await login('ops@example.com');

    const invite = await request(app)
      .post(`/api/v1/platform/organizations/${org.id}/admin-invitation`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'newadmin@safe.example',
        firstName: 'New',
        lastName: 'Admin',
      });
    expect(invite.status).toBe(201);

    const accepted = await request(app)
      .post(`/api/v1/platform/invitations/${invite.body.token}/accept`)
      .send({ password: 'AdminPass1!' });
    expect(accepted.status).toBe(200);

    const user = await UserModel.findById(accepted.body.userId);
    expect(user?.role).toBe('ADMIN');
    expect(user?.organizationId).toBeTruthy();
  });
});
