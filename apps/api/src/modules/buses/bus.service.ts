import type { AuthContext } from '../../types';
import { assertAssigned } from '../../authorization/scope';
import { AppError } from '../../utils/appError';
import { conflict, notFound, validationError } from '../../utils/validate';
import { calendarDateInTimeZone } from '../../utils/timezone';
import { findCampusById } from '../campuses/campus.repository';
import { findUserById, addUserRouteId, pullUserRouteId } from '../users/user.repository';
import { findActiveStudentsByCampus, findStudentById } from '../students/student.repository';
import { assertStudentReadable } from '../students/student.service';
import type { Bus, BusStatus } from './bus.model';
import type { BusRoute, RouteDirection, RouteStatus } from './bus-route.model';
import type { BusStop } from './bus-stop.model';
import type { RouteSegment } from './route-segment.model';
import {
  countActiveAssignmentsForRoute,
  createAssignment,
  deactivateActiveAssignment,
  deactivateAssignment,
  deactivateAssignmentsForStop,
  findActiveAssignment,
  findAssignmentById,
  listActiveAssignmentsForRoute,
  listAssignmentsForStudent,
  updateAssignment,
} from './assignment.repository';
import {
  createBus,
  createRoute,
  createSegment,
  createStop,
  deleteSegmentsForStop,
  deleteStop,
  findBusById,
  findRouteById,
  findSegment,
  findSegmentById,
  findStopById,
  listBuses,
  listRoutes,
  listRouteIdsForBus,
  listSegmentsForRoute,
  listStopsForRoute,
  nextStopSequence,
  resequenceStops,
  updateBus,
  updateRoute,
  updateSegment,
  updateStop,
} from './bus.repository';

const DEFAULT_SEGMENT_MINUTES = 5;

export function toBusJson(bus: Bus & { id: string }) {
  return {
    id: bus.id,
    campusId: String(bus.campusId),
    name: bus.name,
    registrationNumber: bus.registrationNumber,
    capacity: bus.capacity,
    status: bus.status,
    driverId: bus.driverId ? String(bus.driverId) : null,
    supervisorId: bus.supervisorId ? String(bus.supervisorId) : null,
    createdAt: bus.createdAt.toISOString(),
    updatedAt: bus.updatedAt.toISOString(),
  };
}

export function toRouteJson(route: BusRoute & { id: string }) {
  return {
    id: route.id,
    campusId: String(route.campusId),
    busId: String(route.busId),
    name: route.name,
    direction: route.direction,
    status: route.status,
    estimatedStartTime: route.estimatedStartTime ?? null,
    estimatedEndTime: route.estimatedEndTime ?? null,
    createdAt: route.createdAt.toISOString(),
    updatedAt: route.updatedAt.toISOString(),
  };
}

export function toStopJson(stop: BusStop & { id: string }) {
  return {
    id: stop.id,
    routeId: String(stop.routeId),
    sequence: stop.sequence,
    name: stop.name,
    address: stop.address ?? null,
    latitude: stop.latitude ?? null,
    longitude: stop.longitude ?? null,
  };
}

export function toSegmentJson(segment: RouteSegment & { id: string }) {
  return {
    id: segment.id,
    routeId: String(segment.routeId),
    fromStopId: String(segment.fromStopId),
    toStopId: String(segment.toStopId),
    estimatedMinutes: segment.estimatedMinutes,
  };
}

export function toAssignmentJson(row: {
  id: string;
  studentId: { toString(): string };
  routeId: { toString(): string };
  stopId: { toString(): string };
  direction: RouteDirection;
  active: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
}) {
  return {
    id: row.id,
    studentId: String(row.studentId),
    routeId: String(row.routeId),
    stopId: String(row.stopId),
    direction: row.direction,
    active: row.active,
    effectiveFrom: row.effectiveFrom,
    effectiveTo: row.effectiveTo ?? null,
  };
}

