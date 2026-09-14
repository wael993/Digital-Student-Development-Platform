import type { Request, Response } from 'express';
import { AppError } from '../../utils/appError';
import { requireAuth } from '../../utils/requireAuth';
import { isValidTimeZone } from '../../utils/timezone';
import { DEFAULT_TIMEZONE } from './organization.model';
import { findOrganizationById, updateOrganization } from './organization.repository';

function asName(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

function asTimezone(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (typeof value !== 'string' || !isValidTimeZone(value.trim())) {
    throw new AppError(422, 'VALIDATION_ERROR', 'timezone is invalid', [
      { field: 'timezone', message: 'Must be a valid IANA timezone' },
    ]);
  }
  return value.trim();
}

export async function getCurrentOrganization(req: Request, res: Response): Promise<void> {
  const auth = requireAuth(req);
  const organization = await findOrganizationById(auth.organizationId);
  if (!organization) {
    throw new AppError(404, 'NOT_FOUND', 'Not Found');
  }
  res.status(200).json(toOrganizationJson(organization));
}

export async function patchCurrentOrganization(req: Request, res: Response): Promise<void> {
  const auth = requireAuth(req);
  const body = req.body as { name?: unknown; timezone?: unknown; organizationId?: unknown };
  const name = asName(body.name);
  const timezone = asTimezone(body.timezone);
  if (!name && !timezone) {
    throw new AppError(422, 'VALIDATION_ERROR', 'name is required', [
      { field: 'name', message: 'Required' },
    ]);
  }

  const organization = await updateOrganization(auth.organizationId, {
    ...(name ? { name } : {}),
    ...(timezone ? { timezone } : {}),
  });
  if (!organization) {
    throw new AppError(404, 'NOT_FOUND', 'Not Found');
  }

  res.status(200).json(toOrganizationJson(organization));
}

function toOrganizationJson(organization: {
  id: string;
  name: string;
  status: string;
  timezone: string;
}) {
  return {
    id: organization.id,
    name: organization.name,
    status: organization.status,
    timezone: organization.timezone || DEFAULT_TIMEZONE,
  };
}
