import {
  asTrimmedString,
  optionalEnum,
  optionalInt,
  optionalObjectId,
  optionalString,
  parsePagination,
  requireEnum,
  requireInt,
  requireObjectId,
  requireString,
  validationError,
} from '../../utils/validate';
import { isDateOnly } from '../../utils/timezone';
import { BUS_STATUSES } from './bus.model';
import { ROUTE_DIRECTIONS, ROUTE_STATUSES } from './bus-route.model';
import { STOP_PROGRESS_STATUSES } from './route-progress.model';
import { TRANSPORT_METHODS } from './daily-transport-plan.model';

const CLOCK = /^\d{2}:\d{2}$/;
const QR_TOKEN_MAX_LENGTH = 64;
const MAX_CANCEL_DAYS = 31;

export function parseCreateBus(body: Record<string, unknown>) {
  return {
    campusId: requireObjectId(body.campusId, 'campusId'),
    name: requireString(body.name, 'name'),
    registrationNumber: requireString(body.registrationNumber, 'registrationNumber'),
    capacity: requireInt(body.capacity, 'capacity', { min: 1, max: 100 }),
    status: optionalEnum(body.status, 'status', BUS_STATUSES),
    driverId: optionalObjectId(body.driverId, 'driverId'),
    supervisorId: optionalObjectId(body.supervisorId, 'supervisorId'),
  };
}

export function parsePatchBus(body: Record<string, unknown>) {
  const patch = {
    name: asTrimmedString(body.name),
    registrationNumber: asTrimmedString(body.registrationNumber),
    capacity: optionalInt(body.capacity, 'capacity', { min: 1, max: 100 }),
    status: optionalEnum(body.status, 'status', BUS_STATUSES),
    driverId: body.driverId === null ? null : optionalObjectId(body.driverId, 'driverId'),
    supervisorId:
      body.supervisorId === null ? null : optionalObjectId(body.supervisorId, 'supervisorId'),
  };
  if (
    !patch.name &&
    !patch.registrationNumber &&
    patch.capacity === undefined &&
    !patch.status &&
    patch.driverId === undefined &&
    patch.supervisorId === undefined
  ) {
    throw validationError('name', 'Required');
  }
  return patch;
}

export function parseCreateRoute(body: Record<string, unknown>) {
  return {
    campusId: optionalObjectId(body.campusId, 'campusId'),
    name: requireString(body.name, 'name'),
    busId: requireObjectId(body.busId, 'busId'),
    direction: requireEnum(body.direction, 'direction', ROUTE_DIRECTIONS),
    status: optionalEnum(body.status, 'status', ROUTE_STATUSES),
    estimatedStartTime: optionalClock(body.estimatedStartTime, 'estimatedStartTime'),
    estimatedEndTime: optionalClock(body.estimatedEndTime, 'estimatedEndTime'),
  };
}

export function parsePatchRoute(body: Record<string, unknown>) {
  const patch = {
    name: asTrimmedString(body.name),
    busId: optionalObjectId(body.busId, 'busId'),
    direction: optionalEnum(body.direction, 'direction', ROUTE_DIRECTIONS),
    status: optionalEnum(body.status, 'status', ROUTE_STATUSES),
    estimatedStartTime: optionalClock(body.estimatedStartTime, 'estimatedStartTime'),
    estimatedEndTime: optionalClock(body.estimatedEndTime, 'estimatedEndTime'),
  };
  if (
    !patch.name &&
    !patch.busId &&
    !patch.direction &&
    !patch.status &&
    !patch.estimatedStartTime &&
    !patch.estimatedEndTime
  ) {
    throw validationError('name', 'Required');
  }
  return patch;
}

export function parseCreateStop(body: Record<string, unknown>) {
  return {
    name: requireString(body.name, 'name'),
    address: optionalString(body.address, 'address'),
    latitude: optionalNumber(body.latitude, 'latitude'),
    longitude: optionalNumber(body.longitude, 'longitude'),
  };
}

export function parsePatchStop(body: Record<string, unknown>) {
  const patch = {
    name: asTrimmedString(body.name),
    address: optionalString(body.address, 'address'),
    sequence: optionalInt(body.sequence, 'sequence', { min: 1, max: 200 }),
    latitude: optionalNumber(body.latitude, 'latitude'),
    longitude: optionalNumber(body.longitude, 'longitude'),
  };
  if (
    !patch.name &&
    patch.address === undefined &&
    patch.sequence === undefined &&
    patch.latitude === undefined &&
    patch.longitude === undefined
  ) {
    throw validationError('name', 'Required');
  }
  return patch;
}

export function parseCreateSegment(body: Record<string, unknown>) {
  return {
    fromStopId: requireObjectId(body.fromStopId, 'fromStopId'),
    toStopId: requireObjectId(body.toStopId, 'toStopId'),
    estimatedMinutes: requireInt(body.estimatedMinutes, 'estimatedMinutes', { min: 0, max: 180 }),
  };
}

