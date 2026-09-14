import bcrypt from 'bcryptjs';
import { TokenExpiredError } from 'jsonwebtoken';
import { AppError } from '../../utils/appError';
import { findUserByEmailWithPassword, findUserById, toPublicUser } from '../users/user.repository';
import type { PublicUser } from '../../types';
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
    throw invalidCredentials();
  }

  if (user.status !== 'ACTIVE') {
    throw new AppError(403, 'ACCOUNT_INACTIVE', 'Account inactive');
  }

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

  return { user: toPublicUser(user), accessToken, refreshToken: refresh.token };
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

  const user = await findUserById(claims.sub, claims.organizationId);
  if (!user || user.status !== 'ACTIVE') {
    throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Invalid refresh token');
  }

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

export async function getMe(userId: string, organizationId: string): Promise<PublicUser> {
  const user = await findUserById(userId, organizationId);
  if (!user || user.status !== 'ACTIVE') {
    throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');
  }
  return toPublicUser(user);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}
