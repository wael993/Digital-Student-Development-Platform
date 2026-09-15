import type { AuthContext } from '../../types';
import { AppError } from '../../utils/appError';
import { logger } from '../../utils/logger';
import { paginated } from '../../utils/validate';
import { calendarDateInTimeZone } from '../../utils/timezone';
import { assertStudentReadable } from '../students/student.service';
import { listStudentIdsForGuardian } from '../guardians/guardian.repository';
import {
  findStudentById,
  findStudentByQrToken,
  findStudentsByIds,
} from '../students/student.repository';
import type { Student } from '../students/student.model';
import { ensureAttendancePresentEvent } from '../journey/journey.service';
import {
  createAttendance,
  findAttendanceByStudentDate,
  listAttendance,
} from './attendance.repository';
import type { Attendance } from './attendance.model';

// note: in-memory counters per process; replace with Redis if scan abuse needs a shared limiter.
const invalidScanCounts = new Map<string, { count: number; windowStart: number }>();
const INVALID_SCAN_WINDOW_MS = 60_000;
const INVALID_SCAN_WARN_AFTER = 10;

export type ScanStatus = 'RECORDED' | 'ALREADY_RECORDED';

export function toAttendanceScanJson(
  status: ScanStatus,
  attendance: Attendance & { id: string },
  student: Student & { id: string },
) {
  return {
    status,
    attendance: {
      id: attendance.id,
      attendanceType: attendance.attendanceType,
      scannedAt: attendance.scannedAt.toISOString(),
    },
    student: {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      studentNumber: student.studentNumber,
    },
  };
}

export function toAttendanceListItem(
  attendance: Attendance & { id: string },
  student: Student & { id: string },
) {
  return {
    id: attendance.id,
    student: {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      studentNumber: student.studentNumber,
    },
    attendanceType: attendance.attendanceType,
    scannedAt: attendance.scannedAt.toISOString(),
    scannedBy: String(attendance.scannedBy),
  };
}

export async function scan(auth: AuthContext, qrToken: string, timeZone: string) {
  const student = await findStudentByQrToken(auth.organizationId, qrToken);
  if (!student) {
    noteInvalidScan(auth, 'not_found');
    throw new AppError(404, 'NOT_FOUND', 'Student not found');
  }

  await assertStudentInScanScope(auth, student);

  const scannedAt = new Date();
  const date = calendarDateInTimeZone(scannedAt, timeZone);
  const existing = await findAttendanceByStudentDate(auth.organizationId, student.id, date);
  if (existing) {
    await recordAttendanceJourney(auth, student, existing, timeZone);
    return toAttendanceScanJson('ALREADY_RECORDED', existing, student);
  }

  if (student.status !== 'ACTIVE') {
    throw new AppError(400, 'BAD_REQUEST', 'Student is not active');
  }

  try {
    const attendance = await createAttendance(auth.organizationId, {
      studentId: student.id,
      campusId: String(student.campusId),
      classroomId: String(student.classroomId),
      date,
      attendanceType: 'PRESENT',
      scannedAt,
      scannedBy: auth.userId,
      source: 'QR',
    });
    // note: standalone Mongo has no multi-doc transactions. Event insert follows attendance; ALREADY_RECORDED repairs a missing event. Use a replica-set transaction when the cluster supports it.
    await recordAttendanceJourney(auth, student, attendance, timeZone);
    return toAttendanceScanJson('RECORDED', attendance, student);
  } catch (err) {
    if (!isDuplicateKeyError(err)) {
      throw err;
    }
    const raced = await findAttendanceByStudentDate(auth.organizationId, student.id, date);
    if (!raced) {
      throw err;
    }
    await recordAttendanceJourney(auth, student, raced, timeZone);
    return toAttendanceScanJson('ALREADY_RECORDED', raced, student);
  }
}

async function recordAttendanceJourney(
  auth: AuthContext,
  student: Student & { id: string },
  attendance: Attendance & { id: string },
  timeZone: string,
): Promise<void> {
  await ensureAttendancePresentEvent(
    auth.organizationId,
    student.id,
    attendance.id,
    attendance.scannedAt,
    auth.userId,
    timeZone,
  );
}

