import type { AuthContext } from '../../types';
import { AppError } from '../../utils/appError';
import { calendarDateInTimeZone, utcRangeForCalendarDate } from '../../utils/timezone';
import { conflict, notFound, validationError } from '../../utils/validate';
import { assertStudentReadable } from '../students/student.service';
import { findStudentById } from '../students/student.repository';
import type { Student } from '../students/student.model';
import {
  CLASS_EVENT_TYPES,
  TRANSPORT_EVENT_TYPES,
  type StudentEvent,
  type StudentEventSource,
  type StudentEventType,
} from './student-event.model';
import {
  createStudentEvent,
  findLatestEventOfType,
  findLatestStudentEvent,
  findRecentEventOfType,
  listStudentEvents,
} from './student-event.repository';
import { notifyStudentJourneyEvent } from '../notifications/notification.service';
import { logger } from '../../utils/logger';

// note: 10s debounce per API process; unique per-student window in Redis if scans fan out across instances.
const DUPLICATE_WINDOW_MS = 10_000;

const IN_SCHOOL_TYPES = new Set<StudentEventType>([
  'SCHOOL_ARRIVAL',
  'CLASS_STARTED',
  'BREAK_STARTED',
  'ACTIVITY_STARTED',
  'MEAL',
  'SKILL_SESSION',
]);

export function toEventJson(event: StudentEvent & { id: string }) {
  return {
    id: event.id,
    eventType: event.eventType,
    occurredAt: event.occurredAt.toISOString(),
    recordedAt: event.recordedAt.toISOString(),
    source: event.source,
    metadata: event.metadata ?? {},
  };
}

export async function createEvent(
  auth: AuthContext,
  studentId: string,
  input: {
    eventType: StudentEventType;
    occurredAt: Date;
    metadata: Record<string, unknown>;
  },
  timeZone: string,
) {
  const student = await loadStudent(auth, studentId, true);
  assertCanWriteEventType(auth, input.eventType);
  await assertNotDuplicate(auth.organizationId, student.id, input.eventType);
  await assertTransitionAllowed(
    auth.organizationId,
    student.id,
    input.eventType,
    input.occurredAt,
    timeZone,
  );

  const recordedAt = new Date();
  const event = await insertEvent(auth, student.id, {
    eventType: input.eventType,
    occurredAt: input.occurredAt,
    recordedAt,
    source: 'MANUAL',
    metadata: input.metadata,
  });
  return toEventJson(event);
}

export async function listEvents(
  auth: AuthContext,
  studentId: string,
  opts: { date?: string },
  timeZone: string,
) {
  const student = await loadStudent(auth, studentId, false);
  const date = opts.date ?? calendarDateInTimeZone(new Date(), timeZone);
  const { start, endExclusive } = utcRangeForCalendarDate(date, timeZone);
  const events = await listStudentEvents(auth.organizationId, student.id, start, endExclusive);
  return events.map(toEventJson);
}

export async function getToday(auth: AuthContext, studentId: string, timeZone: string) {
  const student = await loadStudent(auth, studentId, false);
  const date = calendarDateInTimeZone(new Date(), timeZone);
  const { start, endExclusive } = utcRangeForCalendarDate(date, timeZone);
  const events = await listStudentEvents(auth.organizationId, student.id, start, endExclusive);
  const latest = events[events.length - 1];
  return {
    student: {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
    },
    currentState: latest?.eventType ?? null,
    events: events.map(toEventJson),
  };
}

export async function ensureAttendancePresentEvent(
  organizationId: string,
  studentId: string,
  attendanceId: string,
  occurredAt: Date,
  recordedBy: string,
  timeZone: string,
): Promise<void> {
  const { start, endExclusive } = utcRangeForCalendarDate(
    calendarDateInTimeZone(occurredAt, timeZone),
    timeZone,
  );
  const existing = await findLatestEventOfType(
    organizationId,
    studentId,
    'ATTENDANCE_PRESENT',
    start,
    endExclusive,
  );
  if (existing) {
    return;
  }

  await createStudentEvent(organizationId, {
    studentId,
    eventType: 'ATTENDANCE_PRESENT',
    occurredAt,
    recordedAt: new Date(),
    recordedBy,
    source: 'QR',
    metadata: { attendanceId },
  });
  // note: emit student.journey.updated here when Socket.IO lands.
}

async function insertEvent(
  auth: AuthContext,
  studentId: string,
  input: {
    eventType: StudentEventType;
    occurredAt: Date;
    recordedAt: Date;
    source: StudentEventSource;
    metadata: Record<string, unknown>;
  },
) {
  const event = await createStudentEvent(auth.organizationId, {
    studentId,
    eventType: input.eventType,
    occurredAt: input.occurredAt,
    recordedAt: input.recordedAt,
    recordedBy: auth.userId,
    source: input.source,
    metadata: input.metadata,
  });
  try {
    await notifyStudentJourneyEvent({
      organizationId: auth.organizationId,
      studentId,
      eventId: event.id,
      eventType: input.eventType,
    });
  } catch (err) {
    logger.error('Failed to enqueue journey notification', err);
  }
  // note: emit student.journey.updated here when Socket.IO lands.
  return event;
}

async function loadStudent(auth: AuthContext, studentId: string, requireActive: boolean) {
  const student = await findStudentById(auth.organizationId, studentId);
  if (!student) {
    throw notFound();
  }
  await assertStudentReadable(auth, student);
  if (requireActive && student.status !== 'ACTIVE') {
    throw new AppError(400, 'BAD_REQUEST', 'Student is not active');
  }
  return student as Student & { id: string };
}

function assertCanWriteEventType(auth: AuthContext, eventType: StudentEventType): void {
  if (eventType === 'ATTENDANCE_PRESENT') {
    throw validationError('eventType', 'Is recorded automatically with attendance');
  }
  if (auth.role === 'ADMIN' || auth.role === 'SUPERVISOR') {
    return;
  }
  if (auth.role === 'TEACHER' && (CLASS_EVENT_TYPES as readonly string[]).includes(eventType)) {
    return;
  }
  if (auth.role === 'DRIVER' && (TRANSPORT_EVENT_TYPES as readonly string[]).includes(eventType)) {
    return;
  }
  throw new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action');
}

async function assertNotDuplicate(
  organizationId: string,
  studentId: string,
  eventType: StudentEventType,
): Promise<void> {
  const recent = await findRecentEventOfType(
    organizationId,
    studentId,
    eventType,
    new Date(Date.now() - DUPLICATE_WINDOW_MS),
  );
  if (recent) {
    throw conflict('An identical event was just recorded');
  }
}

async function assertTransitionAllowed(
  organizationId: string,
  studentId: string,
  eventType: StudentEventType,
  occurredAt: Date,
  timeZone: string,
): Promise<void> {
  const { start, endExclusive } = utcRangeForCalendarDate(
    calendarDateInTimeZone(occurredAt, timeZone),
    timeZone,
  );
  const latest = await findLatestStudentEvent(organizationId, studentId, start, endExclusive);
  if (!latest) {
    return;
  }
  if (latest.eventType === 'HOME_DROPOFF') {
    throw validationError('eventType', 'Cannot add events after home drop-off');
  }
  if (latest.eventType === 'BUS_DEPARTURE' && IN_SCHOOL_TYPES.has(eventType)) {
    throw validationError('eventType', 'Cannot record an in-school event after bus departure');
  }
}
