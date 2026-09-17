import type { Request } from 'express';
import type { AuthContext, TenantRole, UserStatus } from '../../types';
import { assertAssigned } from '../../authorization/scope';
import { AppError } from '../../utils/appError';
import { notFound } from '../../utils/validate';
import { hashPassword } from '../auth/auth.service';
import { findCampusById } from '../campuses/campus.repository';
import { findClassroomById } from '../classrooms/classroom.repository';
import { findRouteById } from '../buses/bus.repository';
import * as invitationService from '../invitations/invitation.service';
import * as subscriptionService from '../subscriptions/subscription.service';
import {
  createUser,
  findUserByEmail,
  findUserById,
  listUsers,
  toStaffUserJson,
  updateUserAssignments,
  type ListUsersFilter,
} from './user.repository';

type CreateInput = {
  email: string;
  firstName: string;
  lastName: string;
  role: TenantRole;
  password?: string;
  invite: boolean;
  campusIds: string[];
  classroomIds: string[];
  routeIds: string[];
};

type PatchInput = {
  firstName?: string;
  lastName?: string;
  status?: UserStatus;
  campusIds?: string[];
  classroomIds?: string[];
  routeIds?: string[];
};

function invitationResponse(result: { invitationId: string; email: string; expiresAt: Date }) {
  return {
    invitation: {
      invitationId: result.invitationId,
      email: result.email,
      expiresAt: result.expiresAt,
      status: 'PENDING' as const,
    },
  };
}

function assertSupervisorCanWrite(auth: AuthContext): void {
  if (auth.role === 'SUPERVISOR' && auth.campusIds.length === 0) {
    throw new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action');
  }
}

function assertSupervisorCampusSubset(auth: AuthContext, campusIds: string[]): void {
  if (auth.role !== 'SUPERVISOR') {
    return;
  }
  for (const campusId of campusIds) {
    assertAssigned(auth, campusId, auth.campusIds);
  }
}

function assertCanManageTarget(auth: AuthContext, targetRole: TenantRole): void {
  if (auth.role === 'SUPERVISOR' && targetRole === 'ADMIN') {
    throw new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action');
  }
}

async function assertCampusesExist(organizationId: string, campusIds: string[]): Promise<void> {
  for (const campusId of campusIds) {
    const campus = await findCampusById(organizationId, campusId);
    if (!campus) {
      throw notFound();
    }
  }
}

async function assertClassroomsExist(organizationId: string, classroomIds: string[]): Promise<void> {
  for (const classroomId of classroomIds) {
    const classroom = await findClassroomById(organizationId, classroomId);
    if (!classroom) {
      throw notFound();
    }
  }
}

async function assertRoutesExist(organizationId: string, routeIds: string[]): Promise<void> {
  for (const routeId of routeIds) {
    const route = await findRouteById(organizationId, routeId);
    if (!route) {
      throw notFound();
    }
  }
}

async function validateAssignments(
  organizationId: string,
  role: TenantRole,
  campusIds: string[],
  classroomIds: string[],
  routeIds: string[],
): Promise<void> {
  if (role === 'SUPERVISOR' && campusIds.length > 0) {
    await assertCampusesExist(organizationId, campusIds);
  }
  if (role === 'TEACHER' && classroomIds.length > 0) {
    await assertClassroomsExist(organizationId, classroomIds);
  }
  if (role === 'DRIVER' && routeIds.length > 0) {
    await assertRoutesExist(organizationId, routeIds);
  }
}

async function loadStaffUser(auth: AuthContext, userId: string) {
  const user = await findUserById(userId, auth.organizationId);
  if (!user || user.role === 'PLATFORM_ADMIN') {
    throw notFound();
  }
  return user;
}

export async function list(auth: AuthContext, filter: ListUsersFilter, skip: number, limit: number) {
  const result = await listUsers(auth.organizationId, filter, skip, limit);
  return {
    items: result.items.map(toStaffUserJson),
    total: result.total,
  };
}

