import type { NextFunction, Request, Response } from 'express';
import { TokenExpiredError } from 'jsonwebtoken';
import { findUserById, findUserByIdGlobal } from '../modules/users/user.repository';
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

    if (claims.role === 'PLATFORM_ADMIN') {
      const user = await findUserByIdGlobal(claims.sub);
      if (!user || user.status !== 'ACTIVE' || user.role !== 'PLATFORM_ADMIN') {
        throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
      }
      if (user.organizationId) {
        throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
      }
      req.auth = {
        userId: user.id,
        organizationId: '',
        role: 'PLATFORM_ADMIN',
        campusIds: [],
        classroomIds: [],
        routeIds: [],
      };
      return;
    }

    if (!claims.organizationId) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const user = await findUserById(claims.sub, claims.organizationId);
    if (!user || user.status !== 'ACTIVE') {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }
    if (user.role === 'PLATFORM_ADMIN') {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }
    req.auth = {
      userId: user.id,
      organizationId: String(user.organizationId),
      role: user.role,
      campusIds: (user.campusIds ?? []).map(String),
      classroomIds: (user.classroomIds ?? []).map(String),
      routeIds: (user.routeIds ?? []).map(String),
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
