import type { Request, Response } from 'express';
import { DEFAULT_TIMEZONE } from '../organizations/organization.model';
import { AppError } from '../../utils/appError';
import { requireAuth } from '../../utils/requireAuth';
import * as parentService from './parent.service';
import { parseStudentId } from './parent.validation';
import { parseMediaListQuery } from '../media/media.validation';

function tenantTimezone(req: Request): string {
  return req.tenantTimezone || DEFAULT_TIMEZONE;
}

export async function getChildren(req: Request, res: Response): Promise<void> {
  const result = await parentService.getChildren(requireAuth(req));
  res.status(200).json(result);
}

export async function getDashboard(req: Request, res: Response): Promise<void> {
  const result = await parentService.getChildDashboard(
    requireAuth(req),
    parseStudentId(req.params.studentId),
    tenantTimezone(req),
  );
  res.status(200).json(result);
}

export async function getJourneyToday(req: Request, res: Response): Promise<void> {
  const result = await parentService.getChildJourneyToday(
    requireAuth(req),
    parseStudentId(req.params.studentId),
    tenantTimezone(req),
  );
  res.status(200).json(result);
}

export async function getChildMedia(req: Request, res: Response): Promise<void> {
  const result = await parentService.getChildMedia(
    requireAuth(req),
    parseStudentId(req.params.studentId),
    parseMediaListQuery(req.query),
    tenantTimezone(req),
  );
  res.status(200).json(result);
}

export async function rejectWrite(): Promise<void> {
  throw new AppError(405, 'METHOD_NOT_ALLOWED', 'Method Not Allowed');
}
