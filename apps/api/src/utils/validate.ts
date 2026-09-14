import mongoose from 'mongoose';
import { AppError } from './appError';

export function asTrimmedString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

export function requireString(value: unknown, field: string): string {
  const parsed = asTrimmedString(value);
  if (!parsed) {
    throw validationError(field, 'Required');
  }
  return parsed;
}

export function optionalString(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw validationError(field, 'Must be a string');
  }
  const parsed = value.trim();
  return parsed === '' ? undefined : parsed;
}

export function requireObjectId(value: unknown, field: string): string {
  const parsed = asTrimmedString(value);
  if (!parsed || !mongoose.isValidObjectId(parsed)) {
    throw validationError(field, 'Invalid id');
  }
  return parsed;
}

export function optionalObjectId(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return requireObjectId(value, field);
}

export function requireEnum<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[],
): T {
  const parsed = requireString(value, field);
  if (!(allowed as readonly string[]).includes(parsed)) {
    throw validationError(field, `Must be one of: ${allowed.join(', ')}`);
  }
  return parsed as T;
}

export function optionalEnum<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[],
): T | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return requireEnum(value, field, allowed);
}

export function requireDate(value: unknown, field: string): Date {
  const parsed = typeof value === 'string' || value instanceof Date ? new Date(value) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) {
    throw validationError(field, 'Invalid date');
  }
  return parsed;
}

export function optionalDate(value: unknown, field: string): Date | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return requireDate(value, field);
}

export function optionalBoolean(value: unknown, field: string): boolean | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (typeof value !== 'boolean') {
    throw validationError(field, 'Must be a boolean');
  }
  return value;
}

export function parsePagination(query: { page?: unknown; limit?: unknown }): {
  page: number;
  limit: number;
  skip: number;
} {
  const page = Math.max(1, toPositiveInt(query.page) ?? 1);
  const limit = Math.min(100, Math.max(1, toPositiveInt(query.limit) ?? 20));
  return { page, limit, skip: (page - 1) * limit };
}

export function validationError(field: string, message: string): AppError {
  return new AppError(422, 'VALIDATION_ERROR', `${field} ${message.toLowerCase()}`, [
    { field, message },
  ]);
}

export function notFound(): AppError {
  return new AppError(404, 'NOT_FOUND', 'Not Found');
}

export function conflict(message: string): AppError {
  return new AppError(409, 'UNIQUE_CONFLICT', message);
}

export function paginated<T>(data: T[], page: number, limit: number, total: number) {
  return { data, meta: { page, limit, total } };
}

function toPositiveInt(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) {
    return undefined;
  }
  return n;
}
