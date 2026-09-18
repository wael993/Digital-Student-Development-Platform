import { TENANT_ROLES, USER_STATUSES, type TenantRole, type UserStatus } from '../../types';
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

function requireEmail(value: unknown, field: string): string {
  const email = requireString(value, field).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw validationError(field, 'Must be a valid email');
  }
  return email;
}

function parseIdList(value: unknown, field: string): string[] | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    throw validationError(field, 'Must be an array');
  }
  return value.map((item, index) => requireObjectId(item, `${field}[${index}]`));
}

export function parseListUsersQuery(query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);
  return {
    page,
    limit,
    skip,
    role: optionalEnum(query.role, 'role', TENANT_ROLES),
    status: optionalEnum(query.status, 'status', USER_STATUSES),
    campusId: optionalObjectId(query.campusId, 'campusId'),
    q: asTrimmedString(query.q)?.toLowerCase(),
  };
}

export function parseCreateUser(body: Record<string, unknown>) {
  const role = requireEnum(body.role, 'role', TENANT_ROLES);
  const email = requireEmail(body.email, 'email');
  const firstName = requireString(body.firstName, 'firstName');
  const lastName = requireString(body.lastName, 'lastName');
  const password = asTrimmedString(body.password);
  if (password !== undefined && password.length < 8) {
    throw validationError('password', 'Must be at least 8 characters');
  }
  const invite = body.invite === true || password === undefined;
  const campusIds = parseIdList(body.campusIds, 'campusIds') ?? [];
  const classroomIds = parseIdList(body.classroomIds, 'classroomIds') ?? [];
  const routeIds = parseIdList(body.routeIds, 'routeIds') ?? [];

  return {
    email,
    firstName,
    lastName,
    role: role as TenantRole,
    password,
    invite,
    campusIds,
    classroomIds,
    routeIds,
  };
}

export function parsePatchUser(body: Record<string, unknown>) {
  const firstName = asTrimmedString(body.firstName);
  const lastName = asTrimmedString(body.lastName);
  const status = optionalEnum(body.status, 'status', USER_STATUSES);
  const role = optionalEnum(body.role, 'role', TENANT_ROLES);
  const campusIds = parseIdList(body.campusIds, 'campusIds');
  const classroomIds = parseIdList(body.classroomIds, 'classroomIds');
  const routeIds = parseIdList(body.routeIds, 'routeIds');

  if (
    !firstName &&
    !lastName &&
    !status &&
    !role &&
    campusIds === undefined &&
    classroomIds === undefined &&
    routeIds === undefined
  ) {
    throw validationError('firstName', 'At least one field is required');
  }

  return {
    firstName,
    lastName,
    status: status as UserStatus | undefined,
    role: role as TenantRole | undefined,
    campusIds,
    classroomIds,
    routeIds,
  };
}

export function parseInviteUser(body: Record<string, unknown>) {
  return {
    email: body.email !== undefined ? requireEmail(body.email, 'email') : undefined,
    firstName: asTrimmedString(body.firstName),
    lastName: asTrimmedString(body.lastName),
  };
}
