import type { AuthContext } from '../../types';
import { AppError } from '../../utils/appError';
import { calendarDateInTimeZone, utcRangeForCalendarDate } from '../../utils/timezone';
import { notFound } from '../../utils/validate';
import { assertAssigned } from '../../authorization/scope';
import { findAttendanceByStudentDate } from '../attendance/attendance.repository';
import { findClassroomById, findClassroomsByIds } from '../classrooms/classroom.repository';
import { listStudentIdsForGuardian } from '../guardians/guardian.repository';
import { findLatestStudentEvent, listStudentEvents } from '../journey/student-event.repository';
import type { StudentEvent } from '../journey/student-event.model';
import { listStudentPhotos } from '../media/media.service';
import type { MediaType } from '../media/media.model';
import { findStudentById, findStudentsByIds } from '../students/student.repository';
import type { Student } from '../students/student.model';

function assertGuardian(auth: AuthContext): void {
  if (auth.role !== 'GUARDIAN') {
    throw new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action');
  }
}

function toParentEventJson(event: StudentEvent & { id: string }) {
  return {
    id: event.id,
    eventType: event.eventType,
    occurredAt: event.occurredAt.toISOString(),
    source: event.source,
  };
}

function classroomJson(student: Student & { id: string }, name?: string) {
  return {
    id: String(student.classroomId),
    name: name ?? '',
  };
}

async function requireLinkedChild(auth: AuthContext, studentId: string) {
  assertGuardian(auth);
  const student = await findStudentById(auth.organizationId, studentId);
  if (!student) {
    throw notFound();
  }
  const ids = await listStudentIdsForGuardian(auth.organizationId, auth.userId);
  assertAssigned(auth, student.id, ids);
  if (student.status !== 'ACTIVE') {
    throw notFound();
  }
  return student as Student & { id: string };
}

export async function getChildren(auth: AuthContext) {
  assertGuardian(auth);
  const ids = await listStudentIdsForGuardian(auth.organizationId, auth.userId);
  const students = (await findStudentsByIds(auth.organizationId, ids))
    .filter((student) => student.status === 'ACTIVE')
    .sort((a, b) => a.firstName.localeCompare(b.firstName) || a.lastName.localeCompare(b.lastName));
  const classrooms = await findClassroomsByIds(auth.organizationId, [
    ...new Set(students.map((student) => String(student.classroomId))),
  ]);
  const names = new Map(classrooms.map((classroom) => [classroom.id, classroom.name]));
  return {
    items: students.map((student) => ({
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      studentNumber: student.studentNumber,
      classroom: classroomJson(student, names.get(String(student.classroomId))),
      status: student.status,
    })),
  };
}

export async function getChildDashboard(auth: AuthContext, studentId: string, timeZone: string) {
  const student = await requireLinkedChild(auth, studentId);
  const date = calendarDateInTimeZone(new Date(), timeZone);
  const { start, endExclusive } = utcRangeForCalendarDate(date, timeZone);
  const [classroom, attendance, latest] = await Promise.all([
    findClassroomById(auth.organizationId, String(student.classroomId)),
    findAttendanceByStudentDate(auth.organizationId, student.id, date),
    findLatestStudentEvent(auth.organizationId, student.id, start, endExclusive),
  ]);

  return {
    student: {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      classroom: classroomJson(student, classroom?.name),
    },
    attendance:
      attendance?.attendanceType === 'PRESENT'
        ? { status: 'PRESENT' as const, recordedAt: attendance.scannedAt.toISOString() }
        : { status: 'NOT_RECORDED' as const, recordedAt: null },
    journey: {
      currentState: latest?.eventType ?? null,
      lastEventAt: latest?.occurredAt.toISOString() ?? null,
    },
  };
}

export async function getChildJourneyToday(auth: AuthContext, studentId: string, timeZone: string) {
  const student = await requireLinkedChild(auth, studentId);
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
    events: events.map(toParentEventJson),
  };
}

export async function getChildMedia(
  auth: AuthContext,
  studentId: string,
  opts: { date?: string; mediaType?: MediaType; page: number; limit: number; skip: number },
  timeZone: string,
) {
  await requireLinkedChild(auth, studentId);
  return listStudentPhotos(auth, studentId, opts, timeZone);
}
