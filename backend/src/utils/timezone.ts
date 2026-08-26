/**
 * Reliable IANA timezone handling.
 *
 * Design principle: dates are always stored/computed in UTC (as plain Date objects, via the
 * existing malariaService date math, which operates on calendar days and is timezone-agnostic
 * by construction). The timezone is used ONLY at display/calendar-export time, to render a
 * specific wall-clock time in that zone. This avoids the classic bug where a stored timezone
 * silently shifts a date by re-interpreting it — the calendar day for "start medication" never
 * changes based on timezone; only the hour shown for a reminder does.
 */

export function isValidTimezone(tz: string): boolean {
  if (typeof tz !== "string" || tz.length === 0 || tz.length > 100) return false;
  try {
    // Intl throws a RangeError for any string that isn't a real IANA zone — this is the
    // actual Node/ICU timezone database, not a hand-maintained list that can drift out of
    // date, so it correctly recognizes every zone we're asked to support (Asia/Calcutta,
    // Europe/London, America/New_York, America/Los_Angeles, Australia/Sydney, etc).
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Formats a specific wall-clock hour/minute on a given calendar date, as it would read in
 * the target timezone. `date` supplies only the year/month/day (its own time-of-day and
 * timezone are ignored) — this is what lets a reminder say "8:00 AM in Asia/Calcutta" without
 * that 8:00 AM silently becoming 8:00 AM UTC or shifting to a different calendar day.
 */
export function formatWallClockInTimezone(
  date: Date,
  hour: number,
  minute: number,
  timezone: string,
): string {
  const wall = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute));
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(wall);
  } catch {
    return wall.toISOString();
  }
}

export const SUPPORTED_TEST_TIMEZONES = [
  "Asia/Calcutta",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "Australia/Sydney",
] as const;
