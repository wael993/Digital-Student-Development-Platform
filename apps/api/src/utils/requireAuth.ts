import type { Request } from 'express';
import type { AuthContext } from '../types';
import { AppError } from './appError';

export function requireAuth(req: Request): AuthContext {
  if (!req.auth) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  return req.auth;
}
