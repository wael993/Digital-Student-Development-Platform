import type { NextFunction, Request, Response } from 'express';
import {
  DEFAULT_TIMEZONE,
  isOrganizationOperational,
} from '../modules/organizations/organization.model';
import { findOrganizationById } from '../modules/organizations/organization.repository';
import { AppError } from '../utils/appError';

export function tenantContext(req: Request, _res: Response, next: NextFunction): void {
  void loadTenant(req).then(next).catch(next);
}

async function loadTenant(req: Request): Promise<void> {
  if (!req.auth) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }

  // Platform admins are not tenant-scoped; tenant routes still fail authorize().
  if (req.auth.role === 'PLATFORM_ADMIN') {
    return;
  }

  if (!req.auth.organizationId) {
    throw new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action');
  }

  const organization = await findOrganizationById(req.auth.organizationId);
  if (!organization || !isOrganizationOperational(organization.status)) {
    throw tenantAccessError(organization?.status);
  }

  req.tenantTimezone = organization.timezone || DEFAULT_TIMEZONE;
}

function tenantAccessError(status: string | undefined): AppError {
  if (status === 'SUSPENDED') {
    return new AppError(403, 'TENANT_SUSPENDED', 'Organization account is suspended');
  }
  if (status === 'CANCELLED') {
    return new AppError(403, 'TENANT_CANCELLED', 'Organization account is cancelled');
  }
  if (status === 'INACTIVE') {
    return new AppError(403, 'TENANT_INACTIVE', 'Organization account is inactive');
  }
  return new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action');
}
