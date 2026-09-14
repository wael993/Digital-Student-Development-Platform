import mongoose from 'mongoose';
import { connectMongo, disconnectMongo } from '../config/mongodb';
import { AttendanceModel } from '../modules/attendance/attendance.model';
import { hashPassword } from '../modules/auth/auth.service';
import { CampusModel } from '../modules/campuses/campus.model';
import { ClassroomModel } from '../modules/classrooms/classroom.model';
import { StudentGuardianModel } from '../modules/guardians/guardian.model';
import { StudentEventModel, type StudentEventType } from '../modules/journey/student-event.model';
import { OrganizationModel } from '../modules/organizations/organization.model';
import {
  StudentModel,
  type StudentGender,
  type StudentStatus,
} from '../modules/students/student.model';
import { randomQrToken } from '../modules/students/student.repository';
import { UserModel } from '../modules/users/user.model';
import type { UserRole } from '../types';
import { logger } from '../utils/logger';
import { calendarDateInTimeZone, utcRangeForCalendarDate } from '../utils/timezone';

const SEED_PASSWORD = 'Password123!';
const SEED_TIMEZONE = 'Europe/Berlin';

const ORGS = [
  { key: 'a', name: 'Nursery A' },
  { key: 'b', name: 'Nursery B' },
] as const;

type OrgKey = (typeof ORGS)[number]['key'];

