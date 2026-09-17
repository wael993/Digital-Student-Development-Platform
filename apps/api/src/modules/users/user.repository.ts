import type { UserRole, UserStatus, PublicUser } from '../../types';
import { tenantFilter } from '../../data/tenant';
import { UserModel, type User } from './user.model';

export function toPublicUser(user: User & { id: string }): PublicUser {
  return {
    id: user.id,
    organizationId: user.organizationId ? String(user.organizationId) : null,
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

/** Platform or global lookup by id only (no tenant filter). */
export async function findUserByIdGlobal(id: string) {
  return UserModel.findById(id);
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

export async function countUsersByOrganization(organizationId: string, role?: UserRole) {
  return UserModel.countDocuments({
    organizationId,
    ...(role ? { role } : {}),
  });
}

export async function createUser(input: {
  organizationId?: string | null;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status?: UserStatus;
  campusIds?: string[];
  classroomIds?: string[];
  routeIds?: string[];
}) {
  return UserModel.create({
    ...input,
    organizationId: input.organizationId ?? null,
  });
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

export async function setUserPassword(id: string, passwordHash: string) {
  return UserModel.findByIdAndUpdate(id, { passwordHash }, { new: true });
}

export async function setUserRouteIds(organizationId: string, userId: string, routeIds: string[]) {
  return UserModel.findOneAndUpdate(
    tenantFilter(organizationId, { _id: userId }),
    { routeIds },
    { new: true },
  );
}

export async function addUserRouteId(organizationId: string, userId: string, routeId: string) {
  return UserModel.findOneAndUpdate(
    tenantFilter(organizationId, { _id: userId }),
    { $addToSet: { routeIds: routeId } },
    { new: true },
  );
}

export async function pullUserRouteId(organizationId: string, routeId: string) {
  await UserModel.updateMany(tenantFilter(organizationId, { routeIds: routeId }), {
    $pull: { routeIds: routeId },
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
