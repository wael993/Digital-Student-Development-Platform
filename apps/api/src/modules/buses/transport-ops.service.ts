import type { AuthContext } from '../../types';
import { AppError } from '../../utils/appError';
import { notFound, validationError } from '../../utils/validate';
import {
  calendarDateInTimeZone,
  eachDateInclusive,
  formatClockInTimeZone,
  utcRangeForCalendarDate,
} from '../../utils/timezone';
import { findClassroomById } from '../classrooms/classroom.repository';
import {
  findActiveStudentsByClassroom,
  findStudentById,
  findStudentByQrToken,
  findStudentsByIds,
} from '../students/student.repository';
import { assertStudentReadable } from '../students/student.service';
import { listPickupLinksForStudent } from '../guardians/guardian.repository';
import { listStudentEvents } from '../journey/student-event.repository';
import { hasEventOfTypeToday, recordJourneyEvent } from '../journey/journey.service';
import { ensurePresentAttendance } from '../attendance/attendance.service';
import { notifyJourneyUpdate } from '../notifications/notification.service';
import { logger } from '../../utils/logger';
import type { RouteDirection } from './bus-route.model';
import type { StopProgressStatus } from './route-progress.model';
import type { TransportMethod } from './daily-transport-plan.model';
import { calculateEta } from './eta';
import { requireRoute, requireStopOnRoute, toRouteJson, toStopJson } from './bus.service';
import {
  findBusById,
  findRouteById,
  listSegmentsForRoute,
  listStopsForRoute,
} from './bus.repository';
import {
  findActiveAssignment,
  findDailyPlan,
  listActiveAssignmentsForRoute,
  listActiveAssignmentsForStop,
  listCancelledStudentIds,
  listDailyPlansForStudentDate,
  upsertDailyPlan,
} from './assignment.repository';
import {
  createProgress,
  findLatestProgressForRoute,
  hasNotifiedStop,
  listProgressForRouteDate,
  markProgressNotified,
} from './progress.repository';

function assertOperator(auth: AuthContext) {
  if (
    auth.role !== 'ADMIN' &&
    auth.role !== 'SUPERVISOR' &&
    auth.role !== 'TEACHER' &&
    auth.role !== 'DRIVER'
  ) {
    throw new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action');
  }
}

function assertDriverOrSupervisor(auth: AuthContext) {
  if (auth.role !== 'ADMIN' && auth.role !== 'SUPERVISOR' && auth.role !== 'DRIVER') {
    throw new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action');
  }
}

async function resolvedPlan(
  organizationId: string,
  studentId: string,
  date: string,
  direction: RouteDirection,
) {
  const [assignment, daily] = await Promise.all([
    findActiveAssignment(organizationId, studentId, direction),
    findDailyPlan(organizationId, studentId, date, direction),
  ]);
  const method = daily?.transportMethod ?? (assignment ? 'BUS' : 'OTHER');
  const cancelled = daily?.status === 'CANCELLED';
  return {
    assignment,
    daily,
    transportMethod: cancelled && method === 'BUS' ? 'PARENT_CAR' : method,
    cancelled,
    routeId: daily?.routeId
      ? String(daily.routeId)
      : assignment
        ? String(assignment.routeId)
        : null,
    stopId: daily?.stopId ? String(daily.stopId) : assignment ? String(assignment.stopId) : null,
  };
}

function studentSummary(student: { id: string; firstName: string; lastName: string }) {
  return { id: student.id, firstName: student.firstName, lastName: student.lastName };
}

export async function getStudentTransportToday(
  auth: AuthContext,
  studentId: string,
  timeZone: string,
) {
  const student = await findStudentById(auth.organizationId, studentId);
  if (!student) {
    throw notFound();
  }
  await assertStudentReadable(auth, student);
  const date = calendarDateInTimeZone(new Date(), timeZone);
  const directions: RouteDirection[] = ['HOME_TO_SCHOOL', 'SCHOOL_TO_HOME'];
  const plans = await Promise.all(
    directions.map(async (direction) => {
      const resolved = await resolvedPlan(auth.organizationId, student.id, date, direction);
      return {
        direction,
        transportMethod: resolved.transportMethod,
        status: resolved.cancelled ? 'CANCELLED' : 'SCHEDULED',
        routeId: resolved.routeId,
        stopId: resolved.stopId,
        assignmentId: resolved.assignment?.id ?? null,
      };
    }),
  );
  return { date, student: studentSummary(student), directions: plans };
}

