import request from 'supertest';
import sharp from 'sharp';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { MediaModel } from '../src/modules/media/media.model';
import { processPhoto, sniffImageType } from '../src/modules/media/media.image';
import {
  isValidStorageSignature,
  requireLocalObjectStorage,
  signStorageAccess,
} from '../src/modules/media/storage/object-storage.service';
import { env } from '../src/config/env';
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

async function jpeg(width = 16, height = 10): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: { r: 180, g: 40, b: 40 } },
  })
    .jpeg()
    .toBuffer();
}

async function png(): Promise<Buffer> {
  return sharp({
    create: { width: 8, height: 8, channels: 3, background: { r: 20, g: 120, b: 40 } },
  })
    .png()
    .toBuffer();
}

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
  guardian: { email: string; organizationId: string },
) {
  const user = await insertUser({
    email: guardian.email,
    password,
    organizationId: guardian.organizationId,
    role: 'GUARDIAN',
    firstName: 'Sarah',
    lastName: 'Smith',
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
  expect(serialized).not.toContain('storageKey');
  expect(serialized).not.toContain('thumbnailStorageKey');
  expect(serialized).not.toContain('uploadedBy');
  expect(serialized).not.toContain('passwordHash');
}

async function uploadPhoto(
  token: string,
  studentId: string,
  file: Buffer,
  extra: { filename?: string; contentType?: string; fields?: Record<string, string> } = {},
) {
  const req = request(app)
    .post(`/api/v1/students/${studentId}/media`)
    .set('Authorization', `Bearer ${token}`)
    .field('mediaType', extra.fields?.mediaType ?? 'PHOTO');
  for (const [key, value] of Object.entries(extra.fields ?? {})) {
    if (key === 'mediaType') continue;
    req.field(key, value);
  }
  return req.attach('file', file, {
    filename: extra.filename ?? 'photo.jpg',
    contentType: extra.contentType ?? 'image/jpeg',
  });
}

describe('media', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearAuthData();
    await requireLocalObjectStorage().clear();
  });

  it('lets authorized staff upload a photo into private storage', async () => {
    const { org, admin, student, token } = await setupOrg('Media A');
    const file = await jpeg(64, 32);
    const capturedAt = '2026-09-14T10:45:00.000Z';
    const res = await uploadPhoto(token, student.id, file, {
      fields: {
        capturedAt,
        organizationId: '000000000000000000000000',
        uploadedBy: '000000000000000000000000',
        studentId: '000000000000000000000000',
      },
    });
    expect(res.status).toBe(201);
    expect(res.body.media.mediaType).toBe('PHOTO');
    expect(res.body.media.contentType).toBe('image/jpeg');
    expect(res.body.media.width).toBeGreaterThan(0);
    expect(res.body.media.height).toBeGreaterThan(0);
    expect(res.body.media.capturedAt).toBe(capturedAt);
    expect(res.body.media.url).toBeUndefined();
    assertNoSecrets(res.body);

    const stored = await MediaModel.findById(res.body.media.id);
    expect(stored).toBeTruthy();
    expect(String(stored!.organizationId)).toBe(org.id);
    expect(String(stored!.studentId)).toBe(student.id);
    expect(String(stored!.uploadedBy)).toBe(admin.id);
    expect(stored!.storageKey).toMatch(
      new RegExp(
        `^organizations/${org.id}/students/${student.id}/photos/[a-f0-9]{32}/original\\.jpg$`,
      ),
    );
    expect(stored!.storageKey).not.toContain('emma');
    expect(stored!.storageKey).not.toContain(student.studentNumber);
    const original = await requireLocalObjectStorage().read(stored!.storageKey);
    const thumb = await requireLocalObjectStorage().read(stored!.thumbnailStorageKey);
    expect(original?.length).toBeGreaterThan(0);
    expect(thumb?.length).toBeGreaterThan(0);
    expect(original?.length).toBe(stored!.size);
  });

  it('rejects invalid types, oversized files, missing students, and inactive students', async () => {
    const { campus, classroom, student, token, org } = await setupOrg('Media B');
    const exe = await uploadPhoto(token, student.id, Buffer.from('MZ\x90fake-executable'), {
      filename: 'virus.jpg',
      contentType: 'image/jpeg',
    });
    expect(exe.status).toBe(422);
    expect(exe.body.error.code).toBe('VALIDATION_ERROR');

    const oversized = await uploadPhoto(
      token,
      student.id,
      Buffer.alloc(env.mediaMaxUploadBytes + 1),
    );
    expect(oversized.status).toBe(422);

    const missing = await uploadPhoto(token, '64b0b0b0b0b0b0b0b0b0b0b0', await jpeg());
    expect(missing.status).toBe(404);

    const inactive = await insertStudent(org.id, {
      campusId: campus.id,
      classroomId: classroom.id,
      firstName: 'Mia',
      lastName: 'Smith',
      studentNumber: 'B-002',
      qrToken: 'mia-token-000000000000000000000000'.slice(0, 32),
    });
    await request(app)
      .patch(`/api/v1/students/${inactive.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'INACTIVE' });
    const inactiveUpload = await uploadPhoto(token, inactive.id, await jpeg());
    expect(inactiveUpload.status).toBe(400);
  });

  it('scopes teacher uploads to assigned classrooms and blocks guardians and drivers', async () => {
    const { org, campus, classroom, student, token } = await setupOrg('Media C');
    const otherClass = await insertClassroom(org.id, campus.id, 'Nursery B');
    const otherStudent = await insertStudent(org.id, {
      campusId: campus.id,
      classroomId: otherClass.id,
      firstName: 'Liam',
      lastName: 'Jones',
      studentNumber: 'C-002',
      qrToken: 'liam-token-00000000000000000000000'.slice(0, 32),
    });
    const teacher = await insertUser({
      email: 'teacher.c@example.com',
      password,
      organizationId: org.id,
      role: 'TEACHER',
      classroomIds: [classroom.id],
    });
    const teacherToken = await login(teacher.email);
    const allowed = await uploadPhoto(teacherToken, student.id, await jpeg());
    expect(allowed.status).toBe(201);

    const blocked = await uploadPhoto(teacherToken, otherStudent.id, await jpeg());
    expect(blocked.status).toBe(404);

    const { token: guardianToken } = await linkGuardian(token, student.id, {
      email: 'guardian.c@example.com',
      organizationId: org.id,
    });
    const guardianUpload = await uploadPhoto(guardianToken, student.id, await jpeg());
    expect(guardianUpload.status).toBe(403);

    const driver = await insertUser({
      email: 'driver.c@example.com',
      password,
      organizationId: org.id,
      role: 'DRIVER',
    });
    const driverUpload = await uploadPhoto(await login(driver.email), student.id, await jpeg());
    expect(driverUpload.status).toBe(403);
  });

  it('issues signed URLs only after authorization and expires them', async () => {
    const { org, student, token } = await setupOrg('Media D');
    const uploaded = await uploadPhoto(token, student.id, await jpeg(), {
      fields: { capturedAt: '2026-09-14T10:45:00.000Z' },
    });
    const mediaId = uploaded.body.media.id as string;

    const list = await request(app)
      .get(`/api/v1/students/${student.id}/media`)
      .query({ date: '2026-09-14', mediaType: 'PHOTO' })
      .set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.items).toHaveLength(1);
    expect(list.body.meta.total).toBe(1);
    assertNoSecrets(list.body);
    const signed = list.body.items[0].url as string;
    expect(signed).toContain('/api/v1/media/files');
    expect(signed).not.toMatch(/\/public\//);

    const url = new URL(signed);
    const file = await request(app).get(`${url.pathname}${url.search}`);
    expect(file.status).toBe(200);
    expect(file.headers['content-type']).toMatch(/image\/jpeg/);

    const tampered = await request(app).get(
      `${url.pathname}?k=${url.searchParams.get('k')}&e=${url.searchParams.get('e')}&s=AAAA`,
    );
    expect(tampered.status).toBe(404);

    const expiredAt = Math.floor(Date.now() / 1000) - 30;
    const expiredSig = signStorageAccess(
      url.searchParams.get('k')!,
      expiredAt,
      env.storageSecret || env.jwtAccessSecret,
    );
    const expired = await request(app).get(
      `${url.pathname}?k=${encodeURIComponent(url.searchParams.get('k')!)}&e=${expiredAt}&s=${expiredSig}`,
    );
    expect(expired.status).toBe(404);
    expect(
      isValidStorageSignature(
        'organizations/x/students/y/photos/aa/original.jpg',
        expiredAt,
        expiredSig,
        env.storageSecret || env.jwtAccessSecret,
      ),
    ).toBe(false);

    const unauthenticated = await request(app).get(`/api/v1/media/${mediaId}`);
    expect(unauthenticated.status).toBe(401);

    const other = await setupOrg('Media E');
    const cross = await request(app)
      .get(`/api/v1/media/${mediaId}`)
      .set('Authorization', `Bearer ${other.token}`);
    expect(cross.status).toBe(404);

    const otherList = await request(app)
      .get(`/api/v1/students/${student.id}/media`)
      .set('Authorization', `Bearer ${other.token}`);
    expect(otherList.status).toBe(404);
    expect(org.id).not.toBe(other.org.id);
  });

  it('lets a guardian view only their own child’s photos', async () => {
    const { org, campus, classroom, student, token } = await setupOrg('Media F');
    await uploadPhoto(token, student.id, await jpeg());
    const other = await insertStudent(org.id, {
      campusId: campus.id,
      classroomId: classroom.id,
      firstName: 'Noah',
      lastName: 'Smith',
      studentNumber: 'F-002',
      qrToken: 'noah-token-00000000000000000000000'.slice(0, 32),
    });
    await uploadPhoto(token, other.id, await jpeg());

    const { token: guardianToken } = await linkGuardian(token, student.id, {
      email: 'guardian.f@example.com',
      organizationId: org.id,
    });
    await linkGuardian(token, other.id, {
      email: 'guardian.other.f@example.com',
      organizationId: org.id,
    });

    const own = await request(app)
      .get(`/api/v1/parent/children/${student.id}/media`)
      .set('Authorization', `Bearer ${guardianToken}`);
    expect(own.status).toBe(200);
    expect(own.body.items).toHaveLength(1);
    assertNoSecrets(own.body);
    const signed = new URL(own.body.items[0].thumbnailUrl as string);
    const thumb = await request(app).get(`${signed.pathname}${signed.search}`);
    expect(thumb.status).toBe(200);

    const otherChild = await request(app)
      .get(`/api/v1/parent/children/${other.id}/media`)
      .set('Authorization', `Bearer ${guardianToken}`);
    expect(otherChild.status).toBe(404);

    const stored = await MediaModel.findOne({ studentId: other.id });
    const otherMedia = await request(app)
      .get(`/api/v1/media/${stored!.id}`)
      .set('Authorization', `Bearer ${guardianToken}`);
    expect(otherMedia.status).toBe(404);
  });

  it('deletes storage objects with the media record and rejects unauthorized deletes', async () => {
    const { org, classroom, student, token } = await setupOrg('Media G');
    const uploaded = await uploadPhoto(token, student.id, await jpeg());
    const mediaId = uploaded.body.media.id as string;
    const stored = await MediaModel.findById(mediaId);
    expect(await requireLocalObjectStorage().read(stored!.storageKey)).toBeTruthy();

    const teacher = await insertUser({
      email: 'teacher.g@example.com',
      password,
      organizationId: org.id,
      role: 'TEACHER',
      classroomIds: [classroom.id],
    });
    const teacherDelete = await request(app)
      .delete(`/api/v1/media/${mediaId}`)
      .set('Authorization', `Bearer ${await login(teacher.email)}`);
    expect(teacherDelete.status).toBe(403);

    const removed = await request(app)
      .delete(`/api/v1/media/${mediaId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(removed.status).toBe(204);
    expect(await requireLocalObjectStorage().read(stored!.storageKey)).toBeNull();
    expect(await requireLocalObjectStorage().read(stored!.thumbnailStorageKey)).toBeNull();
    expect(await MediaModel.findById(mediaId)).toMatchObject({ deletedAt: expect.any(Date) });

    const listed = await request(app)
      .get(`/api/v1/students/${student.id}/media`)
      .set('Authorization', `Bearer ${token}`);
    expect(listed.body.items).toHaveLength(0);
  });

  it('accepts png/webp, strips metadata, and never trusts the client mime type alone', async () => {
    const { student, token } = await setupOrg('Media H');
    const pngUpload = await uploadPhoto(token, student.id, await png(), {
      filename: 'shot.png',
      contentType: 'image/png',
    });
    expect(pngUpload.status).toBe(201);
    expect(pngUpload.body.media.contentType).toBe('image/jpeg');

    const withExif = await sharp({
      create: { width: 12, height: 8, channels: 3, background: { r: 10, g: 10, b: 200 } },
    })
      .withExif({ IFD0: { Software: 'SpyCam', Copyright: 'secret' } })
      .jpeg()
      .toBuffer();
    expect(sniffImageType(withExif)).toBe('image/jpeg');
    const processed = await processPhoto(withExif);
    const meta = await sharp(processed.original).metadata();
    expect(meta.exif).toBeUndefined();
    expect(JSON.stringify(meta)).not.toMatch(/SpyCam|GPS|gps/i);
  });
});
