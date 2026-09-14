import { tenantFilter, withTenant } from '../../data/tenant';
import { StudentGuardianModel, type GuardianRelationshipType } from './guardian.model';

export async function createLink(
  organizationId: string,
  input: {
    studentId: string;
    userId: string;
    relationship: GuardianRelationshipType;
    isPrimary?: boolean;
    canPickup?: boolean;
    receivesNotifications?: boolean;
  },
) {
  return StudentGuardianModel.create(withTenant(input, organizationId));
}

export async function findLink(organizationId: string, studentId: string, userId: string) {
  return StudentGuardianModel.findOne(tenantFilter(organizationId, { studentId, userId }));
}

export async function listLinksByStudentIds(organizationId: string, studentIds: string[]) {
  if (studentIds.length === 0) {
    return [];
  }
  return StudentGuardianModel.find(
    tenantFilter(organizationId, { studentId: { $in: studentIds } }),
  );
}

export async function listLinksByUserIds(organizationId: string, userIds: string[]) {
  if (userIds.length === 0) {
    return [];
  }
  return StudentGuardianModel.find(tenantFilter(organizationId, { userId: { $in: userIds } }));
}

export async function listStudentIdsForGuardian(organizationId: string, userId: string) {
  const links = await StudentGuardianModel.find(tenantFilter(organizationId, { userId })).select(
    'studentId',
  );
  return links.map((link) => String(link.studentId));
}

export async function listGuardianUserIdsForStudents(organizationId: string, studentIds: string[]) {
  const links = await listLinksByStudentIds(organizationId, studentIds);
  return [...new Set(links.map((link) => String(link.userId)))];
}

export async function removeLink(organizationId: string, studentId: string, userId: string) {
  return StudentGuardianModel.findOneAndDelete(tenantFilter(organizationId, { studentId, userId }));
}

export async function clearPrimaryForStudent(
  organizationId: string,
  studentId: string,
  exceptUserId?: string,
) {
  await StudentGuardianModel.updateMany(
    tenantFilter(organizationId, {
      studentId,
      ...(exceptUserId ? { userId: { $ne: exceptUserId } } : {}),
    }),
    { isPrimary: false },
  );
}
