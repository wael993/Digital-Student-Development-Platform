import { randomUUID } from 'node:crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env';
import type { UserRole } from '../../types';

export type AccessClaims = {
  sub: string;
  organizationId: string;
  role: UserRole;
  type: 'access';
};

export type RefreshClaims = {
  sub: string;
  organizationId: string;
  role: UserRole;
  type: 'refresh';
  jti: string;
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

export function verifyAccessToken(token: string): AccessClaims {
  const payload = jwt.verify(token, env.jwtAccessSecret, { algorithms: ['HS256'] });
  if (
    typeof payload !== 'object' ||
    payload === null ||
    payload.type !== 'access' ||
    typeof payload.sub !== 'string' ||
    typeof payload.organizationId !== 'string' ||
    typeof payload.role !== 'string'
  ) {
    throw new jwt.JsonWebTokenError('Invalid access token');
  }
  return payload as AccessClaims;
}

export function verifyRefreshToken(token: string): RefreshClaims {
  const payload = jwt.verify(token, env.jwtRefreshSecret, { algorithms: ['HS256'] });
  if (
    typeof payload !== 'object' ||
    payload === null ||
    payload.type !== 'refresh' ||
    typeof payload.sub !== 'string' ||
    typeof payload.organizationId !== 'string' ||
    typeof payload.role !== 'string' ||
    typeof payload.jti !== 'string'
  ) {
    throw new jwt.JsonWebTokenError('Invalid refresh token');
  }
  return payload as RefreshClaims;
}
