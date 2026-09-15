import mongoose from 'mongoose';
import {
  notFound,
  optionalBoolean,
  optionalString,
  parsePagination,
  requireEnum,
  requireString,
} from '../../utils/validate';
import { DEVICE_PLATFORMS } from './device-token.model';

export function parseDeviceIdParam(value: unknown): string {
  const parsed = typeof value === 'string' ? value.trim() : '';
  if (!parsed) {
    throw notFound();
  }
  return parsed;
}

export function parseNotificationIdParam(value: unknown): string {
  if (typeof value !== 'string' || !mongoose.isValidObjectId(value)) {
    throw notFound();
  }
  return value;
}

export function parseRegisterDevice(body: {
  token?: unknown;
  platform?: unknown;
  deviceId?: unknown;
  appVersion?: unknown;
  userId?: unknown;
  organizationId?: unknown;
}) {
  return {
    token: requireString(body.token, 'token'),
    platform: requireEnum(body.platform, 'platform', DEVICE_PLATFORMS),
    deviceId: requireString(body.deviceId, 'deviceId'),
    appVersion: optionalString(body.appVersion, 'appVersion'),
  };
}

export function parsePreferencePatch(body: {
  journeyUpdates?: unknown;
  studentArrival?: unknown;
  studentDeparture?: unknown;
  homeDropoff?: unknown;
  mediaAvailable?: unknown;
}) {
  const patch = {
    journeyUpdates: optionalBoolean(body.journeyUpdates, 'journeyUpdates'),
    studentArrival: optionalBoolean(body.studentArrival, 'studentArrival'),
    studentDeparture: optionalBoolean(body.studentDeparture, 'studentDeparture'),
    homeDropoff: optionalBoolean(body.homeDropoff, 'homeDropoff'),
    mediaAvailable: optionalBoolean(body.mediaAvailable, 'mediaAvailable'),
  };
  return Object.fromEntries(
    Object.entries(patch).filter(([, value]) => value !== undefined),
  ) as typeof patch;
}

export function parseNotificationListQuery(query: { page?: unknown; limit?: unknown }) {
  return parsePagination(query);
}
