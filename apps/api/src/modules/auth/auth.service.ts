import bcrypt from 'bcryptjs';
import { TokenExpiredError } from 'jsonwebtoken';
import { AppError } from '../../utils/appError';
import { writeAuditLog } from '../audit/audit.service';
import {
  findUserByEmailWithPassword,
  findUserById,
  findUserByIdGlobal,
  findUserByIdWithPassword,
  setUserPassword,
  toPublicUser,
} from '../users/user.repository';
import { UserModel } from '../users/user.model';
import { findOrganizationById } from '../organizations/organization.repository';
import { isOrganizationOperational } from '../organizations/organization.model';
import type { AuthContext, PublicUser } from '../../types';
import { RefreshTokenModel } from './refresh-token.model';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from './jwt';

const DUMMY_PASSWORD_HASH = '$2b$10$E9iAwmuextAuI.QpPYc7m.HFoj3/DWL6nt4Pzjt03.YgeD73gnXpO';
const BCRYPT_ROUNDS = process.env.NODE_ENV === 'test' ? 4 : 10;

function invalidCredentials(): AppError {
  return new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
}

function asNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

function tenantAccessError(status: string | undefined): AppError {
  if (status === 'SUSPENDED') {
    return new AppError(403, 'TENANT_SUSPENDED', 'Organization account is suspended');
  }
  if (status === 'CANCELLED') {
    return new AppError(403, 'TENANT_CANCELLED', 'Organization account is cancelled');
  }
  if (status === 'INACTIVE') {
    return new AppError(403, 'TENANT_INACTIVE', 'Organization account is inactive');
  }
  return new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action');
}

async function requireOperationalOrganization(organizationId: string): Promise<void> {
  const organization = await findOrganizationById(organizationId);
  if (!organization || !isOrganizationOperational(organization.status)) {
    throw tenantAccessError(organization?.status);
  }
}

export async function login(
  emailRaw: unknown,
  passwordRaw: unknown,
): Promise<{ user: PublicUser; accessToken: string; refreshToken: string }> {
  const email = asNonEmptyString(emailRaw)?.toLowerCase();
  const password = typeof passwordRaw === 'string' ? passwordRaw : undefined;

  if (!email || !password) {
    throw new AppError(422, 'VALIDATION_ERROR', 'Email and password are required', [
      { field: email ? 'password' : 'email', message: 'Required' },
    ]);
  }

  const user = await findUserByEmailWithPassword(email);
  const hash = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
  const passwordMatches = await bcrypt.compare(password, hash);

  if (!user || !passwordMatches) {
    if (user?.role === 'PLATFORM_ADMIN') {
      await writePlatformAdminLoginFailed(user.id, user.email, 'invalid_credentials');
    }
    throw invalidCredentials();
  }

  if (user.status !== 'ACTIVE') {
    if (user.role === 'PLATFORM_ADMIN') {
      await writePlatformAdminLoginFailed(user.id, user.email, 'inactive');
    }
    throw new AppError(403, 'ACCOUNT_INACTIVE', 'Account inactive');
  }

  if (user.role === 'PLATFORM_ADMIN') {
    if (user.organizationId) {
      await writePlatformAdminLoginFailed(user.id, user.email, 'invalid_tenant_link');
      throw invalidCredentials();
    }
    const claims = { sub: user.id, role: 'PLATFORM_ADMIN' as const };
    const accessToken = signAccessToken(claims);
    const refresh = signRefreshToken(claims);
    await RefreshTokenModel.create({
      jti: refresh.jti,
      userId: user._id,
      organizationId: null,
      expiresAt: refresh.expiresAt,
    });
    await UserModel.findByIdAndUpdate(user.id, { lastLoginAt: new Date() });
    await writeAuditLog({
      actor: platformActor(user.id),
      action: 'PLATFORM_ADMIN_LOGIN',
      resourceType: 'user',
      resourceId: user.id,
      organizationId: null,
      metadata: { email: user.email },
    });
    return { user: toPublicUser(user), accessToken, refreshToken: refresh.token };
  }

  if (!user.organizationId) {
    throw invalidCredentials();
  }

  await requireOperationalOrganization(String(user.organizationId));

  const claims = {
    sub: user.id,
    organizationId: String(user.organizationId),
    role: user.role,
  };
  const accessToken = signAccessToken(claims);
  const refresh = signRefreshToken(claims);

  await RefreshTokenModel.create({
    jti: refresh.jti,
    userId: user._id,
    organizationId: user.organizationId,
    expiresAt: refresh.expiresAt,
  });

  await UserModel.findByIdAndUpdate(user.id, { lastLoginAt: new Date() });

  return { user: toPublicUser(user), accessToken, refreshToken: refresh.token };
}