export async function patchStudentTransportToday(
  auth: AuthContext,
  studentId: string,
  input: {
    direction: RouteDirection;
    transportMethod: TransportMethod;
    reason?: string;
  },
  timeZone: string,
) {
  assertOperator(auth);
  const student = await findStudentById(auth.organizationId, studentId);
  if (!student || student.status !== 'ACTIVE') {
    throw notFound();
  }
  await assertStudentReadable(auth, student);
  const date = calendarDateInTimeZone(new Date(), timeZone);
  const assignment = await findActiveAssignment(auth.organizationId, student.id, input.direction);
  const status = input.transportMethod === 'BUS' ? 'SCHEDULED' : 'CANCELLED';
  const plan = await upsertDailyPlan(auth.organizationId, {
    studentId: student.id,
    date,
    direction: input.direction,
    transportMethod: input.transportMethod,
    routeId: assignment ? String(assignment.routeId) : undefined,
    stopId: assignment ? String(assignment.stopId) : undefined,
    status,
    reason: input.reason,
    createdBy: auth.userId,
  });
  return {
    date,
    direction: plan.direction,
    transportMethod: plan.transportMethod,
    status: plan.status,
    reason: plan.reason ?? null,
  };
}

export async function cancelParentTransport(
  auth: AuthContext,
  studentId: string,
  input: { directions: RouteDirection[]; startDate: string; endDate: string; reason?: string },
  timeZone: string,
) {
  if (auth.role !== 'GUARDIAN') {
    throw new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action');
  }
  const student = await findStudentById(auth.organizationId, studentId);
  if (!student || student.status !== 'ACTIVE') {
    throw notFound();
  }
  await assertStudentReadable(auth, student);
  const dates = eachDateInclusive(input.startDate, input.endDate);
  const today = calendarDateInTimeZone(new Date(), timeZone);
  if (input.startDate < today) {
    throw validationError('startDate', 'Must not be in the past');
  }
  const updated = [];
  for (const date of dates) {
    for (const direction of input.directions) {
      const assignment = await findActiveAssignment(auth.organizationId, student.id, direction);
      const plan = await upsertDailyPlan(auth.organizationId, {
        studentId: student.id,
        date,
        direction,
        transportMethod: 'PARENT_CAR',
        routeId: assignment ? String(assignment.routeId) : undefined,
        stopId: assignment ? String(assignment.stopId) : undefined,
        status: 'CANCELLED',
        reason: input.reason,
        createdBy: auth.userId,
      });
      updated.push({
        date,
        direction: plan.direction,
        transportMethod: plan.transportMethod,
        status: plan.status,
      });
      await recordJourneyEvent(
        auth,
        student.id,
        {
          eventType: 'TRANSPORT_CANCELLED',
          occurredAt: new Date(),
          source: 'SYSTEM',
          metadata: { date, direction },
        },
        timeZone,
        { skipDuplicate: true, skipTransition: true, skipRoleCheck: true },
      );
    }
  }
  return { student: studentSummary(student), cancellations: updated };
}

export async function getParentTransportToday(
  auth: AuthContext,
  studentId: string,
  timeZone: string,
) {
  if (auth.role !== 'GUARDIAN') {
    throw new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action');
  }
  const today = await getStudentTransportToday(auth, studentId, timeZone);
  const student = await findStudentById(auth.organizationId, studentId);
  if (!student) {
    throw notFound();
  }
  const date = today.date;
  const directions = await Promise.all(
    today.directions.map(async (plan) => {
      const progress =
        plan.transportMethod === 'BUS' && plan.routeId && !plan.status.includes('CANCEL')
          ? await parentProgress(
              auth,
              student.id,
              plan.routeId,
              plan.stopId,
              plan.direction,
              date,
              timeZone,
            )
          : null;
      return { ...plan, progress };
    }),
  );
  return { ...today, directions };
}