export async function getById(auth: AuthContext, userId: string) {
  const user = await loadStaffUser(auth, userId);
  return toStaffUserJson(user);
}

export async function create(
  auth: AuthContext,
  input: CreateInput,
  req?: Request,
) {
  assertSupervisorCanWrite(auth);
  assertCanManageTarget(auth, input.role);
  assertSupervisorCampusSubset(auth, input.campusIds);

  await validateAssignments(
    auth.organizationId,
    input.role,
    input.campusIds,
    input.classroomIds,
    input.routeIds,
  );

  if (input.invite || !input.password) {
    const result = await invitationService.createUserInvitation({
      actor: auth,
      organizationId: auth.organizationId,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role,
      campusIds: input.campusIds,
      classroomIds: input.classroomIds,
      routeIds: input.routeIds,
      req,
    });
    return invitationResponse(result);
  }

  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new AppError(409, 'USER_ALREADY_EXISTS', 'Email is already registered');
  }

  if (!(await subscriptionService.canCreateUser(auth.organizationId))) {
    throw new AppError(403, 'PLAN_LIMIT', 'User limit reached for this plan');
  }

  const user = await createUser({
    organizationId: auth.organizationId,
    email: input.email,
    passwordHash: await hashPassword(input.password),
    firstName: input.firstName,
    lastName: input.lastName,
    role: input.role,
    status: 'ACTIVE',
    campusIds: input.campusIds,
    classroomIds: input.classroomIds,
    routeIds: input.routeIds,
  });

  return toStaffUserJson(user);
}

export async function patch(auth: AuthContext, userId: string, input: PatchInput) {
  assertSupervisorCanWrite(auth);
  const existing = await loadStaffUser(auth, userId);
  assertCanManageTarget(auth, existing.role as TenantRole);

  const campusIds = input.campusIds ?? existing.campusIds.map(String);
  const classroomIds = input.classroomIds ?? existing.classroomIds.map(String);
  const routeIds = input.routeIds ?? existing.routeIds.map(String);

  assertSupervisorCampusSubset(auth, campusIds);
  await validateAssignments(
    auth.organizationId,
    existing.role as TenantRole,
    campusIds,
    classroomIds,
    routeIds,
  );

  const updated = await updateUserAssignments(auth.organizationId, userId, {
    ...input,
    campusIds: input.campusIds,
    classroomIds: input.classroomIds,
    routeIds: input.routeIds,
  });
  if (!updated) {
    throw notFound();
  }
  return toStaffUserJson(updated);
}

export async function disable(auth: AuthContext, userId: string) {
  assertSupervisorCanWrite(auth);
  const existing = await loadStaffUser(auth, userId);
  assertCanManageTarget(auth, existing.role as TenantRole);
  const updated = await updateUserAssignments(auth.organizationId, userId, { status: 'INACTIVE' });
  if (!updated) {
    throw notFound();
  }
  return toStaffUserJson(updated);
}

export async function enable(auth: AuthContext, userId: string) {
  assertSupervisorCanWrite(auth);
  const existing = await loadStaffUser(auth, userId);
  assertCanManageTarget(auth, existing.role as TenantRole);
  const updated = await updateUserAssignments(auth.organizationId, userId, { status: 'ACTIVE' });
  if (!updated) {
    throw notFound();
  }
  return toStaffUserJson(updated);
}

export async function resendInvitation(auth: AuthContext, userId: string, req?: Request) {
  assertSupervisorCanWrite(auth);
  const user = await loadStaffUser(auth, userId);
  assertCanManageTarget(auth, user.role as TenantRole);

  const result = await invitationService.createUserInvitation({
    actor: auth,
    organizationId: auth.organizationId,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role as TenantRole,
    campusIds: user.campusIds.map(String),
    classroomIds: user.classroomIds.map(String),
    routeIds: user.routeIds.map(String),
    req,
  });
  return invitationResponse(result);
}
