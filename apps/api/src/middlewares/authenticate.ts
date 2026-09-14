import type { NextFunction, Request, Response } from 'express';
import { TokenExpiredError } from 'jsonwebtoken';
import { findUserById } from '../modules/users/user.repository';
import { AppError } from '../utils/appError';
import { verifyAccessToken } from '../modules/auth/jwt';

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  void authenticateRequest(req).then(next).catch(next);
}

async function authenticateRequest(req: Request): Promise<void> {
  const header = req.header('authorization');
  const match = header?.match(/^Bearer\s+(\S+)/i);
  if (!match) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }

  try {
    const claims = verifyAccessToken(match[1]);
    const user = await findUserById(claims.sub, claims.organizationId);
    if (!user || user.status !== 'ACTIVE') {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }
    req.auth = {
      userId: user.id,
      organizationId: String(user.organizationId),
      role: user.role,
      campusIds: (user.campusIds ?? []).map(String),
      classroomIds: (user.classroomIds ?? []).map(String),
    };
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    if (err instanceof TokenExpiredError) {
      throw new AppError(401, 'ACCESS_TOKEN_EXPIRED', 'Access token expired');
    }
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }
}
