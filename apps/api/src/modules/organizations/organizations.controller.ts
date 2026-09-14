import type { Request, Response } from 'express';
import { AppError } from '../../utils/appError';
import { requireAuth } from '../../utils/requireAuth';
import { findOrganizationById, updateOrganizationName } from './organization.repository';

function asName(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

export async function getCurrentOrganization(req: Request, res: Response): Promise<void> {
  const auth = requireAuth(req);
  const organization = await findOrganizationById(auth.organizationId);
  if (!organization) {
    throw new AppError(404, 'NOT_FOUND', 'Not Found');
  }
  res.status(200).json({
    id: organization.id,
    name: organization.name,
    status: organization.status,
  });
}

export async function patchCurrentOrganization(req: Request, res: Response): Promise<void> {
  const auth = requireAuth(req);
  const body = req.body as { name?: unknown; organizationId?: unknown };
  const name = asName(body.name);
  if (!name) {
    throw new AppError(422, 'VALIDATION_ERROR', 'name is required', [
      { field: 'name', message: 'Required' },
    ]);
  }

  const organization = await updateOrganizationName(auth.organizationId, name);
  if (!organization) {
    throw new AppError(404, 'NOT_FOUND', 'Not Found');
  }

  res.status(200).json({
    id: organization.id,
    name: organization.name,
    status: organization.status,
  });
}
