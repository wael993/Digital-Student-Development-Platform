import { createHash, randomBytes } from 'node:crypto';
import type { AuthContext, TenantRole } from '../../types';
import { AppError } from '../../utils/appError';
import { conflict, notFound } from '../../utils/validate';
import { hashPassword } from '../auth/auth.service';
import { writeAuditLog } from '../audit/audit.service';
import { findOrganizationById } from '../organizations/organization.repository';
import { createUser, findUserByEmail } from '../users/user.repository';
import { UserInvitationModel, type InvitationStatus } from './invitation.model';
import * as subscriptionService from '../subscriptions/subscription.service';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function hashInviteToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

function generateInviteToken(): string {
  return randomBytes(32).toString('hex');
}

export async function createAdminInvitation(input: {
  actor: AuthContext;
  organizationId: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: TenantRole;
  req?: Parameters<typeof writeAuditLog>[0]['req'];
}): Promise<{ invitationId: string; email: string; expiresAt: Date; token: string }> {
  const role = input.role ?? 'ADMIN';
  if (role !== 'ADMIN') {
    // Slice 1: platform invites initial ADMIN only.
    throw new AppError(422, 'VALIDATION_ERROR', 'Only ADMIN invitations are supported', [
      { field: 'role', message: 'Must be ADMIN' },
    ]);
  }

  const organization = await findOrganizationById(input.organizationId);
  if (!organization) {
    throw notFound();
  }

  const email = input.email.toLowerCase().trim();
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw conflict('Email is already registered');
  }

  if (!(await subscriptionService.canCreateUser(input.organizationId))) {
    throw new AppError(403, 'PLAN_LIMIT', 'User limit reached for this plan');
  }

  await UserInvitationModel.updateMany(
    { organizationId: input.organizationId, email, status: 'PENDING' },
    { status: 'REVOKED' as InvitationStatus },
  );

  const token = generateInviteToken();
  const tokenHash = hashInviteToken(token);
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

  const invitation = await UserInvitationModel.create({
    organizationId: input.organizationId,
    email,
    role,
    firstName: input.firstName,
    lastName: input.lastName,
    tokenHash,
    expiresAt,
    invitedBy: input.actor.userId,
    status: 'PENDING',
  });

  await writeAuditLog({
    actor: input.actor,
    action: 'ADMIN_INVITED',
    resourceType: 'user_invitation',
    resourceId: invitation.id,
    organizationId: input.organizationId,
    metadata: { email, role },
    req: input.req,
  });

  // note: email delivery is out of scope; return raw token once for the platform client/tests.
  return {
    invitationId: invitation.id,
    email,
    expiresAt,
    token,
  };
}

export async function acceptInvitation(input: {
  rawToken: string;
  password: string;
  firstName?: string;
  lastName?: string;
}): Promise<{ userId: string; organizationId: string; email: string }> {
  const tokenHash = hashInviteToken(input.rawToken);
  const invitation = await UserInvitationModel.findOne({ tokenHash });
  if (!invitation) {
    throw new AppError(404, 'NOT_FOUND', 'Invitation not found');
  }

  if (invitation.status === 'ACCEPTED') {
    throw new AppError(409, 'INVITATION_USED', 'Invitation has already been accepted');
  }
  if (invitation.status === 'REVOKED') {
    throw new AppError(410, 'INVITATION_REVOKED', 'Invitation has been revoked');
  }
  if (invitation.status !== 'PENDING' || invitation.expiresAt.getTime() <= Date.now()) {
    if (invitation.status === 'PENDING') {
      invitation.status = 'EXPIRED';
      await invitation.save();
    }
    throw new AppError(410, 'INVITATION_EXPIRED', 'Invitation has expired');
  }

  const existingUser = await findUserByEmail(invitation.email);
  if (existingUser) {
    throw conflict('Email is already registered');
  }

  if (invitation.role !== 'ADMIN') {
    throw new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action');
  }

  const organization = await findOrganizationById(String(invitation.organizationId));
  if (!organization) {
    throw notFound();
  }

  const passwordHash = await hashPassword(input.password);
  const user = await createUser({
    organizationId: String(invitation.organizationId),
    email: invitation.email,
    passwordHash,
    firstName: input.firstName?.trim() || invitation.firstName,
    lastName: input.lastName?.trim() || invitation.lastName,
    role: invitation.role,
    status: 'ACTIVE',
  });

  invitation.status = 'ACCEPTED';
  invitation.acceptedAt = new Date();
  await invitation.save();

  await writeAuditLog({
    actor: {
      userId: user.id,
      organizationId: String(invitation.organizationId),
      role: invitation.role,
      campusIds: [],
      classroomIds: [],
      routeIds: [],
    },
    action: 'ADMIN_INVITATION_ACCEPTED',
    resourceType: 'user_invitation',
    resourceId: invitation.id,
    organizationId: String(invitation.organizationId),
    metadata: { email: invitation.email, userId: user.id },
  });

  return {
    userId: user.id,
    organizationId: String(invitation.organizationId),
    email: invitation.email,
  };
}
