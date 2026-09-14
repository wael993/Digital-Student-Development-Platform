import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { calendarDateInTimeZone, isDateOnly, utcRangeForCalendarDate } from '../src/utils/timezone';
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

describe('calendar date in organization timezone', () => {
  it('uses the organization timezone rather than UTC when the local date differs', () => {
    const at = new Date('2026-09-14T22:00:00.000Z');
    expect(calendarDateInTimeZone(at, 'UTC')).toBe('2026-09-14');
    expect(calendarDateInTimeZone(at, 'Pacific/Auckland')).toBe('2026-09-15');
    expect(calendarDateInTimeZone(at, 'America/Los_Angeles')).toBe('2026-09-14');
    expect(isDateOnly('2026-09-14')).toBe(true);
    expect(isDateOnly('2026-13-40')).toBe(false);
    const utcDay = utcRangeForCalendarDate('2026-09-14', 'UTC');
    expect(utcDay.start.toISOString()).toBe('2026-09-14T00:00:00.000Z');
    expect(utcDay.endExclusive.toISOString()).toBe('2026-09-15T00:00:00.000Z');
    const aucklandDay = utcRangeForCalendarDate('2026-09-14', 'Pacific/Auckland');
    expect(aucklandDay.start.toISOString()).toBe('2026-09-13T12:00:00.000Z');
    expect(aucklandDay.endExclusive.toISOString()).toBe('2026-09-14T12:00:00.000Z');
  });
});