export async function getParentEta(auth: AuthContext, studentId: string, timeZone: string) {
  if (auth.role !== 'GUARDIAN') {
    throw new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action');
  }
  const student = await findStudentById(auth.organizationId, studentId);
  if (!student) {
    throw notFound();
  }
  await assertStudentReadable(auth, student);
  const date = calendarDateInTimeZone(new Date(), timeZone);
  const morning = await resolvedPlan(auth.organizationId, student.id, date, 'HOME_TO_SCHOOL');
  const afternoon = await resolvedPlan(auth.organizationId, student.id, date, 'SCHOOL_TO_HOME');
  const chosen = !morning.cancelled && morning.routeId && morning.stopId ? morning : afternoon;
  if (chosen.cancelled || !chosen.routeId || !chosen.stopId) {
    return {
      available: false,
      label: 'Estimated arrival',
      liveTracking: false,
    };
  }
  const eta = await computeEta(auth, chosen.routeId, chosen.stopId, date, timeZone);
  return { available: true, ...eta, label: 'Estimated arrival', liveTracking: false };
}

async function parentProgress(
  auth: AuthContext,
  studentId: string,
  routeId: string,
  stopId: string | null,
  direction: RouteDirection,
  date: string,
  timeZone: string,
) {
  if (!stopId) {
    return null;
  }
  const route = await findRouteById(auth.organizationId, routeId);
  if (!route) {
    return null;
  }
  const [stops, bus, assignments] = await Promise.all([
    listStopsForRoute(auth.organizationId, route.id),
    findBusById(auth.organizationId, String(route.busId)),
    listActiveAssignmentsForStop(auth.organizationId, stopId),
  ]);
  const childStop = stops.find((stop) => stop.id === stopId);
  const eta = await computeEta(auth, route.id, stopId, date, timeZone);
  return {
    direction,
    busName: bus?.name ?? null,
    currentStop: eta.currentStop
      ? { sequence: eta.currentStop.sequence, name: eta.currentStop.name }
      : null,
    childStop: childStop ? { sequence: childStop.sequence, name: childStop.name } : null,
    childrenAtStop: assignments.some((row) => String(row.studentId) === studentId)
      ? assignments.length
      : 0,
    stopsRemaining: eta.stopsRemaining,
    estimatedMinutes: eta.estimatedMinutes,
    estimatedArrivalTime: eta.estimatedArrivalTime,
    liveTracking: false,
    label: 'Estimated arrival',
  };
}