function platformActor(userId: string): AuthContext {
  return {
    userId,
    organizationId: '',
    role: 'PLATFORM_ADMIN',
    campusIds: [],
    classroomIds: [],
    routeIds: [],
  };
}

async function writePlatformAdminLoginFailed(
  userId: string,
  email: string,
  reason: string,
): Promise<void> {
  await writeAuditLog({
    actor: platformActor(userId),
    action: 'PLATFORM_ADMIN_LOGIN_FAILED',
    resourceType: 'user',
    resourceId: userId,
    organizationId: null,
    metadata: { email, reason },
  });
}

export async function refresh(refreshTokenRaw: unknown): Promise<{ accessToken: string }> {
  const refreshToken = asNonEmptyString(refreshTokenRaw);
  if (!refreshToken) {
    throw new AppError(422, 'VALIDATION_ERROR', 'refreshToken is required', [
      { field: 'refreshToken', message: 'Required' },
    ]);
  }

  let claims;
  try {
    claims = verifyRefreshToken(refreshToken);
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      throw new AppError(401, 'REFRESH_TOKEN_EXPIRED', 'Refresh token expired');
    }
    throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Invalid refresh token');
  }

  const session = await RefreshTokenModel.findOne({ jti: claims.jti });
  if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
    throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Invalid refresh token');
  }

  if (claims.role === 'PLATFORM_ADMIN') {
    const user = await findUserByIdGlobal(claims.sub);
    if (
      !user ||
      user.status !== 'ACTIVE' ||
      user.role !== 'PLATFORM_ADMIN' ||
      user.organizationId
    ) {
      throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Invalid refresh token');
    }
    return {
      accessToken: signAccessToken({
        sub: user.id,
        role: 'PLATFORM_ADMIN',
      }),
    };
  }

  if (!claims.organizationId) {
    throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Invalid refresh token');
  }

  const user = await findUserById(claims.sub, claims.organizationId);
  if (!user || user.status !== 'ACTIVE') {
    throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Invalid refresh token');
  }

  await requireOperationalOrganization(String(user.organizationId));

  return {
    accessToken: signAccessToken({
      sub: user.id,
      organizationId: String(user.organizationId),
      role: user.role,
    }),
  };
}

export async function logout(refreshTokenRaw: unknown): Promise<void> {
  const refreshToken = asNonEmptyString(refreshTokenRaw);
  if (!refreshToken) {
    return;
  }

  try {
    const claims = verifyRefreshToken(refreshToken);
    await RefreshTokenModel.updateOne(
      { jti: claims.jti, revokedAt: null },
      { revokedAt: new Date() },
    );
  } catch {
    // note: access JWTs stay valid until expiry; refresh is what we revoke.
  }
}

export async function getMe(userId: string, organizationId: string | null): Promise<PublicUser> {
  if (organizationId) {
    const user = await findUserById(userId, organizationId);
    if (!user || user.status !== 'ACTIVE') {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }
    return toPublicUser(user);
  }

  const user = await findUserByIdGlobal(userId);
  if (!user || user.status !== 'ACTIVE' || user.role !== 'PLATFORM_ADMIN') {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  return toPublicUser(user);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function changePassword(
  userId: string,
  currentPasswordRaw: unknown,
  newPasswordRaw: unknown,
): Promise<void> {
  const currentPassword = typeof currentPasswordRaw === 'string' ? currentPasswordRaw : undefined;
  const newPassword = typeof newPasswordRaw === 'string' ? newPasswordRaw : undefined;

  if (!currentPassword || !newPassword) {
    throw new AppError(422, 'VALIDATION_ERROR', 'currentPassword and newPassword are required', [
      {
        field: currentPassword ? 'newPassword' : 'currentPassword',
        message: 'Required',
      },
    ]);
  }

  if (newPassword.length < 8) {
    throw new AppError(422, 'PASSWORD_TOO_WEAK', 'Password must be at least 8 characters', [
      { field: 'newPassword', message: 'Must be at least 8 characters' },
    ]);
  }

  const user = await findUserByIdWithPassword(userId);
  if (!user || user.status !== 'ACTIVE') {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }

  const currentMatches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!currentMatches) {
    throw new AppError(401, 'INVALID_CURRENT_PASSWORD', 'Current password is incorrect');
  }

  if (await bcrypt.compare(newPassword, user.passwordHash)) {
    throw new AppError(422, 'PASSWORD_SAME_AS_CURRENT', 'New password must be different');
  }

  const passwordHash = await hashPassword(newPassword);
  await setUserPassword(user.id, passwordHash);
  await RefreshTokenModel.updateMany(
    { userId: user._id, revokedAt: null },
    { revokedAt: new Date() },
  );
}
