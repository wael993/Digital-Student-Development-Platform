import type { Request, Response } from 'express';
import { DEFAULT_TIMEZONE } from '../organizations/organization.model';
import { requireAuth } from '../../utils/requireAuth';
import * as attendanceService from './attendance.service';
import { parseAttendanceListQuery, parseScanBody } from './attendance.validation';

function tenantTimezone(req: Request): string {
  return req.tenantTimezone || DEFAULT_TIMEZONE;
}

export async function postScan(req: Request, res: Response): Promise<void> {
  const { qrToken } = parseScanBody(req.body);
  const result = await attendanceService.scan(requireAuth(req), qrToken, tenantTimezone(req));
  res.status(result.status === 'RECORDED' ? 201 : 200).json(result);
}

export async function getAttendance(req: Request, res: Response): Promise<void> {
  const query = parseAttendanceListQuery(req.query);
  const result = await attendanceService.list(requireAuth(req), query, tenantTimezone(req));
  res.status(200).json(result);
}