export async function recordProgress(
  auth: AuthContext,
  routeId: string,
  input: { stopId: string; status: StopProgressStatus },
  timeZone: string,
) {
  assertDriverOrSupervisor(auth);
  const route = await requireRoute(auth, routeId, false);
  if (auth.role === 'DRIVER') {
    if (!auth.routeIds.includes(route.id)) {
      throw notFound();
    }
  }
  const stop = await requireStopOnRoute(auth.organizationId, route.id, input.stopId);
  const date = calendarDateInTimeZone(new Date(), timeZone);
  const occurredAt = new Date();
  const progress = await createProgress(auth.organizationId, {
    routeId: route.id,
    date,
    stopId: stop.id,
    sequence: stop.sequence,
    status: input.status,
    occurredAt,
    recordedBy: auth.userId,
    source: 'MANUAL',
    parentsNotified: false,
  });

  if (input.status === 'APPROACHING') {
    await notifyStopIfNeeded(auth, route.id, stop.id, stop.name, date);
    await markProgressNotified(auth.organizationId, progress.id);
  }
  if (input.status === 'DEPARTED') {
    const stops = await listStopsForRoute(auth.organizationId, route.id);
    const next = stops.find((row) => row.sequence === stop.sequence + 1);
    if (next) {
      const approaching = await createProgress(auth.organizationId, {
        routeId: route.id,
        date,
        stopId: next.id,
        sequence: next.sequence,
        status: 'APPROACHING',
        occurredAt,
        recordedBy: auth.userId,
        source: 'SYSTEM',
        parentsNotified: false,
      });
      await notifyStopIfNeeded(auth, route.id, next.id, next.name, date);
      await markProgressNotified(auth.organizationId, approaching.id);
    }
    if (route.direction === 'SCHOOL_TO_HOME' && stop.sequence === 1) {
      const assignments = await eligibleRouteStudents(auth, route.id, date, route.direction);
      for (const row of assignments) {
        await recordJourneyEvent(
          auth,
          String(row.studentId),
          {
            eventType: 'BUS_DEPARTURE',
            occurredAt,
            source: 'MANUAL',
            metadata: { routeId: route.id, stopId: stop.id },
          },
          timeZone,
          { skipDuplicate: true },
        ).catch((err) => logger.error('Failed to record bus departure', err));
      }
    }
  }
  if (input.status === 'ARRIVED' && route.direction === 'SCHOOL_TO_HOME') {
    const assignments = await listActiveAssignmentsForStop(auth.organizationId, stop.id);
    const cancelled = await listCancelledStudentIds(
      auth.organizationId,
      assignments.map((row) => String(row.studentId)),
      date,
      route.direction,
    );
    const cancelledSet = new Set(cancelled);
    for (const row of assignments) {
      if (cancelledSet.has(String(row.studentId))) {
        continue;
      }
      await recordJourneyEvent(
        auth,
        String(row.studentId),
        {
          eventType: 'HOME_DROPOFF',
          occurredAt,
          source: 'MANUAL',
          metadata: { routeId: route.id, stopId: stop.id },
        },
        timeZone,
        { skipDuplicate: true },
      ).catch((err) => logger.error('Failed to record home drop-off', err));
    }
  }
  return toProgressJson(progress, stop.name);
}

export async function getProgressToday(auth: AuthContext, routeId: string, timeZone: string) {
  const route = await requireRoute(auth, routeId, false);
  const date = calendarDateInTimeZone(new Date(), timeZone);
  const [stops, rows, latest] = await Promise.all([
    listStopsForRoute(auth.organizationId, route.id),
    listProgressForRouteDate(auth.organizationId, route.id, date),
    findLatestProgressForRoute(auth.organizationId, route.id, date),
  ]);
  const latestByStop = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    latestByStop.set(String(row.stopId), row);
  }
  return {
    route: toRouteJson(route),
    date,
    liveTracking: false,
    currentStopId: latest ? String(latest.stopId) : null,
    stops: stops.map((stop) => {
      const row = latestByStop.get(stop.id);
      return {
        ...toStopJson(stop),
        status: row?.status ?? null,
        occurredAt: row?.occurredAt.toISOString() ?? null,
        parentsNotified: row?.parentsNotified ?? false,
      };
    }),
  };
}

export async function scanBoarding(auth: AuthContext, qrToken: string, timeZone: string) {
  assertDriverOrSupervisor(auth);
  const student = await findStudentByQrToken(auth.organizationId, qrToken);
  if (!student) {
    throw new AppError(404, 'NOT_FOUND', 'Student not found');
  }
  await assertStudentReadable(auth, student);
  return boardStudent(auth, student.id, 'QR', timeZone);
}

