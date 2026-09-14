import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
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
  return { org, admin, token: await login(admin.email) };
}

describe('campuses, classrooms, students, guardians', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearAuthData();
  });

  it('lets an admin create, list, get, and update a campus and classroom', async () => {
    const { token, org } = await setupOrg('Nursery A');

    const campusRes = await request(app)
      .post('/api/v1/campuses')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Main Campus', organizationId: 'should-be-ignored' });
    expect(campusRes.status).toBe(201);
    expect(campusRes.body).toMatchObject({
      name: 'Main Campus',
      status: 'ACTIVE',
      organizationId: org.id,
    });

    const listed = await request(app)
      .get('/api/v1/campuses')
      .set('Authorization', `Bearer ${token}`);
    expect(listed.status).toBe(200);
    expect(listed.body.meta).toMatchObject({ page: 1, limit: 20, total: 1 });
    expect(listed.body.data[0].id).toBe(campusRes.body.id);

    const classroomRes = await request(app)
      .post('/api/v1/classrooms')
      .set('Authorization', `Bearer ${token}`)
      .send({ campusId: campusRes.body.id, name: 'Nursery A', level: 'NURSERY' });
    expect(classroomRes.status).toBe(201);
    expect(classroomRes.body).toMatchObject({
      name: 'Nursery A',
      level: 'NURSERY',
      campusId: campusRes.body.id,
      organizationId: org.id,
    });

    const filtered = await request(app)
      .get('/api/v1/classrooms')
      .query({ campusId: campusRes.body.id })
      .set('Authorization', `Bearer ${token}`);
    expect(filtered.body.data).toHaveLength(1);

    const patchedCampus = await request(app)
      .patch(`/api/v1/campuses/${campusRes.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'North Campus' });
    expect(patchedCampus.status).toBe(200);
    expect(patchedCampus.body.name).toBe('North Campus');

    const patchedClass = await request(app)
      .patch(`/api/v1/classrooms/${classroomRes.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Nursery B', level: 'KINDERGARTEN' });
    expect(patchedClass.body).toMatchObject({ name: 'Nursery B', level: 'KINDERGARTEN' });
  });

  it('rejects a classroom whose campus is missing or belongs to another organization', async () => {
    const a = await setupOrg('Nursery A');
    const b = await setupOrg('Nursery B');
    const campusB = await insertCampus(b.org.id, 'B Campus');

    const missing = await request(app)
      .post('/api/v1/classrooms')
      .set('Authorization', `Bearer ${a.token}`)
      .send({ campusId: new mongoose.Types.ObjectId().toString(), name: 'X', level: 'NURSERY' });
    expect(missing.status).toBe(422);

    const cross = await request(app)
      .post('/api/v1/classrooms')
      .set('Authorization', `Bearer ${a.token}`)
      .send({ campusId: campusB.id, name: 'X', level: 'NURSERY' });
    expect(cross.status).toBe(422);
    expect(cross.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('creates, lists, gets, updates, and searches students', async () => {
    const { token, org } = await setupOrg('Nursery A');
    const campus = await insertCampus(org.id);
    const classroom = await insertClassroom(org.id, campus.id);

    const created = await request(app)
      .post('/api/v1/students')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Sarah',
        lastName: 'Ahmed',
        dateOfBirth: '2022-03-12',
        gender: 'FEMALE',
        studentNumber: 'A-001',
        classroomId: classroom.id,
        organizationId: 'other-org',
      });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({
      firstName: 'Sarah',
      lastName: 'Ahmed',
      organizationId: org.id,
      campusId: campus.id,
      classroomId: classroom.id,
      status: 'ACTIVE',
    });
    expect(created.body.qrToken).toMatch(/^[a-f0-9]{32}$/);
    expect(created.body.qrToken).not.toContain('Sarah');

    const got = await request(app)
      .get(`/api/v1/students/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(got.status).toBe(200);
    expect(got.body.classroomName).toBe('Nursery A');

    const listed = await request(app)
      .get('/api/v1/students')
      .query({ classroomId: classroom.id })
      .set('Authorization', `Bearer ${token}`);
    expect(listed.body.data).toHaveLength(1);

    const search = await request(app)
      .get('/api/v1/students')
      .query({ search: 'Sarah' })
      .set('Authorization', `Bearer ${token}`);
    expect(search.body.data).toHaveLength(1);

    const missed = await request(app)
      .get('/api/v1/students')
      .query({ search: 'Nobody' })
      .set('Authorization', `Bearer ${token}`);
    expect(missed.body.data).toHaveLength(0);

    const patched = await request(app)
      .patch(`/api/v1/students/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'INACTIVE' });
    expect(patched.body.status).toBe('INACTIVE');
  });

  it('rejects an invalid classroom and a classroom from another organization', async () => {
    const a = await setupOrg('Nursery A');
    const b = await setupOrg('Nursery B');
    const campusB = await insertCampus(b.org.id);
    const classB = await insertClassroom(b.org.id, campusB.id, 'Other');

    const missing = await request(app)
      .post('/api/v1/students')
      .set('Authorization', `Bearer ${a.token}`)
      .send({
        firstName: 'Sarah',
        lastName: 'Ahmed',
        dateOfBirth: '2022-03-12',
        gender: 'FEMALE',
        studentNumber: 'A-001',
        classroomId: new mongoose.Types.ObjectId().toString(),
      });
    expect(missing.status).toBe(422);

    const cross = await request(app)
      .post('/api/v1/students')
      .set('Authorization', `Bearer ${a.token}`)
      .send({
        firstName: 'Sarah',
        lastName: 'Ahmed',
        dateOfBirth: '2022-03-12',
        gender: 'FEMALE',
        studentNumber: 'A-001',
        classroomId: classB.id,
      });
    expect(cross.status).toBe(422);
  });

  it('blocks cross-tenant student access and unauthorized roles', async () => {
    const a = await setupOrg('Nursery A');
    const b = await setupOrg('Nursery B');
    const campusA = await insertCampus(a.org.id);
    const classA = await insertClassroom(a.org.id, campusA.id);
    const student = await insertStudent(a.org.id, {
      campusId: campusA.id,
      classroomId: classA.id,
      studentNumber: 'A-001',
      qrToken: 'a'.repeat(32),
    });

    const cross = await request(app)
      .get(`/api/v1/students/${student.id}`)
      .set('Authorization', `Bearer ${b.token}`);
    expect(cross.status).toBe(404);

    await insertUser({
      email: 'driver.a@example.com',
      password,
      organizationId: a.org.id,
      role: 'DRIVER',
    });
    const driverToken = await login('driver.a@example.com');
    const createDenied = await request(app)
      .post('/api/v1/students')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        firstName: 'X',
        lastName: 'Y',
        dateOfBirth: '2022-03-12',
        gender: 'MALE',
        studentNumber: 'A-002',
        classroomId: classA.id,
      });
    expect(createDenied.status).toBe(403);

    const guardianDenied = await request(app)
      .post('/api/v1/campuses')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ name: 'Nope' });
    expect(guardianDenied.status).toBe(403);
  });

  it('restricts teachers to assigned classrooms and guardians to linked children', async () => {
    const { org, token } = await setupOrg('Nursery A');
    const campus = await insertCampus(org.id);
    const classA = await insertClassroom(org.id, campus.id, 'Nursery A');
    const classB = await insertClassroom(org.id, campus.id, 'Nursery B');
    const sarah = await insertStudent(org.id, {
      campusId: campus.id,
      classroomId: classA.id,
      firstName: 'Sarah',
      studentNumber: 'A-001',
      qrToken: 'b'.repeat(32),
    });
    const emma = await insertStudent(org.id, {
      campusId: campus.id,
      classroomId: classB.id,
      firstName: 'Emma',
      lastName: 'Jones',
      studentNumber: 'A-002',
      qrToken: 'c'.repeat(32),
    });

    const teacher = await insertUser({
      email: 'teacher.a@example.com',
      password,
      organizationId: org.id,
      role: 'TEACHER',
      classroomIds: [classA.id],
    });
    await request(app)
      .patch(`/api/v1/classrooms/${classA.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ teacherIds: [teacher.id] });

    const teacherToken = await login('teacher.a@example.com');
    const teacherList = await request(app)
      .get('/api/v1/students')
      .set('Authorization', `Bearer ${teacherToken}`);
    expect(teacherList.body.data.map((row: { firstName: string }) => row.firstName)).toEqual([
      'Sarah',
    ]);

    const teacherBlocked = await request(app)
      .get(`/api/v1/students/${emma.id}`)
      .set('Authorization', `Bearer ${teacherToken}`);
    expect(teacherBlocked.status).toBe(404);

    const unassigned = await insertUser({
      email: 'teacher.empty@example.com',
      password,
      organizationId: org.id,
      role: 'TEACHER',
    });
    const emptyToken = await login(unassigned.email);
    const emptyList = await request(app)
      .get('/api/v1/students')
      .set('Authorization', `Bearer ${emptyToken}`);
    expect(emptyList.body.data).toHaveLength(0);

    const guardian = await insertUser({
      email: 'guardian.a@example.com',
      password,
      organizationId: org.id,
      role: 'GUARDIAN',
      firstName: 'Gina',
      lastName: 'Guardian',
    });
    const linked = await request(app)
      .post(`/api/v1/students/${sarah.id}/guardians`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        userId: guardian.id,
        relationship: 'MOTHER',
        isPrimary: true,
      });
    expect(linked.status).toBe(201);

    const guardianToken = await login('guardian.a@example.com');
    const children = await request(app)
      .get('/api/v1/students')
      .set('Authorization', `Bearer ${guardianToken}`);
    expect(children.body.data).toHaveLength(1);
    expect(children.body.data[0].id).toBe(sarah.id);

    const otherChild = await request(app)
      .get(`/api/v1/students/${emma.id}`)
      .set('Authorization', `Bearer ${guardianToken}`);
    expect(otherChild.status).toBe(404);

    const campuses = await request(app)
      .get('/api/v1/campuses')
      .set('Authorization', `Bearer ${guardianToken}`);
    expect(campuses.status).toBe(403);
  });

  it('associates, lists, and removes guardian relationships without deleting the user', async () => {
    const { org, token } = await setupOrg('Nursery A');
    const campus = await insertCampus(org.id);
    const classroom = await insertClassroom(org.id, campus.id);
    const student = await insertStudent(org.id, {
      campusId: campus.id,
      classroomId: classroom.id,
      studentNumber: 'A-001',
      qrToken: 'd'.repeat(32),
    });

    const created = await request(app)
      .post(`/api/v1/students/${student.id}/guardians`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'mother@example.com',
        password,
        firstName: 'Nora',
        lastName: 'Ahmed',
        relationship: 'MOTHER',
        isPrimary: true,
      });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({
      relationship: 'MOTHER',
      isPrimary: true,
      email: 'mother@example.com',
    });

    const listed = await request(app)
      .get(`/api/v1/students/${student.id}/guardians`)
      .set('Authorization', `Bearer ${token}`);
    expect(listed.body.data).toHaveLength(1);

    const removed = await request(app)
      .delete(`/api/v1/students/${student.id}/guardians/${created.body.userId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(removed.status).toBe(204);

    const after = await request(app)
      .get(`/api/v1/students/${student.id}/guardians`)
      .set('Authorization', `Bearer ${token}`);
    expect(after.body.data).toHaveLength(0);

    const loginStillWorks = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'mother@example.com', password });
    expect(loginStillWorks.status).toBe(200);

    const relist = await request(app)
      .post(`/api/v1/students/${student.id}/guardians`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'mother@example.com',
        relationship: 'MOTHER',
      });
    expect(relist.status).toBe(201);
  });

  it('rejects cross-tenant guardian access', async () => {
    const a = await setupOrg('Nursery A');
    const b = await setupOrg('Nursery B');
    const campusA = await insertCampus(a.org.id);
    const classA = await insertClassroom(a.org.id, campusA.id);
    const studentA = await insertStudent(a.org.id, {
      campusId: campusA.id,
      classroomId: classA.id,
      studentNumber: 'A-001',
      qrToken: 'e'.repeat(32),
    });
    const guardianB = await insertUser({
      email: 'guardian.b@example.com',
      password,
      organizationId: b.org.id,
      role: 'GUARDIAN',
    });

    const crossLink = await request(app)
      .post(`/api/v1/students/${studentA.id}/guardians`)
      .set('Authorization', `Bearer ${a.token}`)
      .send({ userId: guardianB.id, relationship: 'OTHER' });
    expect(crossLink.status).toBe(422);

    const peek = await request(app)
      .get(`/api/v1/students/${studentA.id}/guardians`)
      .set('Authorization', `Bearer ${b.token}`);
    expect(peek.status).toBe(404);
  });
});