export async function createBusRecord(
  auth: AuthContext,
  input: {
    campusId: string;
    name: string;
    registrationNumber: string;
    capacity: number;
    status?: BusStatus;
    driverId?: string;
    supervisorId?: string;
  },
) {
  assertCanManage(auth);
  await requireCampus(auth, input.campusId);
  await requireStaffRole(auth, input.driverId, 'DRIVER', 'driverId');
  await requireStaffRole(auth, input.supervisorId, 'SUPERVISOR', 'supervisorId');
  const bus = await createBus(auth.organizationId, input);
  await syncBusDriverRoutes(auth.organizationId, bus.id);
  return bus;
}

export async function listBusRecords(
  auth: AuthContext,
  opts: { campusId?: string; page: number; limit: number; skip: number },
) {
  const extra = busListFilter(auth, opts.campusId);
  if (extra === null) {
    return { items: [], total: 0, page: opts.page, limit: opts.limit };
  }
  const result = await listBuses(auth.organizationId, extra, opts.skip, opts.limit);
  return { ...result, page: opts.page, limit: opts.limit };
}

export async function getBusRecord(auth: AuthContext, busId: string) {
  const bus = await findBusById(auth.organizationId, busId);
  if (!bus) {
    throw notFound();
  }
  await assertBusReadable(auth, bus);
  return bus;
}

export async function patchBusRecord(
  auth: AuthContext,
  busId: string,
  input: {
    name?: string;
    registrationNumber?: string;
    capacity?: number;
    status?: BusStatus;
    driverId?: string | null;
    supervisorId?: string | null;
  },
) {
  assertCanManage(auth);
  const existing = await findBusById(auth.organizationId, busId);
  if (!existing) {
    throw notFound();
  }
  await assertCampusAssigned(auth, String(existing.campusId));
  if (input.driverId) {
    await requireStaffRole(auth, input.driverId, 'DRIVER', 'driverId');
  }
  if (input.supervisorId) {
    await requireStaffRole(auth, input.supervisorId, 'SUPERVISOR', 'supervisorId');
  }
  const updated = await updateBus(auth.organizationId, busId, input);
  if (!updated) {
    throw notFound();
  }
  await syncBusDriverRoutes(auth.organizationId, busId);
  return updated;
}

export async function createRouteRecord(
  auth: AuthContext,
  input: {
    campusId?: string;
    name: string;
    busId: string;
    direction: RouteDirection;
    status?: RouteStatus;
    estimatedStartTime?: string;
    estimatedEndTime?: string;
  },
) {
  assertCanManage(auth);
  const bus = await requireBus(auth, input.busId);
  await assertCampusAssigned(auth, String(bus.campusId));
  if (input.campusId && input.campusId !== String(bus.campusId)) {
    throw validationError('campusId', 'Must match the bus campus');
  }
  const route = await createRoute(auth.organizationId, {
    ...input,
    campusId: String(bus.campusId),
  });
  if (bus.driverId) {
    await addUserRouteId(auth.organizationId, String(bus.driverId), route.id);
  }
  return route;
}

export async function listRouteRecords(
  auth: AuthContext,
  opts: {
    campusId?: string;
    busId?: string;
    direction?: RouteDirection;
    page: number;
    limit: number;
    skip: number;
  },
) {
  const extra = await routeListFilter(auth, opts);
  if (extra === null) {
    return { items: [], total: 0, page: opts.page, limit: opts.limit };
  }
  const result = await listRoutes(auth.organizationId, extra, opts.skip, opts.limit);
  return { ...result, page: opts.page, limit: opts.limit };
}

export async function getRouteRecord(auth: AuthContext, routeId: string) {
  return requireRoute(auth, routeId, false);
}

export async function patchRouteRecord(
  auth: AuthContext,
  routeId: string,
  input: {
    name?: string;
    busId?: string;
    direction?: RouteDirection;
    status?: RouteStatus;
    estimatedStartTime?: string;
    estimatedEndTime?: string;
  },
) {
  assertCanManage(auth);
  const existing = await requireRoute(auth, routeId, true);
  if (input.busId && input.busId !== String(existing.busId)) {
    const bus = await requireBus(auth, input.busId);
    await assertCampusAssigned(auth, String(bus.campusId));
    await pullUserRouteId(auth.organizationId, routeId);
    const updated = await updateRoute(auth.organizationId, routeId, {
      ...input,
      busId: input.busId,
    });
    if (bus.driverId) {
      await addUserRouteId(auth.organizationId, String(bus.driverId), routeId);
    }
    if (!updated) {
      throw notFound();
    }
    return updated;
  }
  const updated = await updateRoute(auth.organizationId, routeId, input);
  if (!updated) {
    throw notFound();
  }
  return updated;
}