export async function boardStudent(
  auth: AuthContext,
  studentId: string,
  source: 'QR' | 'MANUAL',
  timeZone: string,
) {
  const student = await findStudentById(auth.organizationId, studentId);
  if (!student || student.status !== 'ACTIVE') {
    throw notFound();
  }
  await assertStudentReadable(auth, student);
  const date = calendarDateInTimeZone(new Date(), timeZone);
  const morning = await resolvedPlan(auth.organizationId, student.id, date, 'HOME_TO_SCHOOL');
  const afternoon = await resolvedPlan(auth.organizationId, student.id, date, 'SCHOOL_TO_HOME');
  const boarded = await boardingByDirection(auth.organizationId, student.id, timeZone);
  const resolved = pickBoardingPlan(morning, afternoon, boarded);
  if (resolved.alreadyRecorded) {
    return {
      status: 'ALREADY_RECORDED' as const,
      student: studentSummary(student),
      eventType: 'BUS_BOARDING',
    };
  }
  if (
    !resolved.plan?.assignment ||
    resolved.plan.cancelled ||
    resolved.plan.transportMethod !== 'BUS'
  ) {
    throw validationError('qrToken', 'Student is not assigned to a bus today');
  }
  if (auth.role === 'DRIVER' && !auth.routeIds.includes(String(resolved.plan.assignment.routeId))) {
    throw notFound();
  }
  const recorded = await recordJourneyEvent(
    auth,
    student.id,
    {
      eventType: 'BUS_BOARDING',
      occurredAt: new Date(),
      source,
      metadata: {
        routeId: String(resolved.plan.assignment.routeId),
        stopId: String(resolved.plan.assignment.stopId),
        direction: resolved.direction,
      },
    },
    timeZone,
  );
  return {
    status: 'RECORDED' as const,
    student: studentSummary(student),
    eventType: recorded.event.eventType,
  };
}

export async function registerRouteArrivals(auth: AuthContext, routeId: string, timeZone: string) {
  assertDriverOrSupervisor(auth);
  const route = await requireRoute(auth, routeId, false);
  if (route.direction !== 'HOME_TO_SCHOOL') {
    throw validationError('routeId', 'Bulk arrival is for home-to-school routes');
  }
  const date = calendarDateInTimeZone(new Date(), timeZone);
  const eligible = await eligibleRouteStudents(auth, route.id, date, route.direction);
  const results = [];
  for (const row of eligible) {
    results.push(
      await recordArrival(auth, String(row.studentId), 'SCHOOL_ARRIVAL', 'MANUAL_BULK', timeZone, {
        routeId: route.id,
      }),
    );
  }
  return { routeId: route.id, results };
}

export async function recordStudentArrival(
  auth: AuthContext,
  studentId: string,
  input: { method?: 'BUS' | 'PARENT_CAR'; status?: 'NOT_PRESENT' },
  timeZone: string,
) {
  assertOperator(auth);
  if (input.status === 'NOT_PRESENT') {
    return recordNotPresent(auth, studentId, timeZone);
  }
  const eventType = input.method === 'PARENT_CAR' ? 'ARRIVED_BY_CAR' : 'SCHOOL_ARRIVAL';
  const source = input.method === 'PARENT_CAR' ? 'MANUAL' : 'MANUAL';
  return recordArrival(auth, studentId, eventType, source, timeZone, {});
}

async function recordNotPresent(auth: AuthContext, studentId: string, timeZone: string) {
  const student = await findStudentById(auth.organizationId, studentId);
  if (!student) {
    throw notFound();
  }
  await assertStudentReadable(auth, student);
  const recorded = await recordJourneyEvent(
    auth,
    student.id,
    {
      eventType: 'NOT_PRESENT_AT_CLASS_CHECK',
      occurredAt: new Date(),
      source: 'MANUAL',
      metadata: {},
    },
    timeZone,
    { skipTransition: true },
  );
  return {
    status: 'RECORDED' as const,
    student: studentSummary(student),
    eventType: recorded.event.eventType,
  };
}

