import {
  STUDENT_GENDERS,
  STUDENT_STATUSES,
  type StudentGender,
  type StudentStatus,
} from './student.model';
import {
  asTrimmedString,
  optionalEnum,
  optionalObjectId,
  optionalString,
  parsePagination,
  requireDate,
  requireEnum,
  requireObjectId,
  requireString,
  validationError,
} from '../../utils/validate';

export function parseCreateStudent(body: {
  firstName?: unknown;
  lastName?: unknown;
  dateOfBirth?: unknown;
  gender?: unknown;
  studentNumber?: unknown;
  classroomId?: unknown;
  campusId?: unknown;
  status?: unknown;
  organizationId?: unknown;
}) {
  return {
    firstName: requireString(body.firstName, 'firstName'),
    lastName: requireString(body.lastName, 'lastName'),
    dateOfBirth: requireDate(body.dateOfBirth, 'dateOfBirth'),
    gender: requireEnum(body.gender, 'gender', STUDENT_GENDERS),
    studentNumber: requireString(body.studentNumber, 'studentNumber'),
    classroomId: requireObjectId(body.classroomId, 'classroomId'),
    campusId: optionalObjectId(body.campusId, 'campusId'),
    status: optionalEnum(body.status, 'status', STUDENT_STATUSES),
  };
}

export function parsePatchStudent(body: {
  firstName?: unknown;
  lastName?: unknown;
  dateOfBirth?: unknown;
  gender?: unknown;
  studentNumber?: unknown;
  classroomId?: unknown;
  campusId?: unknown;
  status?: unknown;
  qrToken?: unknown;
}) {
  const patch: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: Date;
    gender?: StudentGender;
    studentNumber?: string;
    classroomId?: string;
    campusId?: string;
    status?: StudentStatus;
  } = {
    firstName: asTrimmedString(body.firstName),
    lastName: asTrimmedString(body.lastName),
    dateOfBirth:
      body.dateOfBirth === undefined ? undefined : requireDate(body.dateOfBirth, 'dateOfBirth'),
    gender: optionalEnum(body.gender, 'gender', STUDENT_GENDERS),
    studentNumber: asTrimmedString(body.studentNumber),
    classroomId: optionalObjectId(body.classroomId, 'classroomId'),
    campusId: optionalObjectId(body.campusId, 'campusId'),
    status: optionalEnum(body.status, 'status', STUDENT_STATUSES),
  };
  if (Object.values(patch).every((value) => value === undefined)) {
    throw validationError('firstName', 'Required');
  }
  return patch;
}

export function parseStudentListQuery(query: {
  page?: unknown;
  limit?: unknown;
  classroomId?: unknown;
  campusId?: unknown;
  search?: unknown;
  status?: unknown;
}) {
  return {
    ...parsePagination(query),
    classroomId: optionalObjectId(query.classroomId, 'classroomId'),
    campusId: optionalObjectId(query.campusId, 'campusId'),
    search: optionalString(query.search, 'search'),
    status: optionalEnum(query.status, 'status', STUDENT_STATUSES),
  };
}

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
