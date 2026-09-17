import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/appError';

/** Platform routes only. Tenant roles always get 403. */
export function requirePlatformAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.auth) {
    next(new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
    return;
  }
  if (req.auth.role !== 'PLATFORM_ADMIN') {
    next(new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action'));
    return;
  }
  next();
}
