import mongoose from 'mongoose';
import { env } from '../src/config/env';
import { hashPassword } from '../src/modules/auth/auth.service';
import { RefreshTokenModel } from '../src/modules/auth/refresh-token.model';
import { CampusModel } from '../src/modules/campuses/campus.model';
import { createCampus } from '../src/modules/campuses/campus.repository';
import { ClassroomModel } from '../src/modules/classrooms/classroom.model';
import { createClassroom } from '../src/modules/classrooms/classroom.repository';
import { StudentGuardianModel } from '../src/modules/guardians/guardian.model';
import { OrganizationModel } from '../src/modules/organizations/organization.model';
import { createOrganization } from '../src/modules/organizations/organization.repository';
import { AttendanceModel } from '../src/modules/attendance/attendance.model';
import { StudentModel } from '../src/modules/students/student.model';
import { createStudent } from '../src/modules/students/student.repository';
import { createUser } from '../src/modules/users/user.repository';
import { UserModel } from '../src/modules/users/user.model';
import type { UserRole, UserStatus } from '../src/types';
import type { OrganizationStatus } from '../src/modules/organizations/organization.model';

export async function connectTestDb(): Promise<void> {
  await mongoose.connect(env.mongodbUri);
}

export async function disconnectTestDb(): Promise<void> {
  await mongoose.disconnect();
}

export async function clearAuthData(): Promise<void> {
  await Promise.all([
    UserModel.deleteMany({}),
    RefreshTokenModel.deleteMany({}),
    OrganizationModel.deleteMany({}),
    CampusModel.deleteMany({}),
    ClassroomModel.deleteMany({}),
    StudentModel.deleteMany({}),
    StudentGuardianModel.deleteMany({}),
    AttendanceModel.deleteMany({}),
  ]);
}

export async function insertOrganization(input?: { name?: string; status?: OrganizationStatus }) {
  return createOrganization({
    name: input?.name ?? 'Nursery',
    status: input?.status ?? 'ACTIVE',
  });
}

export async function setOrganizationStatus(id: string, status: OrganizationStatus) {
  return OrganizationModel.findByIdAndUpdate(id, { status }, { new: true });
}

export async function insertUser(input: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  status?: UserStatus;
  organizationId?: string;
  campusIds?: string[];
  classroomIds?: string[];
}) {
  const organizationId =
    input.organizationId ?? (await insertOrganization({ name: `Org ${input.email}` })).id;
  const passwordHash = await hashPassword(input.password);
  return createUser({
    organizationId,
    email: input.email,
    passwordHash,
    firstName: input.firstName ?? 'John',
    lastName: input.lastName ?? 'Smith',
    role: input.role ?? 'TEACHER',
    status: input.status ?? 'ACTIVE',
    campusIds: input.campusIds,
    classroomIds: input.classroomIds,
  });
}

export async function insertCampus(organizationId: string, name = 'Main Campus') {
  return createCampus(organizationId, { name });
}

export async function insertClassroom(
  organizationId: string,
  campusId: string,
  name = 'Nursery A',
) {
  return createClassroom(organizationId, {
    campusId,
    name,
    level: 'NURSERY',
  });
}

export async function insertStudent(
  organizationId: string,
  input: {
    campusId: string;
    classroomId: string;
    firstName?: string;
    lastName?: string;
    studentNumber: string;
    qrToken: string;
  },
) {
  return createStudent(organizationId, {
    campusId: input.campusId,
    classroomId: input.classroomId,
    firstName: input.firstName ?? 'Sarah',
    lastName: input.lastName ?? 'Ahmed',
    dateOfBirth: new Date('2022-03-12'),
    gender: 'FEMALE',
    studentNumber: input.studentNumber,
    qrToken: input.qrToken,
  });
}
