import mongoose from 'mongoose';
import { connectMongo, disconnectMongo } from '../config/mongodb';
import { hashPassword } from '../modules/auth/auth.service';
import { CampusModel } from '../modules/campuses/campus.model';
import { ClassroomModel } from '../modules/classrooms/classroom.model';
import { StudentGuardianModel } from '../modules/guardians/guardian.model';
import { OrganizationModel } from '../modules/organizations/organization.model';
import { StudentModel } from '../modules/students/student.model';
import { randomQrToken } from '../modules/students/student.repository';
import { UserModel } from '../modules/users/user.model';
import { logger } from '../utils/logger';
import type { UserRole } from '../types';

const SEED_PASSWORD = 'Password123!';

const ORGS = [
  { key: 'a', name: 'Nursery A' },
  { key: 'b', name: 'Nursery B' },
] as const;

async function seed(): Promise<void> {
  await connectMongo();
  const passwordHash = await hashPassword(SEED_PASSWORD);
  const orgIds: Record<'a' | 'b', mongoose.Types.ObjectId> = {
    a: new mongoose.Types.ObjectId(),
    b: new mongoose.Types.ObjectId(),
  };

  for (const org of ORGS) {
    const doc = await OrganizationModel.findOneAndUpdate(
      { name: org.name },
      { name: org.name, status: 'ACTIVE' },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    orgIds[org.key] = doc._id as mongoose.Types.ObjectId;
  }

  const campuses: Record<'a' | 'b', mongoose.Types.ObjectId> = {
    a: new mongoose.Types.ObjectId(),
    b: new mongoose.Types.ObjectId(),
  };
  const classrooms: Record<'a' | 'b', mongoose.Types.ObjectId> = {
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
    org: 'a' | 'b';
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
      email: 'guardian.a@example.com',
      org: 'a',
      role: 'GUARDIAN',
      firstName: 'Gina',
      lastName: 'Guardian',
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

  const students: Record<'a' | 'b', mongoose.Types.ObjectId> = {
    a: new mongoose.Types.ObjectId(),
    b: new mongoose.Types.ObjectId(),
  };

  for (const key of ORGS.map((org) => org.key)) {
    const number = key === 'a' ? 'A-001' : 'B-001';
    const existing = await StudentModel.findOne({
      organizationId: orgIds[key],
      studentNumber: number,
    });
    if (existing) {
      students[key] = existing._id as mongoose.Types.ObjectId;
      continue;
    }
    const created = await StudentModel.create({
      organizationId: orgIds[key],
      campusId: campuses[key],
      classroomId: classrooms[key],
      firstName: key === 'a' ? 'Sarah' : 'Emma',
      lastName: key === 'a' ? 'Ahmed' : 'Jones',
      dateOfBirth: new Date('2022-03-12'),
      gender: 'FEMALE',
      studentNumber: number,
      status: 'ACTIVE',
      qrToken: randomQrToken(),
    });
    students[key] = created._id as mongoose.Types.ObjectId;
  }

  await StudentGuardianModel.findOneAndUpdate(
    {
      organizationId: orgIds.a,
      studentId: students.a,
      userId: userIds['guardian.a@example.com'],
    },
    {
      organizationId: orgIds.a,
      studentId: students.a,
      userId: userIds['guardian.a@example.com'],
      relationship: 'MOTHER',
      isPrimary: true,
      canPickup: true,
      receivesNotifications: true,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  await StudentGuardianModel.findOneAndUpdate(
    {
      organizationId: orgIds.b,
      studentId: students.b,
      userId: userIds['guardian.b@example.com'],
    },
    {
      organizationId: orgIds.b,
      studentId: students.b,
      userId: userIds['guardian.b@example.com'],
      relationship: 'FATHER',
      isPrimary: true,
      canPickup: true,
      receivesNotifications: true,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  logger.info(`Seeded ${ORGS.length} organizations, campuses, classrooms, students, and users`);
  await disconnectMongo();
}

seed().catch((error: unknown) => {
  logger.error('Seed failed', error);
  process.exit(1);
});
