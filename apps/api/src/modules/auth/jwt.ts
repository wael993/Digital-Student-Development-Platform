import { randomUUID } from 'node:crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env';
import type { UserRole } from '../../types';

export type AccessClaims = {
  sub: string;
  role: UserRole;
  type: 'access';
  /** Present for tenant users; omitted for PLATFORM_ADMIN. */
  organizationId?: string;
};

export type RefreshClaims = {
  sub: string;
  role: UserRole;
  type: 'refresh';
  jti: string;
  organizationId?: string;
};

function expiresIn(value: string): SignOptions['expiresIn'] {
  return value as SignOptions['expiresIn'];
}

export function signAccessToken(input: Omit<AccessClaims, 'type'>): string {
  return jwt.sign({ ...input, type: 'access' }, env.jwtAccessSecret, {
    algorithm: 'HS256',
    expiresIn: expiresIn(env.jwtAccessExpiresIn),
  });
}

export function signRefreshToken(input: Omit<RefreshClaims, 'type' | 'jti'>): {
  token: string;
  jti: string;
  expiresAt: Date;
} {
  const jti = randomUUID();
  const token = jwt.sign({ ...input, type: 'refresh', jti }, env.jwtRefreshSecret, {
    algorithm: 'HS256',
    expiresIn: expiresIn(env.jwtRefreshExpiresIn),
  });
  const decoded = jwt.decode(token);
  if (typeof decoded !== 'object' || decoded === null || typeof decoded.exp !== 'number') {
    throw new Error('Failed to sign refresh token');
  }
  return { token, jti, expiresAt: new Date(decoded.exp * 1000) };
}

function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string';
}

export function verifyAccessToken(token: string): AccessClaims {
  const payload = jwt.verify(token, env.jwtAccessSecret, { algorithms: ['HS256'] });
  if (
    typeof payload !== 'object' ||
    payload === null ||
    payload.type !== 'access' ||
    typeof payload.sub !== 'string' ||
    !isUserRole(payload.role)
  ) {
    throw new jwt.JsonWebTokenError('Invalid access token');
  }
  if (payload.role === 'PLATFORM_ADMIN') {
    if (payload.organizationId !== undefined) {
      throw new jwt.JsonWebTokenError('Invalid access token');
    }
    return { sub: payload.sub, role: 'PLATFORM_ADMIN', type: 'access' };
  }
  if (typeof payload.organizationId !== 'string') {
    throw new jwt.JsonWebTokenError('Invalid access token');
  }
  return {
    sub: payload.sub,
    organizationId: payload.organizationId,
    role: payload.role as UserRole,
    type: 'access',
  };
}

export function verifyRefreshToken(token: string): RefreshClaims {
  const payload = jwt.verify(token, env.jwtRefreshSecret, { algorithms: ['HS256'] });
  if (
    typeof payload !== 'object' ||
    payload === null ||
    payload.type !== 'refresh' ||
    typeof payload.sub !== 'string' ||
    typeof payload.jti !== 'string' ||
    !isUserRole(payload.role)
  ) {
    throw new jwt.JsonWebTokenError('Invalid refresh token');
  }
  if (payload.role === 'PLATFORM_ADMIN') {
    if (payload.organizationId !== undefined) {
      throw new jwt.JsonWebTokenError('Invalid refresh token');
    }
    return { sub: payload.sub, role: 'PLATFORM_ADMIN', type: 'refresh', jti: payload.jti };
  }
  if (typeof payload.organizationId !== 'string') {
    throw new jwt.JsonWebTokenError('Invalid refresh token');
  }
  return {
    sub: payload.sub,
    organizationId: payload.organizationId,
    role: payload.role as UserRole,
    type: 'refresh',
    jti: payload.jti,
  };
}
