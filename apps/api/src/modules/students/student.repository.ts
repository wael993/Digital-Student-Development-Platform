import { randomBytes } from 'node:crypto';
import { tenantFilter, withTenant } from '../../data/tenant';
import { StudentModel, type StudentGender, type StudentStatus } from './student.model';

export function randomQrToken(): string {
  return randomBytes(16).toString('hex');
}

export async function createStudent(
  organizationId: string,
  input: {
    campusId: string;
    classroomId: string;
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    gender: StudentGender;
    studentNumber: string;
    status?: StudentStatus;
    qrToken: string;
  },
) {
  return StudentModel.create(withTenant(input, organizationId));
}

export async function findStudentById(organizationId: string, id: string) {
  return StudentModel.findOne(tenantFilter(organizationId, { _id: id }));
}

export async function findStudentByQrToken(organizationId: string, qrToken: string) {
  return StudentModel.findOne(tenantFilter(organizationId, { qrToken }));
}

export async function findStudentsByIds(organizationId: string, ids: string[]) {
  if (ids.length === 0) {
    return [];
  }
  return StudentModel.find(tenantFilter(organizationId, { _id: { $in: ids } }));
}

export async function listStudents(
  organizationId: string,
  extra: Record<string, unknown>,
  skip: number,
  limit: number,
) {
  const filter = tenantFilter(organizationId, extra);
  const [items, total] = await Promise.all([
    StudentModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    StudentModel.countDocuments(filter),
  ]);
  return { items, total };
}

export async function updateStudent(
  organizationId: string,
  id: string,
  patch: {
    campusId?: string;
    classroomId?: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: Date;
    gender?: StudentGender;
    studentNumber?: string;
    status?: StudentStatus;
  },
) {
  return StudentModel.findOneAndUpdate(tenantFilter(organizationId, { _id: id }), patch, {
    new: true,
  });
}

export async function updateStudentsCampus(
  organizationId: string,
  classroomId: string,
  campusId: string,
) {
  await StudentModel.updateMany(tenantFilter(organizationId, { classroomId }), { campusId });
}

export async function distinctStudentIds(organizationId: string, extra: Record<string, unknown>) {
  const ids = await StudentModel.distinct('_id', tenantFilter(organizationId, extra));
  return ids.map(String);
}
