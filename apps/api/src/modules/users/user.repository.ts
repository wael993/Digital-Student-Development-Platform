import type { UserRole, UserStatus, PublicUser } from '../../types';
import { tenantFilter } from '../../data/tenant';
import { UserModel, type User } from './user.model';

export function toPublicUser(user: User & { id: string }): PublicUser {
  return {
    id: user.id,
    organizationId: String(user.organizationId),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
  };
}

export async function findUserByEmailWithPassword(email: string) {
  return UserModel.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
}

export async function findUserById(id: string, organizationId: string) {
  return UserModel.findOne(tenantFilter(organizationId, { _id: id }));
}

export async function findUserByEmail(email: string) {
  return UserModel.findOne({ email: email.toLowerCase().trim() });
}

export async function findUsersByIds(organizationId: string, ids: string[]) {
  if (ids.length === 0) {
    return [];
  }
  return UserModel.find(tenantFilter(organizationId, { _id: { $in: ids } }));
}

export async function listGuardianUsers(
  organizationId: string,
  ids?: string[],
  skip = 0,
  limit = 20,
) {
  if (ids && ids.length === 0) {
    return { items: [], total: 0 };
  }
  const filter = tenantFilter(organizationId, {
    role: 'GUARDIAN' as UserRole,
    ...(ids ? { _id: { $in: ids } } : {}),
  });
  const [items, total] = await Promise.all([
    UserModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    UserModel.countDocuments(filter),
  ]);
  return { items, total };
}

export async function createUser(input: {
  organizationId: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status?: UserStatus;
  campusIds?: string[];
  classroomIds?: string[];
}) {
  return UserModel.create(input);
}

export async function updateUser(
  organizationId: string,
  id: string,
  patch: { firstName?: string; lastName?: string; status?: UserStatus },
) {
  return UserModel.findOneAndUpdate(tenantFilter(organizationId, { _id: id }), patch, {
    new: true,
  });
}

export async function replaceClassroomTeachers(
  organizationId: string,
  classroomId: string,
  teacherIds: string[],
): Promise<void> {
  await UserModel.updateMany(tenantFilter(organizationId, { classroomIds: classroomId }), {
    $pull: { classroomIds: classroomId },
  });
  if (teacherIds.length === 0) {
    return;
  }
  await UserModel.updateMany(tenantFilter(organizationId, { _id: { $in: teacherIds } }), {
    $addToSet: { classroomIds: classroomId },
  });
}
