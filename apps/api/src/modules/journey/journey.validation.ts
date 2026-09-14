import { isDateOnly } from '../../utils/timezone';
import { requireDate, requireEnum, requireString, validationError } from '../../utils/validate';
import { STUDENT_EVENT_TYPES } from './student-event.model';

const MAX_FUTURE_MS = 60 * 60 * 1000;
const MAX_PAST_MS = 14 * 24 * 60 * 60 * 1000;
const METADATA_MAX_KEYS = 20;
const METADATA_STRING_MAX = 200;

export function parseCreateEvent(body: {
  eventType?: unknown;
  occurredAt?: unknown;
  metadata?: unknown;
  organizationId?: unknown;
  recordedBy?: unknown;
  studentId?: unknown;
  source?: unknown;
}) {
  return {
    eventType: requireEnum(body.eventType, 'eventType', STUDENT_EVENT_TYPES),
    occurredAt: parseOccurredAt(body.occurredAt),
    metadata: parseMetadata(body.metadata),
  };
}

export function parseEventListQuery(query: { date?: unknown }) {
  return { date: optionalDateOnly(query.date) };
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

function parseOccurredAt(value: unknown, now = new Date()): Date {
  if (value === undefined || value === null || value === '') {
    return now;
  }
  const parsed = requireDate(value, 'occurredAt');
  if (parsed.getTime() - now.getTime() > MAX_FUTURE_MS) {
    throw validationError('occurredAt', 'Must not be far in the future');
  }
  if (now.getTime() - parsed.getTime() > MAX_PAST_MS) {
    throw validationError('occurredAt', 'Is too far in the past');
  }
  return parsed;
}

function parseMetadata(value: unknown): Record<string, unknown> {
  if (value === undefined || value === null || value === '') {
    return {};
  }
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw validationError('metadata', 'Must be an object');
  }
  const entries = Object.entries(value as Record<string, unknown>).filter(
    ([key]) => key !== 'organizationId' && key !== 'studentId' && key !== 'recordedBy',
  );
  if (entries.length > METADATA_MAX_KEYS) {
    throw validationError('metadata', `Must have at most ${METADATA_MAX_KEYS} keys`);
  }
  const metadata: Record<string, unknown> = {};
  for (const [key, entry] of entries) {
    if (entry !== null && typeof entry === 'object') {
      throw validationError('metadata', 'Nested objects are not allowed');
    }
    if (typeof entry === 'string' && entry.length > METADATA_STRING_MAX) {
      throw validationError('metadata', `Values must be at most ${METADATA_STRING_MAX} characters`);
    }
    metadata[key] = entry;
  }
  return metadata;
}