export function parsePatchSegment(body: Record<string, unknown>) {
  return {
    estimatedMinutes: requireInt(body.estimatedMinutes, 'estimatedMinutes', { min: 0, max: 180 }),
  };
}

export function parseRouteStudent(body: Record<string, unknown>) {
  return {
    studentId: requireObjectId(body.studentId, 'studentId'),
    stopId: requireObjectId(body.stopId, 'stopId'),
  };
}

export function parseCreateAssignment(body: Record<string, unknown>) {
  return {
    routeId: requireObjectId(body.routeId, 'routeId'),
    stopId: requireObjectId(body.stopId, 'stopId'),
    direction: optionalEnum(body.direction, 'direction', ROUTE_DIRECTIONS),
  };
}

export function parsePatchAssignment(body: Record<string, unknown>) {
  const patch = {
    stopId: optionalObjectId(body.stopId, 'stopId'),
    active: typeof body.active === 'boolean' ? body.active : undefined,
  };
  if (!patch.stopId && patch.active === undefined) {
    throw validationError('stopId', 'Required');
  }
  return patch;
}

export function parsePatchToday(body: Record<string, unknown>) {
  return {
    direction: requireEnum(body.direction, 'direction', ROUTE_DIRECTIONS),
    transportMethod: requireEnum(body.transportMethod, 'transportMethod', TRANSPORT_METHODS),
    reason: optionalString(body.reason, 'reason'),
  };
}

export function parseCancelBody(body: Record<string, unknown>) {
  const directions = parseDirections(body);
  const startDate = requireDateOnly(body.startDate, 'startDate');
  const endDate = requireDateOnly(body.endDate ?? body.startDate, 'endDate');
  if (endDate < startDate) {
    throw validationError('endDate', 'Must be on or after startDate');
  }
  const days =
    (Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86_400_000 + 1;
  if (days > MAX_CANCEL_DAYS) {
    throw validationError('endDate', `Range must be at most ${MAX_CANCEL_DAYS} days`);
  }
  return {
    directions,
    startDate,
    endDate,
    reason: optionalString(body.reason, 'reason'),
  };
}

export function parseProgressBody(body: Record<string, unknown>) {
  return {
    stopId: requireObjectId(body.stopId, 'stopId'),
    status: requireEnum(body.status, 'status', STOP_PROGRESS_STATUSES),
  };
}

export function parseBoardingBody(body: Record<string, unknown>) {
  const qrToken = requireString(body.qrToken, 'qrToken');
  if (qrToken.length > QR_TOKEN_MAX_LENGTH) {
    throw validationError('qrToken', `Must be at most ${QR_TOKEN_MAX_LENGTH} characters`);
  }
  return { qrToken };
}

export function parseArrivalBody(body: Record<string, unknown>) {
  const status = optionalEnum(body.status, 'status', ['NOT_PRESENT'] as const);
  const method = optionalEnum(body.method, 'method', ['BUS', 'PARENT_CAR'] as const);
  return { status, method };
}

export function parsePickupBody(body: Record<string, unknown>) {
  return {
    type: requireEnum(body.type, 'type', ['PARENT_PICKUP', 'AUTHORIZED_PICKUP'] as const),
    pickupPersonId: optionalObjectId(body.pickupPersonId, 'pickupPersonId'),
    reason: optionalString(body.reason, 'reason'),
  };
}

export function parseListQuery(query: Record<string, unknown>) {
  return {
    ...parsePagination(query),
    campusId: optionalObjectId(query.campusId, 'campusId'),
    busId: optionalObjectId(query.busId, 'busId'),
    direction: optionalEnum(query.direction, 'direction', ROUTE_DIRECTIONS),
  };
}

function parseDirections(body: Record<string, unknown>): Array<(typeof ROUTE_DIRECTIONS)[number]> {
  if (Array.isArray(body.directions)) {
    const values = body.directions.map((value) =>
      requireEnum(value, 'directions', ROUTE_DIRECTIONS),
    );
    if (values.length === 0) {
      throw validationError('directions', 'Required');
    }
    return [...new Set(values)];
  }
  return [requireEnum(body.direction, 'direction', ROUTE_DIRECTIONS)];
}

function requireDateOnly(value: unknown, field: string): string {
  const parsed = requireString(value, field);
  if (!isDateOnly(parsed)) {
    throw validationError(field, 'Must be YYYY-MM-DD');
  }
  return parsed;
}

function optionalClock(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = requireString(value, field);
  if (!CLOCK.test(parsed)) {
    throw validationError(field, 'Must be HH:mm');
  }
  const [hours, minutes] = parsed.split(':').map(Number);
  if (hours > 23 || minutes > 59) {
    throw validationError(field, 'Must be HH:mm');
  }
  return parsed;
}

function optionalNumber(value: unknown, field: string): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) {
    throw validationError(field, 'Must be a number');
  }
  return n;
}
