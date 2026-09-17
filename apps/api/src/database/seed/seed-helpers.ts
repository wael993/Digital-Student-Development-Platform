import type { Model } from 'mongoose';
import { utcRangeForCalendarDate } from '../../utils/timezone';

export async function upsert<T>(
  model: Model<T>,
  filter: Record<string, unknown>,
  set: Record<string, unknown>,
  setOnInsert?: Record<string, unknown>,
) {
  return model.findOneAndUpdate(
    filter,
    setOnInsert ? { $set: set, $setOnInsert: setOnInsert } : { $set: set },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

export function atLocal(dateOnly: string, hours: number, minutes: number, timeZone: string): Date {
  const { start } = utcRangeForCalendarDate(dateOnly, timeZone);
  return new Date(start.getTime() + (hours * 60 + minutes) * 60_000);
}

export function childKey(familyKey: string, firstName: string): string {
  return `${familyKey}/${firstName}`;
}