async function seed(): Promise<void> {
  await connectMongo();
  const passwordHash = await hashPassword(SEED_PASSWORD);
  const orgIds: Record<OrgKey, mongoose.Types.ObjectId> = {
    a: new mongoose.Types.ObjectId(),
    b: new mongoose.Types.ObjectId(),
  };

  for (const org of ORGS) {
    const doc = await OrganizationModel.findOneAndUpdate(
      { name: org.name },
      { name: org.name, status: 'ACTIVE', timezone: SEED_TIMEZONE },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    orgIds[org.key] = doc._id as mongoose.Types.ObjectId;
  }

  const campuses: Record<OrgKey, mongoose.Types.ObjectId> = {
    a: new mongoose.Types.ObjectId(),
    b: new mongoose.Types.ObjectId(),
  };
  const classrooms: Record<OrgKey, mongoose.Types.ObjectId> = {
    a: new mongoose.Types.ObjectId(),
    b: new mongoose.Types.ObjectId(),
  };

  for (const key of ORGS.map((org) => org.key)) {
    const campus = await CampusModel.findOneAndUpdate(
      { organizationId: orgIds[key], name: 'Main Campus' },
      { organizationId: orgIds[key], name: 'Main Campus', status: 'ACTIVE' },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    campuses[key] = campus._id as mongoose.Types.ObjectId;

    const classroom = await ClassroomModel.findOneAndUpdate(
      { organizationId: orgIds[key], name: 'Nursery A' },
      {
        organizationId: orgIds[key],
        campusId: campuses[key],
        name: 'Nursery A',
        level: 'NURSERY',
        status: 'ACTIVE',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    classrooms[key] = classroom._id as mongoose.Types.ObjectId;
  }

  const users: {
    email: string;
    org: OrgKey;
    role: UserRole;
    firstName: string;
    lastName: string;
  }[] = [
    { email: 'admin.a@example.com', org: 'a', role: 'ADMIN', firstName: 'Ada', lastName: 'Admin' },
    {
      email: 'supervisor.a@example.com',
      org: 'a',
      role: 'SUPERVISOR',
      firstName: 'Sam',
      lastName: 'Supervisor',
    },
    {
      email: 'teacher@example.com',
      org: 'a',
      role: 'TEACHER',
      firstName: 'John',
      lastName: 'Smith',
    },
    {
      email: 'driver.a@example.com',
      org: 'a',
      role: 'DRIVER',
      firstName: 'Dana',
      lastName: 'Driver',
    },
    {
      email: 'guardian.a@example.com',
      org: 'a',
      role: 'GUARDIAN',
      firstName: 'Sarah',
      lastName: 'Smith',
    },
    {
      email: 'guardian.empty@example.com',
      org: 'a',
      role: 'GUARDIAN',
      firstName: 'Eli',
      lastName: 'Empty',
    },
    { email: 'admin.b@example.com', org: 'b', role: 'ADMIN', firstName: 'Bea', lastName: 'Admin' },
    {
      email: 'teacher.b@example.com',
      org: 'b',
      role: 'TEACHER',
      firstName: 'Tom',
      lastName: 'Teacher',
    },
    {
      email: 'guardian.b@example.com',
      org: 'b',
      role: 'GUARDIAN',
      firstName: 'Gabe',
      lastName: 'Guardian',
    },
  ];

  const userIds: Record<string, mongoose.Types.ObjectId> = {};

  for (const user of users) {
    const campusIds = user.role === 'SUPERVISOR' ? [campuses[user.org]] : [];
    const classroomIds = user.role === 'TEACHER' ? [classrooms[user.org]] : [];
    const doc = await UserModel.findOneAndUpdate(
      { email: user.email },
      {
        organizationId: orgIds[user.org],
        email: user.email,
        passwordHash,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: 'ACTIVE',
        campusIds,
        classroomIds,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    userIds[user.email] = doc._id as mongoose.Types.ObjectId;
  }

  await ClassroomModel.updateOne(
    { _id: classrooms.a },
    { teacherIds: [userIds['teacher@example.com']] },
  );
  await ClassroomModel.updateOne(
    { _id: classrooms.b },
    { teacherIds: [userIds['teacher.b@example.com']] },
  );

  const emma = await upsertStudent(orgIds.a, campuses.a, classrooms.a, {
    firstName: 'Emma',
    lastName: 'Smith',
    studentNumber: 'A-001',
    gender: 'FEMALE',
  });
  const noah = await upsertStudent(orgIds.a, campuses.a, classrooms.a, {
    firstName: 'Noah',
    lastName: 'Smith',
    studentNumber: 'A-002',
    gender: 'MALE',
  });
  const liam = await upsertStudent(orgIds.a, campuses.a, classrooms.a, {
    firstName: 'Liam',
    lastName: 'Smith',
    studentNumber: 'A-003',
    gender: 'MALE',
  });
  const mia = await upsertStudent(orgIds.a, campuses.a, classrooms.a, {
    firstName: 'Mia',
    lastName: 'Smith',
    studentNumber: 'A-004',
    gender: 'FEMALE',
    status: 'INACTIVE',
  });
  const emmaB = await upsertStudent(orgIds.b, campuses.b, classrooms.b, {
    firstName: 'Emma',
    lastName: 'Jones',
    studentNumber: 'B-001',
    gender: 'FEMALE',
  });

  const sarah = userIds['guardian.a@example.com'];
  await linkGuardian(orgIds.a, emma._id, sarah, 'MOTHER', true);
  await linkGuardian(orgIds.a, noah._id, sarah, 'MOTHER', false);
  await linkGuardian(orgIds.a, liam._id, sarah, 'MOTHER', false);
  await linkGuardian(orgIds.a, mia._id, sarah, 'MOTHER', false);
  await linkGuardian(orgIds.b, emmaB._id, userIds['guardian.b@example.com'], 'FATHER', true);

  const now = new Date();
  const todayA = calendarDateInTimeZone(now, SEED_TIMEZONE);
  const todayB = calendarDateInTimeZone(now, SEED_TIMEZONE);
  const teacherA = userIds['teacher@example.com'];
  const teacherB = userIds['teacher.b@example.com'];

  const emmaAttendance = await upsertPresent(
    orgIds.a,
    emma,
    todayA,
    atLocal(todayA, 7, 42),
    teacherA,
  );
  await replaceTodayEvents(orgIds.a, emma._id, teacherA, [
    event('ATTENDANCE_PRESENT', atLocal(todayA, 7, 42), 'QR', {
      attendanceId: String(emmaAttendance._id),
    }),
    event('SCHOOL_ARRIVAL', atLocal(todayA, 8, 27), 'MANUAL'),
    event('CLASS_STARTED', atLocal(todayA, 8, 35), 'MANUAL'),
    event('BREAK_STARTED', atLocal(todayA, 10, 15), 'MANUAL'),
    event('ACTIVITY_STARTED', atLocal(todayA, 10, 45), 'MANUAL'),
    event('MEAL', atLocal(todayA, 12, 0), 'MANUAL'),
  ]);

  await upsertPresent(orgIds.a, noah, todayA, atLocal(todayA, 7, 50), teacherA);
  await replaceTodayEvents(orgIds.a, noah._id, teacherA, [
    event('ATTENDANCE_PRESENT', atLocal(todayA, 7, 50), 'QR'),
    event('BUS_BOARDING', atLocal(todayA, 8, 5), 'MANUAL'),
  ]);

  await clearToday(orgIds.a, liam._id, todayA);
  await clearToday(orgIds.a, mia._id, todayA);

  const emmaBAttendance = await upsertPresent(
    orgIds.b,
    emmaB,
    todayB,
    atLocal(todayB, 8, 10),
    teacherB,
  );
  await replaceTodayEvents(orgIds.b, emmaB._id, teacherB, [
    event('ATTENDANCE_PRESENT', atLocal(todayB, 8, 10), 'QR', {
      attendanceId: String(emmaBAttendance._id),
    }),
    event('SCHOOL_ARRIVAL', atLocal(todayB, 8, 20), 'MANUAL'),
  ]);

  logger.info('Seeded demo data. Password for every user: Password123!', {
    parentMultiChild:
      'guardian.a@example.com — Emma (full day), Noah (on the bus), Liam (not started); Mia inactive is hidden',
    parentEmpty: 'guardian.empty@example.com — no linked children',
    parentOtherOrg: 'guardian.b@example.com — Emma Jones arrived at school',
    staff: 'admin.a / supervisor.a / teacher / driver.a @example.com',
  });
  await disconnectMongo();
}

async function upsertStudent(
  organizationId: mongoose.Types.ObjectId,
  campusId: mongoose.Types.ObjectId,
  classroomId: mongoose.Types.ObjectId,
  input: {
    firstName: string;
    lastName: string;
    studentNumber: string;
    gender: StudentGender;
    status?: StudentStatus;
  },
) {
  return StudentModel.findOneAndUpdate(
    { organizationId, studentNumber: input.studentNumber },
    {
      $set: {
        organizationId,
        campusId,
        classroomId,
        firstName: input.firstName,
        lastName: input.lastName,
        dateOfBirth: new Date('2022-03-12'),
        gender: input.gender,
        studentNumber: input.studentNumber,
        status: input.status ?? 'ACTIVE',
      },
      $setOnInsert: { qrToken: randomQrToken() },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

async function linkGuardian(
  organizationId: mongoose.Types.ObjectId,
  studentId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId,
  relationship: 'MOTHER' | 'FATHER',
  isPrimary: boolean,
) {
  await StudentGuardianModel.findOneAndUpdate(
    { organizationId, studentId, userId },
    {
      organizationId,
      studentId,
      userId,
      relationship,
      isPrimary,
      canPickup: true,
      receivesNotifications: true,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

async function upsertPresent(
  organizationId: mongoose.Types.ObjectId,
  student: { _id: mongoose.Types.ObjectId; campusId: unknown; classroomId: unknown },
  date: string,
  scannedAt: Date,
  scannedBy: mongoose.Types.ObjectId,
) {
  return AttendanceModel.findOneAndUpdate(
    { organizationId, studentId: student._id, date },
    {
      organizationId,
      studentId: student._id,
      campusId: student.campusId,
      classroomId: student.classroomId,
      date,
      attendanceType: 'PRESENT',
      scannedAt,
      scannedBy,
      source: 'QR',
    },
    { upsert: true, new: true },
  );
}

async function clearToday(
  organizationId: mongoose.Types.ObjectId,
  studentId: mongoose.Types.ObjectId,
  date: string,
) {
  const { start, endExclusive } = utcRangeForCalendarDate(date, SEED_TIMEZONE);
  await Promise.all([
    AttendanceModel.deleteMany({ organizationId, studentId, date }),
    StudentEventModel.deleteMany({
      organizationId,
      studentId,
      occurredAt: { $gte: start, $lt: endExclusive },
    }),
  ]);
}

async function replaceTodayEvents(
  organizationId: mongoose.Types.ObjectId,
  studentId: mongoose.Types.ObjectId,
  recordedBy: mongoose.Types.ObjectId,
  events: {
    eventType: StudentEventType;
    occurredAt: Date;
    source: 'MANUAL' | 'QR';
    metadata: Record<string, unknown>;
  }[],
) {
  const date = calendarDateInTimeZone(events[0]?.occurredAt ?? new Date(), SEED_TIMEZONE);
  const { start, endExclusive } = utcRangeForCalendarDate(date, SEED_TIMEZONE);
  await StudentEventModel.deleteMany({
    organizationId,
    studentId,
    occurredAt: { $gte: start, $lt: endExclusive },
  });
  await StudentEventModel.insertMany(
    events.map((row) => ({
      organizationId,
      studentId,
      eventType: row.eventType,
      occurredAt: row.occurredAt,
      recordedAt: row.occurredAt,
      recordedBy,
      source: row.source,
      metadata: row.metadata,
    })),
  );
}

function event(
  eventType: StudentEventType,
  occurredAt: Date,
  source: 'MANUAL' | 'QR',
  metadata: Record<string, unknown> = {},
) {
  return { eventType, occurredAt, source, metadata };
}

function atLocal(dateOnly: string, hours: number, minutes: number): Date {
  const { start } = utcRangeForCalendarDate(dateOnly, SEED_TIMEZONE);
  return new Date(start.getTime() + (hours * 60 + minutes) * 60_000);
}

seed().catch((error: unknown) => {
  logger.error('Seed failed', error);
  process.exit(1);
});