export async function ensurePresentAttendance(
  auth: AuthContext,
  student: Student & { id: string },
  occurredAt: Date,
  timeZone: string,
  source: Attendance['source'],
) {
  const date = calendarDateInTimeZone(occurredAt, timeZone);
  const existing = await findAttendanceByStudentDate(auth.organizationId, student.id, date);
  if (existing) {
    await recordAttendanceJourney(auth, student, existing, timeZone);
    return existing;
  }
  try {
    const attendance = await createAttendance(auth.organizationId, {
      studentId: student.id,
      campusId: String(student.campusId),
      classroomId: String(student.classroomId),
      date,
      attendanceType: 'PRESENT',
      scannedAt: occurredAt,
      scannedBy: auth.userId,
      source,
    });
    await recordAttendanceJourney(auth, student, attendance, timeZone);
    return attendance;
  } catch (err) {
    if (!isDuplicateKeyError(err)) {
      throw err;
    }
    const raced = await findAttendanceByStudentDate(auth.organizationId, student.id, date);
    if (!raced) {
      throw err;
    }
    await recordAttendanceJourney(auth, student, raced, timeZone);
    return raced;
  }
}

export async function list(
  auth: AuthContext,
  opts: {
    date?: string;
    classroomId?: string;
    studentId?: string;
    page: number;
    limit: number;
    skip: number;
  },
  timeZone: string,
) {
  const extra = await attendanceListFilter(auth, {
    ...opts,
    date: opts.date ?? calendarDateInTimeZone(new Date(), timeZone),
  });
  if (extra === null) {
    return paginated([], opts.page, opts.limit, 0);
  }

  const result = await listAttendance(auth.organizationId, extra, opts.skip, opts.limit);
  const studentIds = [...new Set(result.items.map((row) => String(row.studentId)))];
  const students = await findStudentsByIds(auth.organizationId, studentIds);
  const byId = new Map(students.map((student) => [student.id, student]));
  return paginated(
    result.items.flatMap((row) => {
      const student = byId.get(String(row.studentId));
      return student ? [toAttendanceListItem(row, student)] : [];
    }),
    opts.page,
    opts.limit,
    result.total,
  );
}

async function attendanceListFilter(
  auth: AuthContext,
  opts: { date: string; classroomId?: string; studentId?: string },
): Promise<Record<string, unknown> | null> {
  const extra: Record<string, unknown> = { date: opts.date };
  if (opts.classroomId) extra.classroomId = opts.classroomId;
  if (opts.studentId) extra.studentId = opts.studentId;

  if (auth.role === 'ADMIN') {
    return extra;
  }
  if (auth.role === 'SUPERVISOR') {
    if (auth.campusIds.length === 0) return null;
    extra.campusId = { $in: auth.campusIds };
    return extra;
  }
  if (auth.role === 'TEACHER') {
    if (auth.classroomIds.length === 0) return null;
    if (opts.classroomId && !auth.classroomIds.includes(opts.classroomId)) return null;
    extra.classroomId = opts.classroomId ?? { $in: auth.classroomIds };
    return extra;
  }
  if (auth.role === 'GUARDIAN') {
    if (opts.studentId) {
      const student = await findStudentById(auth.organizationId, opts.studentId);
      if (!student) return null;
      try {
        await assertStudentReadable(auth, student);
      } catch {
        return null;
      }
      extra.studentId = opts.studentId;
      return extra;
    }
    const ids = await listStudentIdsForGuardian(auth.organizationId, auth.userId);
    if (ids.length === 0) return null;
    extra.studentId = { $in: ids };
    return extra;
  }
  return null;
}

async function assertStudentInScanScope(
  auth: AuthContext,
  student: Student & { id: string },
): Promise<void> {
  try {
    await assertStudentReadable(auth, student);
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 404) {
      noteInvalidScan(auth, 'not_found');
      throw new AppError(404, 'NOT_FOUND', 'Student not found');
    }
    throw err;
  }
}

function noteInvalidScan(auth: AuthContext, reason: string): void {
  logger.warn('Attendance scan rejected', {
    organizationId: auth.organizationId,
    userId: auth.userId,
    reason,
  });

  // note: per-process map; cap size so idle keys cannot grow without bound.
  if (invalidScanCounts.size > 500) {
    invalidScanCounts.clear();
  }

  const now = Date.now();
  const key = `${auth.organizationId}:${auth.userId}`;
  const current = invalidScanCounts.get(key);
  if (!current || now - current.windowStart > INVALID_SCAN_WINDOW_MS) {
    invalidScanCounts.set(key, { count: 1, windowStart: now });
    return;
  }
  current.count += 1;
  if (current.count === INVALID_SCAN_WARN_AFTER) {
    logger.warn('Repeated invalid attendance scans', {
      organizationId: auth.organizationId,
      userId: auth.userId,
      count: current.count,
    });
  }
}

function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && err.code === 11000;
}