async function recordArrival(
  auth: AuthContext,
  studentId: string,
  eventType: 'SCHOOL_ARRIVAL' | 'ARRIVED_BY_CAR',
  source: 'MANUAL' | 'MANUAL_BULK',
  timeZone: string,
  metadata: Record<string, unknown>,
) {
  const student = await findStudentById(auth.organizationId, studentId);
  if (!student || student.status !== 'ACTIVE') {
    throw notFound();
  }
  await assertStudentReadable(auth, student);
  const existing = await hasEventOfTypeToday(auth.organizationId, student.id, eventType, timeZone);
  if (existing) {
    return {
      status: 'ALREADY_RECORDED' as const,
      student: studentSummary(student),
      eventType,
    };
  }
  const attendanceSource = source === 'MANUAL_BULK' ? 'MANUAL_BULK' : 'MANUAL';
  await ensurePresentAttendance(auth, student, new Date(), timeZone, attendanceSource);
  const recorded = await recordJourneyEvent(
    auth,
    student.id,
    {
      eventType,
      occurredAt: new Date(),
      source,
      metadata,
    },
    timeZone,
    { skipDuplicate: true, skipTransition: true },
  );
  return {
    status: 'RECORDED' as const,
    student: studentSummary(student),
    eventType: recorded.event.eventType,
  };
}

export async function recordPickup(
  auth: AuthContext,
  studentId: string,
  input: {
    type: 'PARENT_PICKUP' | 'AUTHORIZED_PICKUP';
    pickupPersonId?: string;
    reason?: string;
  },
  timeZone: string,
) {
  assertOperator(auth);
  if (auth.role === 'DRIVER') {
    throw new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action');
  }
  const student = await findStudentById(auth.organizationId, studentId);
  if (!student || student.status !== 'ACTIVE') {
    throw notFound();
  }
  await assertStudentReadable(auth, student);
  const pickupPersonId = input.pickupPersonId;
  if (input.type === 'AUTHORIZED_PICKUP') {
    if (!pickupPersonId) {
      throw validationError('pickupPersonId', 'Required');
    }
    const links = await listPickupLinksForStudent(auth.organizationId, student.id);
    if (!links.some((link) => String(link.userId) === pickupPersonId && link.canPickup)) {
      throw validationError('pickupPersonId', 'Is not authorized to pick up this child');
    }
  }
  const recorded = await recordJourneyEvent(
    auth,
    student.id,
    {
      eventType: input.type,
      occurredAt: new Date(),
      source: 'MANUAL',
      metadata: {
        pickupPersonId: pickupPersonId ?? null,
        reason: input.reason ?? null,
      },
    },
    timeZone,
  );
  const date = calendarDateInTimeZone(new Date(), timeZone);
  const assignment = await findActiveAssignment(auth.organizationId, student.id, 'SCHOOL_TO_HOME');
  await upsertDailyPlan(auth.organizationId, {
    studentId: student.id,
    date,
    direction: 'SCHOOL_TO_HOME',
    transportMethod: input.type === 'AUTHORIZED_PICKUP' ? 'AUTHORIZED_PICKUP' : 'PARENT_PICKUP',
    routeId: assignment ? String(assignment.routeId) : undefined,
    stopId: assignment ? String(assignment.stopId) : undefined,
    status: 'CANCELLED',
    reason: input.reason,
    createdBy: auth.userId,
  });
  return {
    status: 'RECORDED' as const,
    student: studentSummary(student),
    eventType: recorded.event.eventType,
  };
}

