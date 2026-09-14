import type { AuthContext } from '../../types';
import { assertAssigned } from '../../authorization/scope';
import { hashPassword } from '../auth/auth.service';
import { conflict, notFound, validationError } from '../../utils/validate';
import { distinctStudentIds, findStudentById } from '../students/student.repository';
import {
  createUser,
  findUserByEmail,
  findUserById,
  findUsersByIds,
  listGuardianUsers,
  toPublicUser,
  updateUser,
} from '../users/user.repository';
import {
  clearPrimaryForStudent,
  createLink,
  findLink,
  listGuardianUserIdsForStudents,
  listLinksByStudentIds,
  listLinksByUserIds,
  listStudentIdsForGuardian,
  removeLink,
} from './guardian.repository';
import type { AssociateInput } from './guardian.validation';
import type { StudentGuardian } from './guardian.model';

export function toLinkJson(
  link: StudentGuardian & { id: string },
  user?: { id: string; firstName: string; lastName: string; email: string },
) {
  return {
    id: link.id,
    organizationId: String(link.organizationId),
    studentId: String(link.studentId),
    userId: String(link.userId),
    relationship: link.relationship,
    isPrimary: link.isPrimary,
    canPickup: link.canPickup,
    receivesNotifications: link.receivesNotifications,
    firstName: user?.firstName,
    lastName: user?.lastName,
    email: user?.email,
    createdAt: link.createdAt,
    updatedAt: link.updatedAt,
  };
}

export async function createGuardianUser(
  auth: AuthContext,
  input: { email: string; password: string; firstName: string; lastName: string },
) {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw conflict('A user with this email already exists');
  }
  const user = await createUser({
    organizationId: auth.organizationId,
    email: input.email,
    passwordHash: await hashPassword(input.password),
    firstName: input.firstName,
    lastName: input.lastName,
    role: 'GUARDIAN',
  });
  return toPublicUser(user);
}

export async function listGuardians(auth: AuthContext, page: number, limit: number, skip: number) {
  const ids = await guardianUserScope(auth);
  if (ids !== undefined && ids.length === 0) {
    return { items: [], total: 0, page, limit };
  }
  const result = await listGuardianUsers(auth.organizationId, ids, skip, limit);
  const links = await listLinksByUserIds(
    auth.organizationId,
    result.items.map((user) => user.id),
  );
  const studentsByUser = new Map<string, string[]>();
  for (const link of links) {
    const key = String(link.userId);
    const current = studentsByUser.get(key) ?? [];
    current.push(String(link.studentId));
    studentsByUser.set(key, current);
  }
  return {
    items: result.items.map((user) => ({
      ...toPublicUser(user),
      studentIds: studentsByUser.get(user.id) ?? [],
    })),
    total: result.total,
    page,
    limit,
  };
}

export async function getGuardian(auth: AuthContext, id: string) {
  const ids = await guardianUserScope(auth);
  if (ids && !ids.includes(id)) {
    throw notFound();
  }
  const user = await findUserById(id, auth.organizationId);
  if (!user || user.role !== 'GUARDIAN') {
    throw notFound();
  }
  const studentIds = await listStudentIdsForGuardian(auth.organizationId, user.id);
  return { ...toPublicUser(user), studentIds };
}

export async function patchGuardian(
  auth: AuthContext,
  id: string,
  input: { firstName?: string; lastName?: string },
) {
  const user = await findUserById(id, auth.organizationId);
  if (!user || user.role !== 'GUARDIAN') {
    throw notFound();
  }
  const updated = await updateUser(auth.organizationId, id, input);
  if (!updated) {
    throw notFound();
  }
  return toPublicUser(updated);
}

export async function listStudentGuardians(auth: AuthContext, studentId: string) {
  const student = await requireReadableStudent(auth, studentId);
  const links = await listLinksByStudentIds(auth.organizationId, [student.id]);
  const users = await findUsersByIds(
    auth.organizationId,
    links.map((link) => String(link.userId)),
  );
  const byId = new Map(users.map((user) => [user.id, user]));
  return links.map((link) => toLinkJson(link, byId.get(String(link.userId))));
}