export async function addStop(
  auth: AuthContext,
  routeId: string,
  input: { name: string; address?: string; latitude?: number; longitude?: number },
) {
  assertCanManage(auth);
  const route = await requireRoute(auth, routeId, true);
  const sequence = await nextStopSequence(auth.organizationId, route.id);
  const previous =
    sequence > 1 ? (await listStopsForRoute(auth.organizationId, route.id)).at(-1) : undefined;
  const stop = await createStop(auth.organizationId, { ...input, routeId: route.id, sequence });
  if (previous) {
    // note: default 5 min until supervisor PATCHes the segment.
    await createSegment(auth.organizationId, {
      routeId: route.id,
      fromStopId: previous.id,
      toStopId: stop.id,
      estimatedMinutes: DEFAULT_SEGMENT_MINUTES,
    });
  }
  return stop;
}

export async function listStops(auth: AuthContext, routeId: string) {
  const route = await requireRoute(auth, routeId, false);
  return listStopsForRoute(auth.organizationId, route.id);
}

export async function patchStopRecord(
  auth: AuthContext,
  stopId: string,
  input: {
    name?: string;
    address?: string;
    sequence?: number;
    latitude?: number;
    longitude?: number;
  },
) {
  assertCanManage(auth);
  const stop = await findStopById(auth.organizationId, stopId);
  if (!stop) {
    throw notFound();
  }
  await requireRoute(auth, String(stop.routeId), true);
  if (input.sequence && input.sequence !== stop.sequence) {
    await swapStopSequence(auth.organizationId, String(stop.routeId), stop, input.sequence);
  }
  const updated = await updateStop(auth.organizationId, stopId, {
    name: input.name,
    address: input.address,
    latitude: input.latitude,
    longitude: input.longitude,
  });
  if (!updated) {
    throw notFound();
  }
  return updated;
}

export async function removeStop(auth: AuthContext, stopId: string) {
  assertCanManage(auth);
  const stop = await findStopById(auth.organizationId, stopId);
  if (!stop) {
    throw notFound();
  }
  await requireRoute(auth, String(stop.routeId), true);
  await deactivateAssignmentsForStop(auth.organizationId, stop.id);
  await deleteSegmentsForStop(auth.organizationId, String(stop.routeId), stop.id);
  await deleteStop(auth.organizationId, stop.id);
  await resequenceStops(auth.organizationId, String(stop.routeId));
  await rebuildAdjacentSegments(auth.organizationId, String(stop.routeId));
}

export async function addSegment(
  auth: AuthContext,
  routeId: string,
  input: { fromStopId: string; toStopId: string; estimatedMinutes: number },
) {
  assertCanManage(auth);
  const route = await requireRoute(auth, routeId, true);
  const from = await requireStopOnRoute(auth.organizationId, route.id, input.fromStopId);
  const to = await requireStopOnRoute(auth.organizationId, route.id, input.toStopId);
  if (from.id === to.id) {
    throw validationError('toStopId', 'Must be a different stop');
  }
  const existing = await findSegment(auth.organizationId, route.id, from.id, to.id);
  if (existing) {
    throw conflict('Segment already exists');
  }
  return createSegment(auth.organizationId, {
    routeId: route.id,
    fromStopId: from.id,
    toStopId: to.id,
    estimatedMinutes: input.estimatedMinutes,
  });
}

export async function listSegments(auth: AuthContext, routeId: string) {
  const route = await requireRoute(auth, routeId, false);
  return listSegmentsForRoute(auth.organizationId, route.id);
}

