import request from 'supertest';
import sharp from 'sharp';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { StudentGuardianModel } from '../src/modules/guardians/guardian.model';
import { DeviceTokenModel } from '../src/modules/notifications/device-token.model';
import { NotificationModel } from '../src/modules/notifications/notification.model';
import { NotificationPreferencesModel } from '../src/modules/notifications/notification-preferences.model';
import { resetFcmSender, setFcmSender, type FcmSendResult } from '../src/modules/notifications/fcm/fcm.service';
import {
  flushNotificationJobs,
  resetNotificationQueue,
} from '../src/modules/notifications/jobs/notification.queue';
import {
  clearAuthData,
  connectTestDb,
  disconnectTestDb,
  insertCampus,
  insertClassroom,
  insertOrganization,
  insertStudent,
  insertUser,
} from './helpers';

const app = createApp();
const password = 'Password123!';

type FcmCall = { tokens: string[]; title: string; body: string; data: Record<string, string> };

let fcmCalls: FcmCall[] = [];
let fcmImpl: (input: FcmCall) => Promise<FcmSendResult> = succeedAll;

function succeedAll(input: FcmCall): Promise<FcmSendResult> {
  return Promise.resolve({
    successTokens: input.tokens,
    invalidTokens: [],
    retryableTokens: [],
  });
}

async function jpeg(): Promise<Buffer> {
  return sharp({
    create: { width: 16, height: 10, channels: 3, background: { r: 180, g: 40, b: 40 } },
  })
    .jpeg()
    .toBuffer();
}

async function login(email: string): Promise<string> {
  const response = await request(app).post('/api/v1/auth/login').send({ email, password });
  if (response.status !== 200) {
    throw new Error(`login failed for ${email}: ${response.status} ${JSON.stringify(response.body)}`);
  }
  return response.body.accessToken as string;
}

async function setupOrg(name: string) {
  const org = await insertOrganization({ name });
  const admin = await insertUser({
    email: `${name.replace(/\s+/g, '.').toLowerCase()}.admin@example.com`,
    password,
    organizationId: org.id,
    role: 'ADMIN',
    firstName: 'Ada',
    lastName: 'Admin',
  });
  const campus = await insertCampus(org.id);
  const classroom = await insertClassroom(org.id, campus.id);
  const student = await insertStudent(org.id, {
    campusId: campus.id,
    classroomId: classroom.id,
    firstName: 'Emma',
    lastName: 'Smith',
    studentNumber: `${name}-001`,
    qrToken: `${name}-token`.replace(/\s+/g, '').padEnd(32, '0').slice(0, 32),
  });
  return { org, admin, campus, classroom, student, token: await login(admin.email) };
}

async function linkGuardian(
  adminToken: string,
  studentId: string,
  guardian: { email: string; organizationId: string; firstName?: string },
) {
  const user = await insertUser({
    email: guardian.email,
    password,
    organizationId: guardian.organizationId,
    role: 'GUARDIAN',
    firstName: guardian.firstName ?? 'Sarah',
    lastName: 'Smith',
  });
  const linked = await request(app)
    .post(`/api/v1/students/${studentId}/guardians`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ userId: user.id, relationship: 'MOTHER', isPrimary: true });
  expect(linked.status).toBe(201);
  return { user, token: await login(user.email) };
}

