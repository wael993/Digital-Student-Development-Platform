import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { StudentEventModel } from '../src/modules/journey/student-event.model';
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

function isoMinutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

describe('student journey events', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearAuthData();
  });

  it('creates a journey event from auth context and ignores client tenant fields', async () => {
    const { token, admin, student } = await setupOrg('Nursery A');
    const occurredAt = isoMinutesAgo(20);

    const res = await request(app)
      .post(`/api/v1/students/${student.id}/events`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        eventType: 'CLASS_STARTED',
        occurredAt,
        metadata: { note: 'Morning circle' },
        organizationId: 'should-be-ignored',
        recordedBy: 'should-be-ignored',
        studentId: 'should-be-ignored',
        source: 'QR',
      });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      eventType: 'CLASS_STARTED',
      occurredAt,
      source: 'MANUAL',
      metadata: { note: 'Morning circle' },
    });
    expect(res.body).not.toHaveProperty('organizationId');
    expect(res.body).not.toHaveProperty('recordedBy');
    expect(res.body.recordedAt).not.toBe(occurredAt);

    const stored = await StudentEventModel.findById(res.body.id);
    expect(stored).toMatchObject({
      eventType: 'CLASS_STARTED',
      source: 'MANUAL',
    });
    expect(String(stored?.organizationId)).toBe(student.organizationId.toString());
    expect(String(stored?.studentId)).toBe(student.id);
    expect(String(stored?.recordedBy)).toBe(admin.id);
  });

  it('rejects invalid event types, unknown students, and inactive students', async () => {
    const { token, student } = await setupOrg('Nursery A');

    const invalidType = await request(app)
      .post(`/api/v1/students/${student.id}/events`)
      .set('Authorization', `Bearer ${token}`)
      .send({ eventType: 'NAP_STARTED' });
    expect(invalidType.status).toBe(422);

    const unknown = await request(app)
      .post('/api/v1/students/000000000000000000000000/events')
      .set('Authorization', `Bearer ${token}`)
      .send({ eventType: 'CLASS_STARTED' });
    expect(unknown.status).toBe(404);

    const inactive = await request(app)
      .patch(`/api/v1/students/${student.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'INACTIVE' });
    expect(inactive.status).toBe(200);

    const onInactive = await request(app)
      .post(`/api/v1/students/${student.id}/events`)
      .set('Authorization', `Bearer ${token}`)
      .send({ eventType: 'CLASS_STARTED' });
    expect(onInactive.status).toBe(400);
    expect(onInactive.body.error.message).toBe('Student is not active');
  });

  it('blocks cross-tenant event creation and reads', async () => {
    const a = await setupOrg('Nursery A');
    const b = await setupOrg('Nursery B');

    const create = await request(app)
      .post(`/api/v1/students/${a.student.id}/events`)
      .set('Authorization', `Bearer ${b.token}`)
      .send({ eventType: 'CLASS_STARTED' });
    expect(create.status).toBe(404);

    await request(app)
      .post(`/api/v1/students/${a.student.id}/events`)
      .set('Authorization', `Bearer ${a.token}`)
      .send({ eventType: 'CLASS_STARTED', occurredAt: isoMinutesAgo(5) });

    const read = await request(app)
      .get(`/api/v1/students/${a.student.id}/journey/today`)
      .set('Authorization', `Bearer ${b.token}`);
    expect(read.status).toBe(404);

    const listed = await request(app)
      .get(`/api/v1/students/${a.student.id}/events`)
      .query({ organizationId: a.org.id })
      .set('Authorization', `Bearer ${b.token}`);
    expect(listed.status).toBe(404);
  });

  it('lets assigned teachers create events and hides unauthorized students', async () => {
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
      .post(`/api/v1/students/${student.id}/events`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ eventType: 'CLASS_STARTED', occurredAt: isoMinutesAgo(8) });
    expect(allowed.status).toBe(201);

    const busType = await request(app)
      .post(`/api/v1/students/${student.id}/events`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ eventType: 'BUS_BOARDING' });
    expect(busType.status).toBe(403);

    const blocked = await request(app)
      .post(`/api/v1/students/${otherStudent.id}/events`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ eventType: 'CLASS_STARTED' });
    expect(blocked.status).toBe(404);

    const unassigned = await insertUser({
      email: 'teacher.empty@example.com',
      password,
      organizationId: org.id,
      role: 'TEACHER',
    });
    const emptyToken = await login(unassigned.email);
    const emptyCreate = await request(app)
      .post(`/api/v1/students/${student.id}/events`)
      .set('Authorization', `Bearer ${emptyToken}`)
      .send({ eventType: 'CLASS_STARTED' });
    expect(emptyCreate.status).toBe(404);
  });

  it('lets a guardian read their child and blocks create plus other children', async () => {
    const { org, campus, classroom, student, token } = await setupOrg('Nursery A');
    const otherStudent = await insertStudent(org.id, {
      campusId: campus.id,
      classroomId: classroom.id,
      firstName: 'Liam',
      lastName: 'Jones',
      studentNumber: 'A-002',
      qrToken: 'other-child-token-000000000000000'.slice(0, 32),
    });
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

    await request(app)
      .post(`/api/v1/students/${student.id}/events`)
      .set('Authorization', `Bearer ${token}`)
      .send({ eventType: 'CLASS_STARTED', occurredAt: isoMinutesAgo(4) });

    const guardianToken = await login(guardian.email);
    const create = await request(app)
      .post(`/api/v1/students/${student.id}/events`)
      .set('Authorization', `Bearer ${guardianToken}`)
      .send({ eventType: 'CLASS_STARTED' });
    expect(create.status).toBe(403);

    const own = await request(app)
      .get(`/api/v1/students/${student.id}/journey/today`)
      .set('Authorization', `Bearer ${guardianToken}`);
    expect(own.status).toBe(200);
    expect(own.body.student.id).toBe(student.id);
    expect(own.body.events[0].eventType).toBe('CLASS_STARTED');
    expect(own.body.events[0]).not.toHaveProperty('recordedBy');

    const other = await request(app)
      .get(`/api/v1/students/${otherStudent.id}/events`)
      .set('Authorization', `Bearer ${guardianToken}`);
    expect(other.status).toBe(404);
  });

  it('returns the timeline in chronological order and derives currentState', async () => {
    const { token, student } = await setupOrg('Nursery A');

    const later = await request(app)
      .post(`/api/v1/students/${student.id}/events`)
      .set('Authorization', `Bearer ${token}`)
      .send({ eventType: 'CLASS_STARTED', occurredAt: isoMinutesAgo(5) });
    expect(later.status).toBe(201);

    const earlier = await request(app)
      .post(`/api/v1/students/${student.id}/events`)
      .set('Authorization', `Bearer ${token}`)
      .send({ eventType: 'SCHOOL_ARRIVAL', occurredAt: isoMinutesAgo(15) });
    expect(earlier.status).toBe(201);

    const today = await request(app)
      .get(`/api/v1/students/${student.id}/journey/today`)
      .set('Authorization', `Bearer ${token}`);
    expect(today.status).toBe(200);
    expect(today.body.student).toEqual({
      id: student.id,
      firstName: 'Emma',
      lastName: 'Smith',
    });
    expect(today.body.currentState).toBe('CLASS_STARTED');
    expect(today.body.events.map((row: { eventType: string }) => row.eventType)).toEqual([
      'SCHOOL_ARRIVAL',
      'CLASS_STARTED',
    ]);

    const listed = await request(app)
      .get(`/api/v1/students/${student.id}/events`)
      .set('Authorization', `Bearer ${token}`);
    expect(listed.body.data.map((row: { eventType: string }) => row.eventType)).toEqual([
      'SCHOOL_ARRIVAL',
      'CLASS_STARTED',
    ]);
  });

  it('rejects duplicate taps and obviously invalid transitions', async () => {
    const { token, student } = await setupOrg('Nursery A');

    const first = await request(app)
      .post(`/api/v1/students/${student.id}/events`)
      .set('Authorization', `Bearer ${token}`)
      .send({ eventType: 'CLASS_STARTED', occurredAt: isoMinutesAgo(3) });
    expect(first.status).toBe(201);

    const duplicate = await request(app)
      .post(`/api/v1/students/${student.id}/events`)
      .set('Authorization', `Bearer ${token}`)
      .send({ eventType: 'CLASS_STARTED', occurredAt: isoMinutesAgo(2) });
    expect(duplicate.status).toBe(409);

    const dropoff = await request(app)
      .post(`/api/v1/students/${student.id}/events`)
      .set('Authorization', `Bearer ${token}`)
      .send({ eventType: 'HOME_DROPOFF', occurredAt: isoMinutesAgo(1) });
    expect(dropoff.status).toBe(201);

    const afterHome = await request(app)
      .post(`/api/v1/students/${student.id}/events`)
      .set('Authorization', `Bearer ${token}`)
      .send({ eventType: 'BREAK_STARTED' });
    expect(afterHome.status).toBe(422);
  });

  it('records ATTENDANCE_PRESENT from a QR scan and does not duplicate it', async () => {
    const { token, student } = await setupOrg('Nursery A');

    const scanned = await request(app)
      .post('/api/v1/attendance/scan')
      .set('Authorization', `Bearer ${token}`)
      .send({ qrToken: student.qrToken });
    expect(scanned.status).toBe(201);

    const today = await request(app)
      .get(`/api/v1/students/${student.id}/journey/today`)
      .set('Authorization', `Bearer ${token}`);
    expect(today.body.currentState).toBe('ATTENDANCE_PRESENT');
    expect(today.body.events).toHaveLength(1);
    expect(today.body.events[0]).toMatchObject({
      eventType: 'ATTENDANCE_PRESENT',
      source: 'QR',
      metadata: { attendanceId: scanned.body.attendance.id },
    });

    const again = await request(app)
      .post('/api/v1/attendance/scan')
      .set('Authorization', `Bearer ${token}`)
      .send({ qrToken: student.qrToken });
    expect(again.status).toBe(200);
    expect(again.body.status).toBe('ALREADY_RECORDED');

    const after = await request(app)
      .get(`/api/v1/students/${student.id}/events`)
      .set('Authorization', `Bearer ${token}`);
    expect(after.body.data).toHaveLength(1);

    const manualAttendance = await request(app)
      .post(`/api/v1/students/${student.id}/events`)
      .set('Authorization', `Bearer ${token}`)
      .send({ eventType: 'ATTENDANCE_PRESENT' });
    expect(manualAttendance.status).toBe(422);
  });

  it('does not let drivers reach students until routes exist', async () => {
    const { org, student } = await setupOrg('Nursery A');
    const driver = await insertUser({
      email: 'driver.a@example.com',
      password,
      organizationId: org.id,
      role: 'DRIVER',
    });
    const driverToken = await login(driver.email);

    const create = await request(app)
      .post(`/api/v1/students/${student.id}/events`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ eventType: 'BUS_BOARDING' });
    expect(create.status).toBe(404);

    const read = await request(app)
      .get(`/api/v1/students/${student.id}/journey/today`)
      .set('Authorization', `Bearer ${driverToken}`);
    expect(read.status).toBe(404);
  });
});
