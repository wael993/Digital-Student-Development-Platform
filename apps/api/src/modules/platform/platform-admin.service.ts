import type { AuthContext, UserStatus } from '../../types';
import { AppError } from '../../utils/appError';
import { writeAuditLog } from '../audit/audit.service';
import { hashPassword } from '../auth/auth.service';
import { UserModel } from '../users/user.model';
import { createUser, findUserByIdGlobal } from '../users/user.repository';

export type BootstrapResult =
  | { status: 'created'; userId: string; email: string }
  | { status: 'already_exists'; message: string };

/**
 * One-time platform owner provisioning. Idempotent: if any PLATFORM_ADMIN
 * already exists, makes no changes (does not overwrite password).
 * Never log or return the plaintext password.
 */
export async function bootstrapPlatformAdmin(input: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}): Promise<BootstrapResult> {
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!email || !password) {
    throw new AppError(
      422,
      'VALIDATION_ERROR',
      'PLATFORM_BOOTSTRAP_EMAIL and PLATFORM_BOOTSTRAP_PASSWORD are required',
    );
  }

  const existingAdmin = await UserModel.findOne({ role: 'PLATFORM_ADMIN' }).select('_id email');
  if (existingAdmin) {
    return {
      status: 'already_exists',
      message: 'Platform admin already exists. No changes made.',
    };
  }

  const emailTaken = await UserModel.findOne({ email }).select('_id');
  if (emailTaken) {
    throw new AppError(
      409,
      'CONFLICT',
      'A user with this email already exists and is not a platform admin',
    );
  }

  const passwordHash = await hashPassword(password);
  const user = await createUser({
    organizationId: null,
    email,
    passwordHash,
    firstName: input.firstName ?? 'Platform',
    lastName: input.lastName ?? 'Owner',
    role: 'PLATFORM_ADMIN',
    status: 'ACTIVE',
  });

  const actor: AuthContext = {
    userId: user.id,
    organizationId: '',
    role: 'PLATFORM_ADMIN',
    campusIds: [],
    classroomIds: [],
    routeIds: [],
  };

  await writeAuditLog({
    actor,
    action: 'PLATFORM_ADMIN_CREATED',
    resourceType: 'user',
    resourceId: user.id,
    organizationId: null,
    metadata: { email },
  });

  return { status: 'created', userId: user.id, email };
}

/** Disable (or re-enable) a platform admin. Writes PLATFORM_ADMIN_DISABLED on INACTIVE. */
export async function setPlatformAdminStatus(
  userId: string,
  status: UserStatus,
  actor: AuthContext,
): Promise<void> {
  const user = await findUserByIdGlobal(userId);
  if (!user || user.role !== 'PLATFORM_ADMIN') {
    throw new AppError(404, 'NOT_FOUND', 'Platform admin not found');
  }

  await UserModel.findByIdAndUpdate(userId, { status });

  if (status === 'INACTIVE') {
    await writeAuditLog({
      actor,
      action: 'PLATFORM_ADMIN_DISABLED',
      resourceType: 'user',
      resourceId: userId,
      organizationId: null,
      metadata: { email: user.email },
    });
  }
}

/** Change platform admin password via normal hashing. Never bootstrap/.env. */
export async function changePlatformAdminPassword(
  userId: string,
  newPassword: string,
  actor: AuthContext,
): Promise<void> {
  if (!newPassword) {
    throw new AppError(422, 'VALIDATION_ERROR', 'Password is required');
  }

  const user = await findUserByIdGlobal(userId);
  if (!user || user.role !== 'PLATFORM_ADMIN') {
    throw new AppError(404, 'NOT_FOUND', 'Platform admin not found');
  }

  const passwordHash = await hashPassword(newPassword);
  await UserModel.findByIdAndUpdate(userId, { passwordHash });

  await writeAuditLog({
    actor,
    action: 'PLATFORM_ADMIN_PASSWORD_CHANGED',
    resourceType: 'user',
    resourceId: userId,
    organizationId: null,
  });
}
