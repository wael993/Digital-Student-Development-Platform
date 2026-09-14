import type { NextFunction, Request, Response } from 'express';
import { hasPermission, type Permission } from '../authorization/permissions';
import { AppError } from '../utils/appError';

export function authorize(permission: Permission) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      next(new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
      return;
    }

    if (!hasPermission(req.auth.role, permission)) {
      next(new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action'));
      return;
    }

    next();
  };
}