export async function classroomToday(auth: AuthContext, classroomId: string, timeZone: string) {
  assertOperator(auth);
  if (auth.role === 'DRIVER') {
    throw notFound();
  }
  const classroom = await findClassroomById(auth.organizationId, classroomId);
  if (!classroom) {
    throw notFound();
  }
  if (auth.role === 'TEACHER' && !auth.classroomIds.includes(classroom.id)) {
    throw notFound();
  }
  if (auth.role === 'SUPERVISOR' && !auth.campusIds.includes(String(classroom.campusId))) {
    throw notFound();
  }
  const date = calendarDateInTimeZone(new Date(), timeZone);
  const students = await findActiveStudentsByClassroom(auth.organizationId, classroom.id);
  const children = [];
  let arrivedByBus = 0;
  let arrivedByCar = 0;
  let notArrived = 0;
  for (const student of students) {
    const morning = await resolvedPlan(auth.organizationId, student.id, date, 'HOME_TO_SCHOOL');
    const afternoon = await resolvedPlan(auth.organizationId, student.id, date, 'SCHOOL_TO_HOME');
    const schoolArrival = await hasEventOfTypeToday(
      auth.organizationId,
      student.id,
      'SCHOOL_ARRIVAL',
      timeZone,
    );
    const carArrival = await hasEventOfTypeToday(
      auth.organizationId,
      student.id,
      'ARRIVED_BY_CAR',
      timeZone,
    );
    const pickup = await hasEventOfTypeToday(
      auth.organizationId,
      student.id,
      'PARENT_PICKUP',
      timeZone,
    );
    const authorized = await hasEventOfTypeToday(
      auth.organizationId,
      student.id,
      'AUTHORIZED_PICKUP',
      timeZone,
    );
    const notPresent = await hasEventOfTypeToday(
      auth.organizationId,
      student.id,
      'NOT_PRESENT_AT_CLASS_CHECK',
      timeZone,
    );
    let arrivalStatus = 'NOT_ARRIVED';
    if (carArrival) {
      arrivalStatus = 'ARRIVED_BY_CAR';
      arrivedByCar += 1;
    } else if (schoolArrival) {
      arrivalStatus = 'ARRIVED';
      arrivedByBus += 1;
    } else if (notPresent) {
      arrivalStatus = 'NOT_PRESENT';
      notArrived += 1;
    } else {
      notArrived += 1;
    }
    children.push({
      student: studentSummary(student),
      morning: {
        transportMethod: morning.transportMethod,
        cancelled: morning.cancelled,
      },
      afternoon: {
        transportMethod: afternoon.transportMethod,
        cancelled: afternoon.cancelled || Boolean(pickup || authorized),
        pickup: pickup ? 'PARENT_PICKUP' : authorized ? 'AUTHORIZED_PICKUP' : null,
      },
      arrivalStatus,
    });
  }
  return {
    date,
    classroomId: classroom.id,
    expected: students.length,
    arrivedByBus,
    arrivedByCar,
    notArrived,
    children,
  };
}

async function eligibleRouteStudents(
  auth: AuthContext,
  routeId: string,
  date: string,
  direction: RouteDirection,
) {
  const assignments = await listActiveAssignmentsForRoute(auth.organizationId, routeId);
  const cancelled = new Set(
    await listCancelledStudentIds(
      auth.organizationId,
      assignments.map((row) => String(row.studentId)),
      date,
      direction,
    ),
  );
  const students = await findStudentsByIds(
    auth.organizationId,
    assignments.map((row) => String(row.studentId)),
  );
  const active = new Set(students.filter((row) => row.status === 'ACTIVE').map((row) => row.id));
  return assignments.filter(
    (row) => active.has(String(row.studentId)) && !cancelled.has(String(row.studentId)),
  );
}

function isBusPlan(plan: Awaited<ReturnType<typeof resolvedPlan>>) {
  return Boolean(plan.assignment) && !plan.cancelled && plan.transportMethod === 'BUS';
}

function pickBoardingPlan(
  morning: Awaited<ReturnType<typeof resolvedPlan>>,
  afternoon: Awaited<ReturnType<typeof resolvedPlan>>,
  boarded: { morning: boolean; afternoon: boolean },
) {
  if (isBusPlan(morning) && !boarded.morning) {
    return { direction: 'HOME_TO_SCHOOL' as const, plan: morning, alreadyRecorded: false };
  }
  if (isBusPlan(afternoon) && !boarded.afternoon) {
    return { direction: 'SCHOOL_TO_HOME' as const, plan: afternoon, alreadyRecorded: false };
  }
  if ((isBusPlan(morning) && boarded.morning) || (isBusPlan(afternoon) && boarded.afternoon)) {
    return { direction: 'HOME_TO_SCHOOL' as const, plan: morning, alreadyRecorded: true };
  }
  return { direction: 'HOME_TO_SCHOOL' as const, plan: morning, alreadyRecorded: false };
}