export async function associateGuardian(
  auth: AuthContext,
  studentId: string,
  input: AssociateInput,
) {
  const student = await requireManagedStudent(auth, studentId);
  const user = await resolveGuardianUser(auth, input);
  const existing = await findLink(auth.organizationId, student.id, user.id);
  if (existing) {
    throw conflict('Guardian is already linked to this student');
  }
  if (input.isPrimary) {
    await clearPrimaryForStudent(auth.organizationId, student.id);
  }
  const link = await createLink(auth.organizationId, {
    studentId: student.id,
    userId: user.id,
    relationship: input.relationship,
    isPrimary: input.isPrimary ?? false,
    canPickup: input.canPickup,
    receivesNotifications: input.receivesNotifications,
  });
  return toLinkJson(link, user);
}

export async function unlinkGuardian(auth: AuthContext, studentId: string, userId: string) {
  await requireManagedStudent(auth, studentId);
  const removed = await removeLink(auth.organizationId, studentId, userId);
  if (!removed) {
    throw notFound();
  }
}

async function resolveGuardianUser(
  auth: AuthContext,
  input: AssociateInput,
): Promise<{ id: string; firstName: string; lastName: string; email: string }> {
  if (input.userId) {
    const user = await findUserById(input.userId, auth.organizationId);
    if (!user || user.role !== 'GUARDIAN') {
      throw validationError('userId', 'Must be a guardian in this organization');
    }
    return toPublicUser(user);
  }

  const existing = await findUserByEmail(input.email ?? '');
  if (existing) {
    if (String(existing.organizationId) !== auth.organizationId || existing.role !== 'GUARDIAN') {
      throw conflict('A user with this email already exists');
    }
    return toPublicUser(existing);
  }

  if (!input.email || !input.password || !input.firstName || !input.lastName) {
    throw validationError(
      'email',
      'email, password, firstName and lastName are required to create a guardian',
    );
  }

  const created = await createUser({
    organizationId: auth.organizationId,
    email: input.email,
    passwordHash: await hashPassword(input.password),
    firstName: input.firstName,
    lastName: input.lastName,
    role: 'GUARDIAN',
  });
  return toPublicUser(created);
}

async function guardianUserScope(auth: AuthContext): Promise<string[] | undefined> {
  if (auth.role === 'ADMIN') {
    return undefined;
  }
  if (auth.role === 'SUPERVISOR') {
    if (auth.campusIds.length === 0) return [];
    const studentIds = await distinctStudentIds(auth.organizationId, {
      campusId: { $in: auth.campusIds },
    });
    return listGuardianUserIdsForStudents(auth.organizationId, studentIds);
  }
  if (auth.role === 'TEACHER') {
    if (auth.classroomIds.length === 0) return [];
    const studentIds = await distinctStudentIds(auth.organizationId, {
      classroomId: { $in: auth.classroomIds },
    });
    return listGuardianUserIdsForStudents(auth.organizationId, studentIds);
  }
  if (auth.role === 'GUARDIAN') {
    return [auth.userId];
  }
  return [];
}

async function requireReadableStudent(auth: AuthContext, studentId: string) {
  const student = await findStudentById(auth.organizationId, studentId);
  if (!student) {
    throw notFound();
  }
  if (auth.role === 'ADMIN') {
    return student;
  }
  if (auth.role === 'SUPERVISOR') {
    assertAssigned(auth, String(student.campusId), auth.campusIds);
    return student;
  }
  if (auth.role === 'TEACHER') {
    assertAssigned(auth, String(student.classroomId), auth.classroomIds);
    return student;
  }
  if (auth.role === 'GUARDIAN') {
    const ids = await listStudentIdsForGuardian(auth.organizationId, auth.userId);
    assertAssigned(auth, student.id, ids);
    return student;
  }
  throw notFound();
}

async function requireManagedStudent(auth: AuthContext, studentId: string) {
  const student = await findStudentById(auth.organizationId, studentId);
  if (!student) {
    throw notFound();
  }
  if (auth.role === 'ADMIN') {
    return student;
  }
  if (auth.role === 'SUPERVISOR') {
    assertAssigned(auth, String(student.campusId), auth.campusIds);
    return student;
  }
  throw notFound();
}