describe('notifications', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearAuthData();
    resetNotificationQueue();
    fcmCalls = [];
    fcmImpl = succeedAll;
    setFcmSender(async (input) => {
      fcmCalls.push(input);
      return fcmImpl(input);
    });
  });

  afterAll(() => {
    resetFcmSender();
  });

  it('registers, replaces, and removes device tokens for the authenticated user', async () => {
    const { org, student, token } = await setupOrg('Notif Devices');
    const guardian = await linkGuardian(token, student.id, {
      email: 'sarah.devices@example.com',
      organizationId: org.id,
    });

    const created = await request(app)
      .post('/api/v1/notifications/devices')
      .set('Authorization', `Bearer ${guardian.token}`)
      .send({
        token: 'fcm-iphone',
        platform: 'IOS',
        deviceId: 'iphone-1',
        appVersion: '1.0.0',
        userId: '000000000000000000000000',
        organizationId: '000000000000000000000000',
      });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({
      token: 'fcm-iphone',
      platform: 'IOS',
      deviceId: 'iphone-1',
      status: 'ACTIVE',
    });
    expect(created.body).not.toHaveProperty('userId');
    expect(created.body).not.toHaveProperty('organizationId');

    const replaced = await request(app)
      .post('/api/v1/notifications/devices')
      .set('Authorization', `Bearer ${guardian.token}`)
      .send({ token: 'fcm-iphone-2', platform: 'IOS', deviceId: 'iphone-1' });
    expect(replaced.status).toBe(201);
    expect(replaced.body.token).toBe('fcm-iphone-2');
    expect(await DeviceTokenModel.countDocuments({ token: 'fcm-iphone' })).toBe(0);

    const ipad = await request(app)
      .post('/api/v1/notifications/devices')
      .set('Authorization', `Bearer ${guardian.token}`)
      .send({ token: 'fcm-ipad', platform: 'IOS', deviceId: 'ipad-1' });
    expect(ipad.status).toBe(201);
    expect(await DeviceTokenModel.countDocuments({ userId: guardian.user.id, status: 'ACTIVE' })).toBe(
      2,
    );

    const removed = await request(app)
      .delete('/api/v1/notifications/devices/iphone-1')
      .set('Authorization', `Bearer ${guardian.token}`);
    expect(removed.status).toBe(204);
    const phone = await DeviceTokenModel.findOne({ deviceId: 'iphone-1' });
    expect(phone?.status).toBe('INACTIVE');
  });

  it('returns default preferences and only patches supported fields', async () => {
    const { org, student, token } = await setupOrg('Notif Prefs');
    const guardian = await linkGuardian(token, student.id, {
      email: 'sarah.prefs@example.com',
      organizationId: org.id,
    });

    const initial = await request(app)
      .get('/api/v1/notifications/preferences')
      .set('Authorization', `Bearer ${guardian.token}`);
    expect(initial.status).toBe(200);
    expect(initial.body).toEqual({
      journeyUpdates: true,
      studentArrival: true,
      studentDeparture: true,
      homeDropoff: true,
      mediaAvailable: true,
    });

    const patched = await request(app)
      .patch('/api/v1/notifications/preferences')
      .set('Authorization', `Bearer ${guardian.token}`)
      .send({ studentArrival: false, quietHours: true, userId: 'nope' });
    expect(patched.status).toBe(200);
    expect(patched.body.studentArrival).toBe(false);
    expect(patched.body.mediaAvailable).toBe(true);
    expect(patched.body).not.toHaveProperty('quietHours');
  });

  it('creates journey notifications for authorized guardians and sends to every active device', async () => {
    const { org, student, token } = await setupOrg('Notif Journey');
    const sarah = await linkGuardian(token, student.id, {
      email: 'sarah.journey@example.com',
      organizationId: org.id,
    });
    const john = await insertUser({
      email: 'john.journey@example.com',
      password,
      organizationId: org.id,
      role: 'GUARDIAN',
      firstName: 'John',
    });
    const johnLink = await request(app)
      .post(`/api/v1/students/${student.id}/guardians`)
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: john.id, relationship: 'FATHER' });
    expect(johnLink.status).toBe(201);
    const johnToken = await login(john.email);

    await request(app)
      .post('/api/v1/notifications/devices')
      .set('Authorization', `Bearer ${sarah.token}`)
      .send({ token: 'sarah-phone', platform: 'IOS', deviceId: 's-phone' });
    await request(app)
      .post('/api/v1/notifications/devices')
      .set('Authorization', `Bearer ${sarah.token}`)
      .send({ token: 'sarah-tablet', platform: 'IOS', deviceId: 's-tablet' });
    await request(app)
      .post('/api/v1/notifications/devices')
      .set('Authorization', `Bearer ${johnToken}`)
      .send({ token: 'john-phone', platform: 'ANDROID', deviceId: 'j-phone' });

    const created = await request(app)
      .post(`/api/v1/students/${student.id}/events`)
      .set('Authorization', `Bearer ${token}`)
      .send({ eventType: 'SCHOOL_ARRIVAL' });
    expect(created.status).toBe(201);
    expect(fcmCalls).toHaveLength(0);

    const pending = await NotificationModel.find({ studentId: student.id });
    expect(pending).toHaveLength(2);
    expect(pending.every((row) => row.status === 'PENDING')).toBe(true);
    expect(pending[0]?.body).toBe('Emma has arrived at nursery.');

    await flushNotificationJobs();
    expect(fcmCalls).toHaveLength(2);
    const tokens = fcmCalls.flatMap((call) => call.tokens).sort();
    expect(tokens).toEqual(['john-phone', 'sarah-phone', 'sarah-tablet']);
    expect(JSON.stringify(fcmCalls)).not.toContain('qrToken');
    expect(JSON.stringify(fcmCalls)).not.toContain('storageKey');
    expect(fcmCalls[0]?.data.type).toBe('STUDENT_ARRIVAL');
    expect(fcmCalls[0]?.data.studentId).toBe(student.id);
    expect(fcmCalls[0]?.data.eventId).toBe(created.body.id);

    const sent = await NotificationModel.find({ studentId: student.id });
    expect(sent.every((row) => row.status === 'SENT')).toBe(true);
  });

  it('does not notify for non-important journey events or disabled preferences', async () => {
    const { org, student, token } = await setupOrg('Notif Skip');
    const guardian = await linkGuardian(token, student.id, {
      email: 'sarah.skip@example.com',
      organizationId: org.id,
    });
    await request(app)
      .patch('/api/v1/notifications/preferences')
      .set('Authorization', `Bearer ${guardian.token}`)
      .send({ studentDeparture: false });

    const classStarted = await request(app)
      .post(`/api/v1/students/${student.id}/events`)
      .set('Authorization', `Bearer ${token}`)
      .send({ eventType: 'CLASS_STARTED', occurredAt: new Date(Date.now() - 60_000).toISOString() });
    expect(classStarted.status).toBe(201);

    const departure = await request(app)
      .post(`/api/v1/students/${student.id}/events`)
      .set('Authorization', `Bearer ${token}`)
      .send({ eventType: 'BUS_DEPARTURE' });
    expect(departure.status).toBe(201);

    await flushNotificationJobs();
    expect(await NotificationModel.countDocuments({})).toBe(0);
    expect(fcmCalls).toHaveLength(0);
  });

  it('does not notify an unauthorized guardian or a guardian in another tenant', async () => {
    const a = await setupOrg('Notif Tenant A');
    const b = await setupOrg('Notif Tenant B');
    const emmaGuardian = await linkGuardian(a.token, a.student.id, {
      email: 'emma.guardian@example.com',
      organizationId: a.org.id,
    });
    const noah = await insertStudent(a.org.id, {
      campusId: a.campus.id,
      classroomId: a.classroom.id,
      firstName: 'Noah',
      lastName: 'Jones',
      studentNumber: 'Notif-noah',
      qrToken: 'noah-token'.padEnd(32, '0').slice(0, 32),
    });
    const noahGuardian = await linkGuardian(a.token, noah.id, {
      email: 'noah.guardian@example.com',
      organizationId: a.org.id,
      firstName: 'Alex',
    });
    const otherOrgGuardian = await linkGuardian(b.token, b.student.id, {
      email: 'other.org@example.com',
      organizationId: b.org.id,
    });

    await request(app)
      .post(`/api/v1/students/${a.student.id}/events`)
      .set('Authorization', `Bearer ${a.token}`)
      .send({ eventType: 'HOME_DROPOFF' });
    await flushNotificationJobs();

    const rows = await NotificationModel.find({});
    expect(rows).toHaveLength(1);
    expect(String(rows[0]?.userId)).toBe(emmaGuardian.user.id);
    expect(rows[0]?.body).toBe('Emma has arrived home.');

    const noahInbox = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${noahGuardian.token}`);
    expect(noahInbox.status).toBe(200);
    expect(noahInbox.body.data).toHaveLength(0);

    const otherInbox = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${otherOrgGuardian.token}`);
    expect(otherInbox.status).toBe(200);
    expect(otherInbox.body.data).toHaveLength(0);

    const stolen = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${emmaGuardian.token}`)
      .query({ userId: noahGuardian.user.id, organizationId: b.org.id });
    expect(stolen.body.data).toHaveLength(1);
    expect(stolen.body.data[0].studentId).toBe(a.student.id);
  });

  it('lets a parent read history, paginate, and mark a notification as read', async () => {
    const { org, student, token } = await setupOrg('Notif Inbox');
    const guardian = await linkGuardian(token, student.id, {
      email: 'sarah.inbox@example.com',
      organizationId: org.id,
    });

    await request(app)
      .post(`/api/v1/students/${student.id}/events`)
      .set('Authorization', `Bearer ${token}`)
      .send({ eventType: 'SCHOOL_ARRIVAL', occurredAt: new Date(Date.now() - 120_000).toISOString() });
    await request(app)
      .post(`/api/v1/students/${student.id}/events`)
      .set('Authorization', `Bearer ${token}`)
      .send({ eventType: 'HOME_DROPOFF' });
    await flushNotificationJobs();

    const page = await request(app)
      .get('/api/v1/notifications')
      .query({ page: 1, limit: 1 })
      .set('Authorization', `Bearer ${guardian.token}`);
    expect(page.status).toBe(200);
    expect(page.body.data).toHaveLength(1);
    expect(page.body.meta).toMatchObject({ page: 1, limit: 1, total: 2, unreadCount: 2 });
    expect(page.body.data[0].type).toBe('STUDENT_HOME_DROPOFF');

    const marked = await request(app)
      .patch(`/api/v1/notifications/${page.body.data[0].id}/read`)
      .set('Authorization', `Bearer ${guardian.token}`);
    expect(marked.status).toBe(200);
    expect(marked.body.status).toBe('READ');
    expect(marked.body.readAt).toBeTruthy();

    const after = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${guardian.token}`);
    expect(after.body.meta.unreadCount).toBe(1);
  });

  it('rejects creating notifications through the API and hides other users rows', async () => {
    const { org, student, token } = await setupOrg('Notif Authz');
    const owner = await linkGuardian(token, student.id, {
      email: 'owner@example.com',
      organizationId: org.id,
    });
    const stranger = await linkGuardian(token, student.id, {
      email: 'stranger@example.com',
      organizationId: org.id,
      firstName: 'Pat',
    });
    await request(app)
      .post(`/api/v1/students/${student.id}/events`)
      .set('Authorization', `Bearer ${token}`)
      .send({ eventType: 'SCHOOL_ARRIVAL' });

    const create = await request(app)
      .post('/api/v1/notifications')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ userId: stranger.user.id, type: 'STUDENT_ARRIVAL' });
    expect(create.status).toBe(404);

    const row = await NotificationModel.findOne({ userId: owner.user.id });
    const stolen = await request(app)
      .patch(`/api/v1/notifications/${row?.id}/read`)
      .set('Authorization', `Bearer ${stranger.token}`);
    expect(stolen.status).toBe(404);
  });

  it('deactivates invalid FCM tokens and retries retryable failures', async () => {
    const { org, student, token } = await setupOrg('Notif Fcm');
    const guardian = await linkGuardian(token, student.id, {
      email: 'sarah.fcm@example.com',
      organizationId: org.id,
    });
    await request(app)
      .post('/api/v1/notifications/devices')
      .set('Authorization', `Bearer ${guardian.token}`)
      .send({ token: 'dead-token', platform: 'ANDROID', deviceId: 'android-1' });
    await request(app)
      .post('/api/v1/notifications/devices')
      .set('Authorization', `Bearer ${guardian.token}`)
      .send({ token: 'live-token', platform: 'ANDROID', deviceId: 'android-2' });

    fcmImpl = async (input) => ({
      successTokens: input.tokens.filter((value) => value === 'live-token'),
      invalidTokens: input.tokens.filter((value) => value === 'dead-token'),
      retryableTokens: [],
    });

    await request(app)
      .post(`/api/v1/students/${student.id}/events`)
      .set('Authorization', `Bearer ${token}`)
      .send({ eventType: 'SCHOOL_ARRIVAL' });
    await flushNotificationJobs();

    const dead = await DeviceTokenModel.findOne({ token: 'dead-token' });
    expect(dead?.status).toBe('INACTIVE');
    const live = await DeviceTokenModel.findOne({ token: 'live-token' });
    expect(live?.status).toBe('ACTIVE');

    resetNotificationQueue();
    await NotificationPreferencesModel.deleteMany({});
    let attempts = 0;
    fcmImpl = async (input) => {
      attempts += 1;
      if (attempts < 3) {
        return { successTokens: [], invalidTokens: [], retryableTokens: input.tokens };
      }
      return { successTokens: input.tokens, invalidTokens: [], retryableTokens: [] };
    };

    const noah = await insertStudent(org.id, {
      campusId: (await insertCampus(org.id, 'Second')).id,
      classroomId: student.classroomId.toString(),
      firstName: 'Liam',
      lastName: 'Smith',
      studentNumber: 'retry-1',
      qrToken: 'retry-token'.padEnd(32, '0').slice(0, 32),
    });
    await StudentGuardianModel.create({
      organizationId: org.id,
      studentId: noah.id,
      userId: guardian.user.id,
      relationship: 'MOTHER',
      isPrimary: true,
      canPickup: true,
      receivesNotifications: true,
    });

    await request(app)
      .post(`/api/v1/students/${noah.id}/events`)
      .set('Authorization', `Bearer ${token}`)
      .send({ eventType: 'SCHOOL_ARRIVAL' });
    await flushNotificationJobs();
    expect(attempts).toBe(3);
    const retried = await NotificationModel.findOne({ studentId: noah.id });
    expect(retried?.status).toBe('SENT');
  });

  it('notifies authorized guardians when a photo is uploaded', async () => {
    const { org, student, token } = await setupOrg('Notif Media');
    const guardian = await linkGuardian(token, student.id, {
      email: 'sarah.media@example.com',
      organizationId: org.id,
    });
    await request(app)
      .post('/api/v1/notifications/devices')
      .set('Authorization', `Bearer ${guardian.token}`)
      .send({ token: 'media-phone', platform: 'IOS', deviceId: 'm-phone' });

    const file = await jpeg();
    const uploaded = await request(app)
      .post(`/api/v1/students/${student.id}/media`)
      .set('Authorization', `Bearer ${token}`)
      .field('mediaType', 'PHOTO')
      .attach('file', file, { filename: 'photo.jpg', contentType: 'image/jpeg' });
    expect(uploaded.status).toBe(201);

    await flushNotificationJobs();
    expect(fcmCalls).toHaveLength(1);
    expect(fcmCalls[0]?.title).toBe('New photo of Emma');
    expect(fcmCalls[0]?.body).toContain("Emma's nursery day");
    expect(fcmCalls[0]?.data.type).toBe('MEDIA_AVAILABLE');
    expect(fcmCalls[0]?.data.mediaId).toBe(uploaded.body.media.id);
    expect(JSON.stringify(fcmCalls[0]?.data)).not.toContain('http');
  });

  it('requires authentication for notification endpoints', async () => {
    const res = await request(app).get('/api/v1/notifications');
    expect(res.status).toBe(401);
  });
});
