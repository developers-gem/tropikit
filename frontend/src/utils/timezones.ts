/**
 * The timezones this app is explicitly tested against (see the backend's timezone test
 * matrix). Any valid IANA zone works — this list is just what's offered by default in the
 * picker for convenience, plus the user's browser-detected zone if it isn't already here.
 */
export const SUPPORTED_TIMEZONES = [
  "Asia/Calcutta",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "Australia/Sydney",
  "UTC",
] as const;
