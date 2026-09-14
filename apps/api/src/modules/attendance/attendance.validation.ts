import {
  optionalObjectId,
  parsePagination,
  requireString,
  validationError,
} from '../../utils/validate';
import { isDateOnly } from '../../utils/timezone';

const QR_TOKEN_MAX_LENGTH = 64;

export function parseScanBody(body: {
  qrToken?: unknown;
  organizationId?: unknown;
  studentId?: unknown;
  scannedBy?: unknown;
}) {
  const qrToken = requireString(body.qrToken, 'qrToken');
  if (qrToken.length > QR_TOKEN_MAX_LENGTH) {
    throw validationError('qrToken', `Must be at most ${QR_TOKEN_MAX_LENGTH} characters`);
  }
  return { qrToken };
}

export function parseAttendanceListQuery(query: {
  page?: unknown;
  limit?: unknown;
  date?: unknown;
  classroomId?: unknown;
  studentId?: unknown;
}) {
  return {
    ...parsePagination(query),
    date: optionalDateOnly(query.date),
    classroomId: optionalObjectId(query.classroomId, 'classroomId'),
    studentId: optionalObjectId(query.studentId, 'studentId'),
  };
}

function optionalDateOnly(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = requireString(value, 'date');
  if (!isDateOnly(parsed)) {
    throw validationError('date', 'Must be YYYY-MM-DD');
  }
  return parsed;
}