export async function patchSegmentRecord(
  auth: AuthContext,
  segmentId: string,
  input: { estimatedMinutes: number },
) {
  assertCanManage(auth);
  const segment = await findSegmentById(auth.organizationId, segmentId);
  if (!segment) {
    throw notFound();
  }
  await requireRoute(auth, String(segment.routeId), true);
  const updated = await updateSegment(auth.organizationId, segmentId, input);
  if (!updated) {
    throw notFound();
  }
  return updated;
}

export async function addRouteStudent(
  auth: AuthContext,
  routeId: string,
  input: { studentId: string; stopId: string },
  timeZone: string,
) {
  assertCanManage(auth);
  const route = await requireRoute(auth, routeId, true);
  const stop = await requireStopOnRoute(auth.organizationId, route.id, input.stopId);
  const student = await findStudentById(auth.organizationId, input.studentId);
  if (!student || student.status !== 'ACTIVE') {
    throw notFound();
  }
  await assertStudentReadable(auth, student);
  if (String(student.campusId) !== String(route.campusId)) {
    throw validationError('studentId', 'Student is not on this campus');
  }
  const bus = await requireBus(auth, String(route.busId));
  const currentCount = await countActiveAssignmentsForRoute(auth.organizationId, route.id);
  const existing = await findActiveAssignment(auth.organizationId, student.id, route.direction);
  if (existing && String(existing.routeId) !== route.id && currentCount >= bus.capacity) {
    throw validationError('studentId', 'Route is at capacity');
  }
  if (!existing && currentCount >= bus.capacity) {
    throw validationError('studentId', 'Route is at capacity');
  }
  if (existing) {
    if (String(existing.routeId) === route.id) {
      const updated = await updateAssignment(auth.organizationId, existing.id, { stopId: stop.id });
      return updated ?? existing;
    }
    await deactivateActiveAssignment(auth.organizationId, student.id, route.direction);
  }
  return createAssignment(auth.organizationId, {
    studentId: student.id,
    routeId: route.id,
    stopId: stop.id,
    direction: route.direction,
    effectiveFrom: calendarDateInTimeZone(new Date(), timeZone),
  });
}

export async function removeRouteStudent(auth: AuthContext, routeId: string, studentId: string) {
  assertCanManage(auth);
  const route = await requireRoute(auth, routeId, true);
  const existing = await findActiveAssignment(auth.organizationId, studentId, route.direction);
  if (!existing || String(existing.routeId) !== route.id) {
    throw notFound();
  }
  await deactivateAssignment(auth.organizationId, existing.id);
}

export async function listRouteStudents(auth: AuthContext, routeId: string) {
  const route = await requireRoute(auth, routeId, false);
  const [stops, assignments, campusStudents] = await Promise.all([
    listStopsForRoute(auth.organizationId, route.id),
    listActiveAssignmentsForRoute(auth.organizationId, route.id),
    findActiveStudentsByCampus(auth.organizationId, String(route.campusId)),
  ]);
  const assignedIds = new Set(assignments.map((row) => String(row.studentId)));
  const studentsById = new Map(campusStudents.map((student) => [student.id, student]));
  return {
    stops: stops.map((stop) => ({
      ...toStopJson(stop),
      students: assignments
        .filter((row) => String(row.stopId) === stop.id)
        .flatMap((row) => {
          const student = studentsById.get(String(row.studentId));
          return student
            ? [
                {
                  assignmentId: row.id,
                  id: student.id,
                  firstName: student.firstName,
                  lastName: student.lastName,
                },
              ]
            : [];
        }),
    })),
    unassigned: campusStudents
      .filter((student) => !assignedIds.has(student.id))
      .map((student) => ({
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
      })),
  };
}

export async function createStudentAssignment(
  auth: AuthContext,
  studentId: string,
  input: { routeId: string; stopId: string; direction?: RouteDirection },
  timeZone: string,
) {
  const route = await requireRoute(auth, input.routeId, true);
  if (input.direction && input.direction !== route.direction) {
    throw validationError('direction', 'Must match the route direction');
  }
  return addRouteStudent(auth, route.id, { studentId, stopId: input.stopId }, timeZone);
}

