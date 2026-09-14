import type { Request, Response } from 'express';
import { DEFAULT_TIMEZONE } from '../organizations/organization.model';
import { requireAuth } from '../../utils/requireAuth';
import * as journeyService from './journey.service';
import { parseCreateEvent, parseEventListQuery } from './journey.validation';

function tenantTimezone(req: Request): string {
  return req.tenantTimezone || DEFAULT_TIMEZONE;
}

export async function postEvent(req: Request, res: Response): Promise<void> {
  const event = await journeyService.createEvent(
    requireAuth(req),
    req.params.studentId,
    parseCreateEvent(req.body),
    tenantTimezone(req),
  );
  res.status(201).json(event);
}

export async function getEvents(req: Request, res: Response): Promise<void> {
  const events = await journeyService.listEvents(
    requireAuth(req),
    req.params.studentId,
    parseEventListQuery(req.query),
    tenantTimezone(req),
  );
  res.status(200).json({ data: events });
}

export async function getTodayJourney(req: Request, res: Response): Promise<void> {
  const journey = await journeyService.getToday(
    requireAuth(req),
    req.params.studentId,
    tenantTimezone(req),
  );
  res.status(200).json(journey);
}
