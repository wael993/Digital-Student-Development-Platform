import mongoose from 'mongoose';
import { isDateOnly } from '../../utils/timezone';
import {
  notFound,
  optionalDate,
  parsePagination,
  requireEnum,
  requireString,
  validationError,
} from '../../utils/validate';
import { MEDIA_TYPES } from './media.model';

export function parseStudentIdParam(value: unknown): string {
  if (typeof value !== 'string' || !mongoose.isValidObjectId(value)) {
    throw notFound();
  }
  return value;
}

export function parseMediaIdParam(value: unknown): string {
  if (typeof value !== 'string' || !mongoose.isValidObjectId(value)) {
    throw notFound();
  }
  return value;
}

export function parseUploadFields(body: { mediaType?: unknown; capturedAt?: unknown }) {
  return {
    mediaType: requireEnum(body.mediaType ?? 'PHOTO', 'mediaType', MEDIA_TYPES),
    capturedAt: optionalDate(body.capturedAt, 'capturedAt') ?? new Date(),
  };
}

export function parseMediaListQuery(query: {
  date?: unknown;
  mediaType?: unknown;
  page?: unknown;
  limit?: unknown;
}) {
  return {
    ...parsePagination(query),
    date: optionalDateOnly(query.date),
    mediaType:
      query.mediaType === undefined || query.mediaType === null || query.mediaType === ''
        ? undefined
        : requireEnum(query.mediaType, 'mediaType', MEDIA_TYPES),
  };
}

export function parseSignedFileQuery(query: { k?: unknown; e?: unknown; s?: unknown }) {
  const key = requireString(query.k, 'k');
  const expires = requireString(query.e, 'e');
  const signature = requireString(query.s, 's');
  const expiresAtUnix = Number(expires);
  if (!Number.isFinite(expiresAtUnix)) {
    throw validationError('e', 'Invalid expiry');
  }
  return { key, expiresAtUnix, signature };
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
