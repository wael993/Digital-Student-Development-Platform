import type { NextFunction, Request, Response } from 'express';
import { findOrganizationById } from '../modules/organizations/organization.repository';
import { AppError } from '../utils/appError';

export function tenantContext(req: Request, _res: Response, next: NextFunction): void {
  void loadTenant(req).then(next).catch(next);
}

async function loadTenant(req: Request): Promise<void> {
  if (!req.auth) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }

  const organization = await findOrganizationById(req.auth.organizationId);
  if (!organization || organization.status !== 'ACTIVE') {
    throw new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action');
  }
}
