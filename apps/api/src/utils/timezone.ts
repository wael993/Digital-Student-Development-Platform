const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export function isValidTimeZone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** Calendar date `YYYY-MM-DD` in the given IANA timezone. Falls back to UTC. */
export function calendarDateInTimeZone(at: Date, timeZone: string): string {
  const zone = isValidTimeZone(timeZone) ? timeZone : 'UTC';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(at);
}

export function isDateOnly(value: string): boolean {
  if (!DATE_ONLY.test(value)) {
    return false;
  }
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

/** UTC range covering a calendar `YYYY-MM-DD` in `timeZone`. End is exclusive. */
export function utcRangeForCalendarDate(
  dateOnly: string,
  timeZone: string,
): { start: Date; endExclusive: Date } {
  const next = nextDateOnly(dateOnly);
  return {
    start: wallClockToUtc(dateOnly, timeZone),
    endExclusive: wallClockToUtc(next, timeZone),
  };
}

function nextDateOnly(dateOnly: string): string {
  const [year, month, day] = dateOnly.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  return [
    next.getUTCFullYear(),
    String(next.getUTCMonth() + 1).padStart(2, '0'),
    String(next.getUTCDate()).padStart(2, '0'),
  ].join('-');
}

function wallClockToUtc(dateOnly: string, timeZone: string): Date {
  const zone = isValidTimeZone(timeZone) ? timeZone : 'UTC';
  const [year, month, day] = dateOnly.split('-').map(Number);
  const wanted = Date.UTC(year, month - 1, day, 0, 0, 0);
  let guess = wanted;
  for (let i = 0; i < 3; i += 1) {
    const parts = partsInTimeZone(new Date(guess), zone);
    const asLocal = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    );
    guess += wanted - asLocal;
  }
  return new Date(guess);
}

function partsInTimeZone(at: Date, timeZone: string) {
  const map = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(at)
      .map((part) => [part.type, part.value]),
  );
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
  };
}