export async function listStudentAssignments(auth: AuthContext, studentId: string) {
  const student = await findStudentById(auth.organizationId, studentId);
  if (!student) {
    throw notFound();
  }
  await assertStudentReadable(auth, student);
  return listAssignmentsForStudent(auth.organizationId, student.id);
}

export async function patchStudentAssignment(
  auth: AuthContext,
  studentId: string,
  assignmentId: string,
  input: { stopId?: string; active?: boolean },
) {
  assertCanManage(auth);
  const assignment = await findAssignmentById(auth.organizationId, assignmentId);
  if (!assignment || String(assignment.studentId) !== studentId) {
    throw notFound();
  }
  await requireRoute(auth, String(assignment.routeId), true);
  if (input.stopId) {
    await requireStopOnRoute(auth.organizationId, String(assignment.routeId), input.stopId);
  }
  const updated = await updateAssignment(auth.organizationId, assignmentId, input);
  if (!updated) {
    throw notFound();
  }
  return updated;
}

export async function deleteStudentAssignment(
  auth: AuthContext,
  studentId: string,
  assignmentId: string,
) {
  assertCanManage(auth);
  const assignment = await findAssignmentById(auth.organizationId, assignmentId);
  if (!assignment || String(assignment.studentId) !== studentId) {
    throw notFound();
  }
  await requireRoute(auth, String(assignment.routeId), true);
  await deactivateAssignment(auth.organizationId, assignmentId);
}

export async function requireRoute(auth: AuthContext, routeId: string, manage: boolean) {
  const route = await findRouteById(auth.organizationId, routeId);
  if (!route) {
    throw notFound();
  }
  if (manage) {
    assertCanManage(auth);
    await assertCampusAssigned(auth, String(route.campusId));
  } else {
    await assertRouteReadable(auth, route);
  }
  return route as BusRoute & { id: string };
}

export async function requireStopOnRoute(organizationId: string, routeId: string, stopId: string) {
  const stop = await findStopById(organizationId, stopId);
  if (!stop || String(stop.routeId) !== routeId) {
    throw notFound();
  }
  return stop as BusStop & { id: string };
}

function assertCanManage(auth: AuthContext) {
  if (auth.role !== 'ADMIN' && auth.role !== 'SUPERVISOR') {
    throw new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action');
  }
}

async function requireCampus(auth: AuthContext, campusId: string) {
  const campus = await findCampusById(auth.organizationId, campusId);
  if (!campus || campus.status !== 'ACTIVE') {
    throw validationError('campusId', 'Campus not found');
  }
  await assertCampusAssigned(auth, campusId);
  return campus;
}

async function requireBus(auth: AuthContext, busId: string) {
  const bus = await findBusById(auth.organizationId, busId);
  if (!bus) {
    throw validationError('busId', 'Bus not found');
  }
  return bus as Bus & { id: string };
}

async function requireStaffRole(
  auth: AuthContext,
  userId: string | undefined,
  role: 'DRIVER' | 'SUPERVISOR',
  field: string,
) {
  if (!userId) {
    return;
  }
  const user = await findUserById(userId, auth.organizationId);
  if (!user || user.role !== role || user.status !== 'ACTIVE') {
    throw validationError(field, `Must be an active ${role.toLowerCase()}`);
  }
}

async function assertCampusAssigned(auth: AuthContext, campusId: string) {
  if (auth.role === 'ADMIN') {
    return;
  }
  if (auth.role === 'SUPERVISOR') {
    assertAssigned(auth, campusId, auth.campusIds);
    return;
  }
  throw new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action');
}

async function assertBusReadable(auth: AuthContext, bus: Bus & { id: string }) {
  if (auth.role === 'ADMIN') {
    return;
  }
  if (auth.role === 'SUPERVISOR') {
    assertAssigned(auth, String(bus.campusId), auth.campusIds);
    return;
  }
  if (auth.role === 'DRIVER') {
    if (bus.driverId && String(bus.driverId) === auth.userId) {
      return;
    }
    const routeIds = await listRouteIdsForBus(auth.organizationId, bus.id);
    if (routeIds.some((id) => auth.routeIds.includes(id))) {
      return;
    }
    throw notFound();
  }
  throw notFound();
}

