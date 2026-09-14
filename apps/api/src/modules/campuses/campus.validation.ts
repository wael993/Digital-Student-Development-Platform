import { CAMPUS_STATUSES, type CampusStatus } from './campus.model';
import {
  asTrimmedString,
  optionalEnum,
  parsePagination,
  requireString,
  validationError,
} from '../../utils/validate';

export function parseCreateCampus(body: { name?: unknown; status?: unknown }) {
  return {
    name: requireString(body.name, 'name'),
    status: optionalEnum(body.status, 'status', CAMPUS_STATUSES),
  };
}

export function parsePatchCampus(body: { name?: unknown; status?: unknown }) {
  const name = asTrimmedString(body.name);
  const status = optionalEnum(body.status, 'status', CAMPUS_STATUSES);
  if (!name && !status) {
    throw validationError('name', 'Required');
  }
  return { name, status } as { name?: string; status?: CampusStatus };
}

export function parseListQuery(query: { page?: unknown; limit?: unknown }) {
  return parsePagination(query);
}