describe('attendance scan and history', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearAuthData();
  });

  it('records PRESENT from a valid QR token using auth context, not client fields', async () => {
    const { token, admin, student } = await setupOrg('Nursery A');

    const res = await request(app)
      .post('/api/v1/attendance/scan')
      .set('Authorization', `Bearer ${token}`)
      .send({
        qrToken: student.qrToken,
        organizationId: 'should-be-ignored',
        studentId: 'should-be-ignored',
        scannedBy: 'should-be-ignored',
        scannedAt: '2020-01-01T00:00:00.000Z',
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('RECORDED');
    expect(res.body.attendance.attendanceType).toBe('PRESENT');
    expect(res.body.student).toEqual({
      id: student.id,
      firstName: 'Emma',
      lastName: 'Smith',
      studentNumber: student.studentNumber,
    });
    expect(res.body.student).not.toHaveProperty('qrToken');
    expect(res.body.student).not.toHaveProperty('dateOfBirth');
    expect(res.body.attendance.scannedAt).not.toBe('2020-01-01T00:00:00.000Z');

    const history = await request(app)
      .get('/api/v1/attendance')
      .set('Authorization', `Bearer ${token}`);
    expect(history.status).toBe(200);
    expect(history.body.meta.total).toBe(1);
    expect(history.body.data[0]).toMatchObject({
      id: res.body.attendance.id,
      attendanceType: 'PRESENT',
      scannedBy: admin.id,
      student: {
        id: student.id,
        firstName: 'Emma',
        lastName: 'Smith',
        studentNumber: student.studentNumber,
      },
    });
    expect(history.body.data[0].student).not.toHaveProperty('qrToken');
    expect(history.body.data[0].organizationId).toBeUndefined();
    expect(String(history.body.data[0].scannedBy)).toBe(admin.id);
    expect(history.body.data[0].student.organizationId).toBeUndefined();
  });

  it('returns ALREADY_RECORDED on a duplicate scan for the same local day', async () => {
    const { token, student } = await setupOrg('Nursery A');

    const first = await request(app)
      .post('/api/v1/attendance/scan')
      .set('Authorization', `Bearer ${token}`)
      .send({ qrToken: student.qrToken });
    expect(first.status).toBe(201);

    const second = await request(app)
      .post('/api/v1/attendance/scan')
      .set('Authorization', `Bearer ${token}`)
      .send({ qrToken: student.qrToken });
    expect(second.status).toBe(200);
    expect(second.body.status).toBe('ALREADY_RECORDED');
    expect(second.body.attendance.id).toBe(first.body.attendance.id);
    expect(second.body.attendance.scannedAt).toBe(first.body.attendance.scannedAt);

    const history = await request(app)
      .get('/api/v1/attendance')
      .set('Authorization', `Bearer ${token}`);
    expect(history.body.data).toHaveLength(1);
  });

  it('rejects missing, empty, and oversized QR tokens', async () => {
    const { token } = await setupOrg('Nursery A');

    const missing = await request(app)
      .post('/api/v1/attendance/scan')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(missing.status).toBe(422);

    const empty = await request(app)
      .post('/api/v1/attendance/scan')
      .set('Authorization', `Bearer ${token}`)
      .send({ qrToken: '   ' });
    expect(empty.status).toBe(422);

    const tooLong = await request(app)
      .post('/api/v1/attendance/scan')
      .set('Authorization', `Bearer ${token}`)
      .send({ qrToken: 'a'.repeat(65) });
    expect(tooLong.status).toBe(422);
  });

  it('returns 404 for an unknown token without leaking other-org students', async () => {
    const a = await setupOrg('Nursery A');
    const b = await setupOrg('Nursery B');

    const unknown = await request(app)
      .post('/api/v1/attendance/scan')
      .set('Authorization', `Bearer ${a.token}`)
      .send({ qrToken: 'missing-token-000000000000000' });
    expect(unknown.status).toBe(404);
    expect(unknown.body.error).toMatchObject({ code: 'NOT_FOUND', message: 'Student not found' });

    const cross = await request(app)
      .post('/api/v1/attendance/scan')
      .set('Authorization', `Bearer ${a.token}`)
      .send({ qrToken: b.student.qrToken });
    expect(cross.status).toBe(404);
    expect(cross.body.error.message).toBe('Student not found');
  });

  it('rejects inactive students and unauthorized roles', async () => {
    const { token, org, student } = await setupOrg('Nursery A');

    const inactive = await request(app)
      .patch(`/api/v1/students/${student.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'INACTIVE' });
    expect(inactive.status).toBe(200);

    const scanInactive = await request(app)
      .post('/api/v1/attendance/scan')
      .set('Authorization', `Bearer ${token}`)
      .send({ qrToken: student.qrToken });
    expect(scanInactive.status).toBe(400);
    expect(scanInactive.body.error.message).toBe('Student is not active');

    const guardian = await insertUser({
      email: 'guardian.a@example.com',
      password,
      organizationId: org.id,
      role: 'GUARDIAN',
    });
    const guardianToken = await login(guardian.email);
    const guardianScan = await request(app)
      .post('/api/v1/attendance/scan')
      .set('Authorization', `Bearer ${guardianToken}`)
      .send({ qrToken: student.qrToken });
    expect(guardianScan.status).toBe(403);

    const driver = await insertUser({
      email: 'driver.a@example.com',
      password,
      organizationId: org.id,
      role: 'DRIVER',
    });
    const driverToken = await login(driver.email);
    const driverScan = await request(app)
      .post('/api/v1/attendance/scan')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ qrToken: student.qrToken });
    expect(driverScan.status).toBe(403);

    const unauthenticated = await request(app)
      .post('/api/v1/attendance/scan')
      .send({ qrToken: student.qrToken });
    expect(unauthenticated.status).toBe(401);
  });

  it('lets assigned teachers scan and hides students outside their classrooms', async () => {
    const { org, campus, classroom, student } = await setupOrg('Nursery A');
    const otherClass = await insertClassroom(org.id, campus.id, 'Nursery B');
    const otherStudent = await insertStudent(org.id, {
      campusId: campus.id,
      classroomId: otherClass.id,
      firstName: 'Liam',
      lastName: 'Jones',
      studentNumber: 'A-002',
      qrToken: 'other-class-token-00000000000000'.slice(0, 32),
    });

    const teacher = await insertUser({
      email: 'teacher.a@example.com',
      password,
      organizationId: org.id,
      role: 'TEACHER',
      classroomIds: [classroom.id],
    });
    const teacherToken = await login(teacher.email);

    const allowed = await request(app)
      .post('/api/v1/attendance/scan')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ qrToken: student.qrToken });
    expect(allowed.status).toBe(201);
    expect(allowed.body.student.firstName).toBe('Emma');

    const blocked = await request(app)
      .post('/api/v1/attendance/scan')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ qrToken: otherStudent.qrToken });
    expect(blocked.status).toBe(404);
    expect(blocked.body.error.message).toBe('Student not found');

    const history = await request(app)
      .get('/api/v1/attendance')
      .set('Authorization', `Bearer ${teacherToken}`);
    expect(history.body.data).toHaveLength(1);
    expect(history.body.data[0].student.id).toBe(student.id);

    const otherClassHistory = await request(app)
      .get('/api/v1/attendance')
      .query({ classroomId: otherClass.id })
      .set('Authorization', `Bearer ${teacherToken}`);
    expect(otherClassHistory.body.data).toHaveLength(0);

    const unassigned = await insertUser({
      email: 'teacher.empty@example.com',
      password,
      organizationId: org.id,
      role: 'TEACHER',
    });
    const emptyToken = await login(unassigned.email);
    const emptyScan = await request(app)
      .post('/api/v1/attendance/scan')
      .set('Authorization', `Bearer ${emptyToken}`)
      .send({ qrToken: student.qrToken });
    expect(emptyScan.status).toBe(404);
    expect(emptyScan.body.error.message).toBe('Student not found');
  });

  it('lets a supervisor scan students on an assigned campus and stores the org timezone', async () => {
    const { org, token, campus, student } = await setupOrg('Nursery A');
    const patched = await request(app)
      .patch('/api/v1/organizations/current')
      .set('Authorization', `Bearer ${token}`)
      .send({ timezone: 'Pacific/Auckland' });
    expect(patched.status).toBe(200);
    expect(patched.body.timezone).toBe('Pacific/Auckland');

    const supervisor = await insertUser({
      email: 'supervisor.a@example.com',
      password,
      organizationId: org.id,
      role: 'SUPERVISOR',
      campusIds: [campus.id],
    });
    const supervisorToken = await login(supervisor.email);
    const scanned = await request(app)
      .post('/api/v1/attendance/scan')
      .set('Authorization', `Bearer ${supervisorToken}`)
      .send({ qrToken: student.qrToken });
    expect(scanned.status).toBe(201);

    const history = await request(app)
      .get('/api/v1/attendance')
      .set('Authorization', `Bearer ${supervisorToken}`);
    expect(history.body.data).toHaveLength(1);
    expect(history.body.data[0].student.id).toBe(student.id);
  });

  it('keeps attendance history inside the tenant and assigned campus', async () => {
    const a = await setupOrg('Nursery A');
    const b = await setupOrg('Nursery B');

    await request(app)
      .post('/api/v1/attendance/scan')
      .set('Authorization', `Bearer ${a.token}`)
      .send({ qrToken: a.student.qrToken });
    await request(app)
      .post('/api/v1/attendance/scan')
      .set('Authorization', `Bearer ${b.token}`)
      .send({ qrToken: b.student.qrToken });

    const listedA = await request(app)
      .get('/api/v1/attendance')
      .set('Authorization', `Bearer ${a.token}`);
    expect(listedA.body.data).toHaveLength(1);
    expect(listedA.body.data[0].student.id).toBe(a.student.id);

    const listedB = await request(app)
      .get('/api/v1/attendance')
      .query({ studentId: a.student.id, organizationId: a.org.id })
      .set('Authorization', `Bearer ${b.token}`);
    expect(listedB.body.data).toHaveLength(0);

    const otherCampus = await insertCampus(a.org.id, 'East Campus');
    const supervisor = await insertUser({
      email: 'supervisor.east@example.com',
      password,
      organizationId: a.org.id,
      role: 'SUPERVISOR',
      campusIds: [otherCampus.id],
    });
    const supervisorToken = await login(supervisor.email);
    const scoped = await request(app)
      .get('/api/v1/attendance')
      .set('Authorization', `Bearer ${supervisorToken}`);
    expect(scoped.body.data).toHaveLength(0);
  });

  it('does not expose a student QR token to a guardian', async () => {
    const { org, token, student } = await setupOrg('Nursery A');
    const guardian = await insertUser({
      email: 'guardian.a@example.com',
      password,
      organizationId: org.id,
      role: 'GUARDIAN',
    });
    await request(app)
      .post(`/api/v1/students/${student.id}/guardians`)
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: guardian.id, relationship: 'MOTHER', isPrimary: true });

    const guardianToken = await login(guardian.email);
    const child = await request(app)
      .get(`/api/v1/students/${student.id}`)
      .set('Authorization', `Bearer ${guardianToken}`);
    expect(child.status).toBe(200);
    expect(child.body).not.toHaveProperty('qrToken');
  });
});