async function assertRouteReadable(auth: AuthContext, route: BusRoute & { id: string }) {
  if (auth.role === 'ADMIN') {
    return;
  }
  if (auth.role === 'SUPERVISOR') {
    assertAssigned(auth, String(route.campusId), auth.campusIds);
    return;
  }
  if (auth.role === 'DRIVER') {
    assertAssigned(auth, route.id, auth.routeIds);
    return;
  }
  throw notFound();
}

function busListFilter(auth: AuthContext, campusId?: string): Record<string, unknown> | null {
  const extra: Record<string, unknown> = {};
  if (campusId) extra.campusId = campusId;
  if (auth.role === 'ADMIN') {
    return extra;
  }
  if (auth.role === 'SUPERVISOR') {
    if (auth.campusIds.length === 0) return null;
    if (campusId && !auth.campusIds.includes(campusId)) return null;
    extra.campusId = campusId ?? { $in: auth.campusIds };
    return extra;
  }
  if (auth.role === 'DRIVER') {
    extra.driverId = auth.userId;
    return extra;
  }
  return null;
}

async function routeListFilter(
  auth: AuthContext,
  opts: { campusId?: string; busId?: string; direction?: RouteDirection },
): Promise<Record<string, unknown> | null> {
  const extra: Record<string, unknown> = {};
  if (opts.campusId) extra.campusId = opts.campusId;
  if (opts.busId) extra.busId = opts.busId;
  if (opts.direction) extra.direction = opts.direction;
  if (auth.role === 'ADMIN') {
    return extra;
  }
  if (auth.role === 'SUPERVISOR') {
    if (auth.campusIds.length === 0) return null;
    if (opts.campusId && !auth.campusIds.includes(opts.campusId)) return null;
    extra.campusId = opts.campusId ?? { $in: auth.campusIds };
    return extra;
  }
  if (auth.role === 'DRIVER') {
    if (auth.routeIds.length === 0) return null;
    extra._id = { $in: auth.routeIds };
    return extra;
  }
  return null;
}

async function syncBusDriverRoutes(organizationId: string, busId: string) {
  const routeIds = await listRouteIdsForBus(organizationId, busId);
  for (const routeId of routeIds) {
    await pullUserRouteId(organizationId, routeId);
  }
  const bus = await findBusById(organizationId, busId);
  if (!bus?.driverId) {
    return;
  }
  for (const routeId of routeIds) {
    await addUserRouteId(organizationId, String(bus.driverId), routeId);
  }
}

async function swapStopSequence(
  organizationId: string,
  routeId: string,
  stop: BusStop & { id: string },
  sequence: number,
) {
  const stops = await listStopsForRoute(organizationId, routeId);
  if (sequence < 1 || sequence > stops.length) {
    throw validationError('sequence', 'Is out of range');
  }
  const other = stops.find((row) => row.sequence === sequence);
  if (other) {
    const temp = stops.length + 100;
    await updateStop(organizationId, other.id, { sequence: temp });
    await updateStop(organizationId, stop.id, { sequence });
    await updateStop(organizationId, other.id, { sequence: stop.sequence });
    return;
  }
  await updateStop(organizationId, stop.id, { sequence });
}

async function rebuildAdjacentSegments(organizationId: string, routeId: string) {
  const stops = await listStopsForRoute(organizationId, routeId);
  const existing = await listSegmentsForRoute(organizationId, routeId);
  for (let i = 0; i < stops.length - 1; i += 1) {
    const fromId = stops[i].id;
    const toId = stops[i + 1].id;
    const found = existing.find(
      (row) => String(row.fromStopId) === fromId && String(row.toStopId) === toId,
    );
    if (!found) {
      await createSegment(organizationId, {
        routeId,
        fromStopId: fromId,
        toStopId: toId,
        estimatedMinutes: DEFAULT_SEGMENT_MINUTES,
      });
    }
  }
}
