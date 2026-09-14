import {
  CLASSROOM_LEVELS,
  CLASSROOM_STATUSES,
  type ClassroomLevel,
  type ClassroomStatus,
} from './classroom.model';
import {
  asTrimmedString,
  optionalEnum,
  optionalObjectId,
  parsePagination,
  requireEnum,
  requireObjectId,
  requireString,
  validationError,
} from '../../utils/validate';

export function parseCreateClassroom(body: {
  campusId?: unknown;
  name?: unknown;
  level?: unknown;
  status?: unknown;
  teacherIds?: unknown;
}) {
  return {
    campusId: requireObjectId(body.campusId, 'campusId'),
    name: requireString(body.name, 'name'),
    level: requireEnum(body.level, 'level', CLASSROOM_LEVELS),
    status: optionalEnum(body.status, 'status', CLASSROOM_STATUSES),
    teacherIds: parseTeacherIds(body.teacherIds),
  };
}

export function parsePatchClassroom(body: {
  campusId?: unknown;
  name?: unknown;
  level?: unknown;
  status?: unknown;
  teacherIds?: unknown;
}) {
  const patch: {
    campusId?: string;
    name?: string;
    level?: ClassroomLevel;
    status?: ClassroomStatus;
    teacherIds?: string[];
  } = {
    campusId: optionalObjectId(body.campusId, 'campusId'),
    name: asTrimmedString(body.name),
    level: optionalEnum(body.level, 'level', CLASSROOM_LEVELS),
    status: optionalEnum(body.status, 'status', CLASSROOM_STATUSES),
  };
  if (body.teacherIds !== undefined) {
    patch.teacherIds = parseTeacherIds(body.teacherIds) ?? [];
  }
  if (
    !patch.campusId &&
    !patch.name &&
    !patch.level &&
    !patch.status &&
    patch.teacherIds === undefined
  ) {
    throw validationError('name', 'Required');
  }
  return patch;
}

export function parseClassroomListQuery(query: {
  page?: unknown;
  limit?: unknown;
  campusId?: unknown;
}) {
  return {
    ...parsePagination(query),
    campusId: optionalObjectId(query.campusId, 'campusId'),
  };
}

function parseTeacherIds(value: unknown): string[] | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    throw validationError('teacherIds', 'Must be an array');
  }
  return value.map((id, index) => requireObjectId(id, `teacherIds[${index}]`));
}