async function boardingByDirection(organizationId: string, studentId: string, timeZone: string) {
  const date = calendarDateInTimeZone(new Date(), timeZone);
  const { start, endExclusive } = utcRangeForCalendarDate(date, timeZone);
  const events = await listStudentEvents(organizationId, studentId, start, endExclusive);
  const boardings = events.filter((event) => event.eventType === 'BUS_BOARDING');
  return {
    morning: boardings.some((event) => event.metadata?.direction === 'HOME_TO_SCHOOL'),
    afternoon: boardings.some((event) => event.metadata?.direction === 'SCHOOL_TO_HOME'),
  };
}

async function computeEta(
  auth: AuthContext,
  routeId: string,
  stopId: string,
  date: string,
  timeZone: string,
) {
  const [stops, segments, rows] = await Promise.all([
    listStopsForRoute(auth.organizationId, routeId),
    listSegmentsForRoute(auth.organizationId, routeId),
    listProgressForRouteDate(auth.organizationId, routeId, date),
  ]);
  const child = stops.find((stop) => stop.id === stopId);
  if (!child) {
    throw notFound();
  }
  const latest = [...rows]
    .reverse()
    .find((row) => row.status === 'ARRIVED' || row.status === 'DEPARTED');
  const currentSeq = latest?.sequence ?? 0;
  const currentStop = latest ? stops.find((stop) => stop.id === String(latest.stopId)) : undefined;
  const eta = calculateEta({
    stops: stops.map((stop) => ({ id: stop.id, sequence: stop.sequence })),
    segments: segments.map((segment) => ({
      fromStopId: String(segment.fromStopId),
      toStopId: String(segment.toStopId),
      estimatedMinutes: segment.estimatedMinutes,
    })),
    currentStopSequence: currentSeq,
    childStopSequence: child.sequence,
  });
  const arrival = new Date(Date.now() + eta.estimatedMinutes * 60_000);
  return {
    currentStopSequence: eta.currentStopSequence,
    childStopSequence: eta.childStopSequence,
    stopsRemaining: eta.stopsRemaining,
    estimatedMinutes: eta.estimatedMinutes,
    estimatedArrivalTime: formatClockInTimeZone(arrival, timeZone),
    currentStop: currentStop ? { sequence: currentStop.sequence, name: currentStop.name } : null,
    childStop: { sequence: child.sequence, name: child.name },
    liveTracking: false,
    label: 'Estimated arrival',
  };
}

async function notifyStopIfNeeded(
  auth: AuthContext,
  routeId: string,
  stopId: string,
  stopName: string,
  date: string,
) {
  if (await hasNotifiedStop(auth.organizationId, routeId, date, stopId)) {
    return;
  }
  const assignments = await listActiveAssignmentsForStop(auth.organizationId, stopId);
  const cancelled = new Set(
    await listCancelledStudentIds(
      auth.organizationId,
      assignments.map((row) => String(row.studentId)),
      date,
      (await requireRoute(auth, routeId, false)).direction,
    ),
  );
  const eligible = assignments.filter((row) => !cancelled.has(String(row.studentId)));
  const count = eligible.length;
  for (const row of eligible) {
    const body =
      count > 1
        ? `The bus is approaching ${stopName}. ${count} children from your building are scheduled for this stop.`
        : `The bus is approaching ${stopName}. Please be ready.`;
    try {
      await notifyJourneyUpdate({
        organizationId: auth.organizationId,
        studentId: String(row.studentId),
        title: 'Get ready',
        body,
      });
    } catch (err) {
      logger.error('Failed to notify approaching stop', err);
    }
  }
}

function toProgressJson(
  row: {
    id: string;
    stopId: { toString(): string };
    sequence: number;
    status: string;
    occurredAt: Date;
    source: string;
  },
  stopName: string,
) {
  return {
    id: row.id,
    stopId: String(row.stopId),
    stopName,
    sequence: row.sequence,
    status: row.status,
    occurredAt: row.occurredAt.toISOString(),
    source: row.source,
  };
}

export { listDailyPlansForStudentDate };
