import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { StudentEventModel } from '../src/modules/journey/student-event.model';
import { calendarDateInTimeZone, utcRangeForCalendarDate } from '../src/utils/timezone';
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

async function login(email: string): Promise<string> {
  const response = await request(app).post('/api/v1/auth/login').send({ email, password });
  expect(response.status).toBe(200);
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
  guardian: { email: string; organizationId: string; firstName?: string; lastName?: string },
) {
  const user = await insertUser({
    email: guardian.email,
    password,
    organizationId: guardian.organizationId,
    role: 'GUARDIAN',
    firstName: guardian.firstName ?? 'Sarah',
    lastName: guardian.lastName ?? 'Smith',
  });
  const linked = await request(app)
    .post(`/api/v1/students/${studentId}/guardians`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ userId: user.id, relationship: 'MOTHER', isPrimary: true });
  expect(linked.status).toBe(201);
  return { user, token: await login(user.email) };
}

function assertNoSecrets(body: unknown): void {
  const serialized = JSON.stringify(body);
  expect(serialized).not.toContain('qrToken');
  expect(serialized).not.toContain('passwordHash');
  expect(serialized).not.toContain('recordedBy');
  expect(serialized).not.toContain('scannedBy');
}

describe('parent dashboard', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearAuthData();
  });

  it('lists only the authenticated guardian’s active children and ignores client guardian ids', async () => {
    const { org, campus, classroom, student, token } = await setupOrg('Parent A');
    const second = await insertStudent(org.id, {
      campusId: campus.id,
      classroomId: classroom.id,
      firstName: 'Noah',
      lastName: 'Smith',
      studentNumber: 'A-002',
      qrToken: 'noah-token-00000000000000000000000'.slice(0, 32),
    });
    const inactive = await insertStudent(org.id, {
      campusId: campus.id,
      classroomId: classroom.id,
      firstName: 'Mia',
      lastName: 'Smith',
      studentNumber: 'A-003',
      qrToken: 'mia-token-000000000000000000000000'.slice(0, 32),
    });
    await request(app)
      .patch(`/api/v1/students/${inactive.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'INACTIVE' });

    const { token: guardianToken } = await linkGuardian(token, student.id, {
      email: 'parent.sarah@example.com',
      organizationId: org.id,
    });
    await request(app)
      .post(`/api/v1/students/${second.id}/guardians`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'parent.sarah@example.com',
        relationship: 'MOTHER',
      });
    await request(app)
      .post(`/api/v1/students/${inactive.id}/guardians`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'parent.sarah@example.com',
        relationship: 'MOTHER',
      });

    const other = await insertStudent(org.id, {
      campusId: campus.id,
      classroomId: classroom.id,
      firstName: 'Liam',
      lastName: 'Jones',
      studentNumber: 'A-004',
      qrToken: 'liam-token-00000000000000000000000'.slice(0, 32),
    });
    const { user: otherGuardian } = await linkGuardian(token, other.id, {
      email: 'parent.other@example.com',
      organizationId: org.id,
      firstName: 'Pat',
    });

    const res = await request(app)
      .get('/api/v1/parent/children')
      .query({ guardianUserId: otherGuardian.id })
      .set('Authorization', `Bearer ${guardianToken}`);

    expect(res.status).toBe(200);
    expect(res.body.items.map((row: { firstName: string }) => row.firstName)).toEqual([
      'Emma',
      'Noah',
    ]);
    expect(res.body.items[0]).toMatchObject({
      id: student.id,
      firstName: 'Emma',
      lastName: 'Smith',
      studentNumber: student.studentNumber,
      status: 'ACTIVE',
      classroom: { id: classroom.id, name: 'Nursery A' },
    });
    expect(res.body.items[0]).not.toHaveProperty('organizationId');
    expect(res.body.items[0]).not.toHaveProperty('qrToken');
    expect(res.body.items[0]).not.toHaveProperty('guardians');
    assertNoSecrets(res.body);
  });

  it('returns an empty children list when the guardian has no active students', async () => {
    const { org } = await setupOrg('Parent A');
    const guardian = await insertUser({
      email: 'parent.empty@example.com',
      password,
      organizationId: org.id,
      role: 'GUARDIAN',
      firstName: 'Sarah',
    });
    const guardianToken = await login(guardian.email);

    const res = await request(app)
      .get('/api/v1/parent/children')
      .set('Authorization', `Bearer ${guardianToken}`);
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
  });

  it('returns dashboard attendance and current journey state for a linked child', async () => {
    const { org, student, token } = await setupOrg('Parent A');
    const { token: guardianToken } = await linkGuardian(token, student.id, {
      email: 'parent.sarah@example.com',
      organizationId: org.id,
    });

    const scanned = await request(app)
      .post('/api/v1/attendance/scan')
      .set('Authorization', `Bearer ${token}`)
      .send({ qrToken: student.qrToken });
    expect(scanned.status).toBe(201);
    const scannedAt = new Date(scanned.body.attendance.scannedAt as string).getTime();

    const arrived = await request(app)
      .post(`/api/v1/students/${student.id}/events`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        eventType: 'SCHOOL_ARRIVAL',
        occurredAt: new Date(scannedAt + 5 * 60_000).toISOString(),
      });
    expect(arrived.status).toBe(201);

    const started = await request(app)
      .post(`/api/v1/students/${student.id}/events`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        eventType: 'CLASS_STARTED',
        occurredAt: new Date(scannedAt + 10 * 60_000).toISOString(),
      });
    expect(started.status).toBe(201);

    const dashboard = await request(app)
      .get(`/api/v1/parent/children/${student.id}/dashboard`)
      .set('Authorization', `Bearer ${guardianToken}`);

    expect(dashboard.status).toBe(200);
    expect(dashboard.body.student).toEqual({
      id: student.id,
      firstName: 'Emma',
      lastName: 'Smith',
      classroom: { id: expect.any(String), name: 'Nursery A' },
    });
    expect(dashboard.body.attendance).toEqual({
      status: 'PRESENT',
      recordedAt: scanned.body.attendance.scannedAt,
    });
    expect(dashboard.body.journey).toEqual({
      currentState: 'CLASS_STARTED',
      lastEventAt: started.body.occurredAt,
    });
    expect(dashboard.body.student).not.toHaveProperty('qrToken');
    expect(dashboard.body).not.toHaveProperty('organizationId');
    assertNoSecrets(dashboard.body);

    const journey = await request(app)
      .get(`/api/v1/parent/children/${student.id}/journey/today`)
      .set('Authorization', `Bearer ${guardianToken}`);
    expect(journey.status).toBe(200);
    expect(journey.body.student).toEqual({
      id: student.id,
      firstName: 'Emma',
      lastName: 'Smith',
    });
    expect(journey.body.currentState).toBe('CLASS_STARTED');
    expect(journey.body.events.map((row: { eventType: string }) => row.eventType)).toEqual([
      'ATTENDANCE_PRESENT',
      'SCHOOL_ARRIVAL',
      'CLASS_STARTED',
    ]);
    expect(journey.body.events[0]).toMatchObject({
      eventType: 'ATTENDANCE_PRESENT',
      source: 'QR',
    });
    expect(journey.body.events[0]).not.toHaveProperty('recordedBy');
    expect(journey.body.events[0]).not.toHaveProperty('metadata');
    expect(journey.body.events[0]).not.toHaveProperty('recordedAt');
    assertNoSecrets(journey.body);
  });

  it('does not invent attendance or journey state when nothing has been recorded', async () => {
    const { org, student, token } = await setupOrg('Parent A');
    const { token: guardianToken } = await linkGuardian(token, student.id, {
      email: 'parent.sarah@example.com',
      organizationId: org.id,
    });

    const dashboard = await request(app)
      .get(`/api/v1/parent/children/${student.id}/dashboard`)
      .set('Authorization', `Bearer ${guardianToken}`);
    expect(dashboard.status).toBe(200);
    expect(dashboard.body.attendance).toEqual({ status: 'NOT_RECORDED', recordedAt: null });
    expect(dashboard.body.journey).toEqual({ currentState: null, lastEventAt: null });

    const journey = await request(app)
      .get(`/api/v1/parent/children/${student.id}/journey/today`)
      .set('Authorization', `Bearer ${guardianToken}`);
    expect(journey.body.currentState).toBeNull();
    expect(journey.body.events).toEqual([]);
  });

  it('hides another guardian’s child, another tenant’s student, and inactive linked children', async () => {
    const a = await setupOrg('Parent A');
    const b = await setupOrg('Parent B');
    const otherChild = await insertStudent(a.org.id, {
      campusId: a.campus.id,
      classroomId: a.classroom.id,
      firstName: 'Liam',
      lastName: 'Jones',
      studentNumber: 'A-002',
      qrToken: 'other-child-token-000000000000000'.slice(0, 32),
    });
    const { token: guardianToken } = await linkGuardian(a.token, a.student.id, {
      email: 'parent.sarah@example.com',
      organizationId: a.org.id,
    });
    await linkGuardian(a.token, otherChild.id, {
      email: 'parent.pat@example.com',
      organizationId: a.org.id,
      firstName: 'Pat',
    });

    const own = await request(app)
      .get(`/api/v1/parent/children/${a.student.id}/dashboard`)
      .set('Authorization', `Bearer ${guardianToken}`);
    expect(own.status).toBe(200);

    const sibling = await request(app)
      .get(`/api/v1/parent/children/${otherChild.id}/dashboard`)
      .set('Authorization', `Bearer ${guardianToken}`);
    expect(sibling.status).toBe(404);
    expect(sibling.body.error.message).toBe('Not Found');
    expect(JSON.stringify(sibling.body)).not.toContain(b.org.id);

    const otherOrg = await request(app)
      .get(`/api/v1/parent/children/${b.student.id}/journey/today`)
      .set('Authorization', `Bearer ${guardianToken}`);
    expect(otherOrg.status).toBe(404);
    expect(JSON.stringify(otherOrg.body)).not.toContain('Emma');
    expect(JSON.stringify(otherOrg.body)).not.toContain(b.org.id);

    await request(app)
      .patch(`/api/v1/students/${a.student.id}`)
      .set('Authorization', `Bearer ${a.token}`)
      .send({ status: 'INACTIVE' });
    const inactive = await request(app)
      .get(`/api/v1/parent/children/${a.student.id}/dashboard`)
      .set('Authorization', `Bearer ${guardianToken}`);
    expect(inactive.status).toBe(404);
  });

  it('rejects staff on parent routes, guardians creating events, writes, and invalid ids', async () => {
    const { org, classroom, student, token } = await setupOrg('Parent A');
    const { token: guardianToken } = await linkGuardian(token, student.id, {
      email: 'parent.sarah@example.com',
      organizationId: org.id,
    });
    const teacher = await insertUser({
      email: 'parent.teacher@example.com',
      password,
      organizationId: org.id,
      role: 'TEACHER',
      classroomIds: [classroom.id],
    });
    const teacherToken = await login(teacher.email);

    const staff = await request(app)
      .get('/api/v1/parent/children')
      .set('Authorization', `Bearer ${teacherToken}`);
    expect(staff.status).toBe(403);

    const create = await request(app)
      .post(`/api/v1/students/${student.id}/events`)
      .set('Authorization', `Bearer ${guardianToken}`)
      .send({ eventType: 'CLASS_STARTED' });
    expect(create.status).toBe(403);

    const write = await request(app)
      .post(`/api/v1/parent/children/${student.id}/dashboard`)
      .set('Authorization', `Bearer ${guardianToken}`)
      .send({ currentState: 'CLASS_STARTED' });
    expect(write.status).toBe(405);

    const invalid = await request(app)
      .get('/api/v1/parent/children/not-an-id/dashboard')
      .set('Authorization', `Bearer ${guardianToken}`);
    expect(invalid.status).toBe(404);

    const missing = await request(app)
      .get('/api/v1/parent/children/000000000000000000000000/journey/today')
      .set('Authorization', `Bearer ${guardianToken}`);
    expect(missing.status).toBe(404);

    const anonymous = await request(app).get('/api/v1/parent/children');
    expect(anonymous.status).toBe(401);
  });

  it('scopes today’s journey to the organization timezone', async () => {
    const { org, admin, student, token } = await setupOrg('Parent A');
    const { token: guardianToken } = await linkGuardian(token, student.id, {
      email: 'parent.sarah@example.com',
      organizationId: org.id,
    });

    const patched = await request(app)
      .patch('/api/v1/organizations/current')
      .set('Authorization', `Bearer ${token}`)
      .send({ timezone: 'Pacific/Auckland' });
    expect(patched.status).toBe(200);

    const tz = 'Pacific/Auckland';
    const today = calendarDateInTimeZone(new Date(), tz);
    const { start } = utcRangeForCalendarDate(today, tz);
    const inToday = new Date(start.getTime() + 60 * 60 * 1000);
    const beforeToday = new Date(start.getTime() - 60 * 60 * 1000);

    await StudentEventModel.create({
      organizationId: org.id,
      studentId: student.id,
      eventType: 'SCHOOL_ARRIVAL',
      occurredAt: beforeToday,
      recordedAt: beforeToday,
      recordedBy: admin.id,
      source: 'MANUAL',
      metadata: {},
    });
    await StudentEventModel.create({
      organizationId: org.id,
      studentId: student.id,
      eventType: 'CLASS_STARTED',
      occurredAt: inToday,
      recordedAt: inToday,
      recordedBy: admin.id,
      source: 'MANUAL',
      metadata: {},
    });

    const journey = await request(app)
      .get(`/api/v1/parent/children/${student.id}/journey/today`)
      .set('Authorization', `Bearer ${guardianToken}`);
    expect(journey.status).toBe(200);
    expect(journey.body.events.map((row: { eventType: string }) => row.eventType)).toEqual([
      'CLASS_STARTED',
    ]);
    expect(journey.body.currentState).toBe('CLASS_STARTED');
  });
});
