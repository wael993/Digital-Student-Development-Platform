import type { Request } from 'express';
import type { AuthContext } from '../types';
import { AppError } from './appError';

export type TenantAuthContext = AuthContext & { organizationId: string };

/** Requires an authenticated tenant user (not platform-only). */
export function requireAuth(req: Request): TenantAuthContext {
  if (!req.auth) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  if (!req.auth.organizationId || req.auth.role === 'PLATFORM_ADMIN') {
    throw new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action');
  }
  return req.auth;
}

export function requirePlatformAuth(req: Request): AuthContext {
  if (!req.auth || req.auth.role !== 'PLATFORM_ADMIN') {
    throw new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action');
  }
  return req.auth;
}
