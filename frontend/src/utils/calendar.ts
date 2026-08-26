function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

function toIcsDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function toIcsStamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function icsEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export function buildIcs(params: {
  destination: string;
  drugLabel: string;
  frequency: string;
  beginMeds: Date;
  stopMeds: Date;
  tripStart: Date;
  tripEnd: Date;
  isWeekly: boolean;
}): string {
  const { destination, drugLabel, frequency, beginMeds, stopMeds, tripStart, tripEnd, isWeekly } =
    params;
  const stamp = toIcsStamp(new Date());
  const uid = () => `${Math.random().toString(36).slice(2)}-${Date.now()}@tropikit`;
  const doseUntil = toIcsDate(addDays(stopMeds, 1));
  const biteUntil = toIcsDate(addDays(tripEnd, 1));
  const events: string[] = [];

  events.push(
    [
      "BEGIN:VEVENT",
      `UID:${uid()}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${toIcsDate(beginMeds)}`,
      `DTEND;VALUE=DATE:${toIcsDate(addDays(beginMeds, 1))}`,
      `RRULE:FREQ=${isWeekly ? "WEEKLY" : "DAILY"};UNTIL=${doseUntil}`,
      `SUMMARY:${icsEscape(`Antimalarial dose — ${drugLabel}`)}`,
      `DESCRIPTION:${icsEscape(`${frequency}. Trip to ${destination}. Keep taking until ${stopMeds.toDateString()}.`)}`,
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      "TRIGGER:-PT0M",
      `DESCRIPTION:${icsEscape("Take your antimalarial")}`,
      "END:VALARM",
      "END:VEVENT",
    ].join("\r\n"),
  );

  events.push(
    [
      "BEGIN:VEVENT",
      `UID:${uid()}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${toIcsDate(tripStart)}`,
      `DTEND;VALUE=DATE:${toIcsDate(addDays(tripStart, 1))}`,
      `RRULE:FREQ=DAILY;UNTIL=${biteUntil}`,
      `SUMMARY:${icsEscape(`Bite prevention — ${destination}`)}`,
      `DESCRIPTION:${icsEscape("Apply DEET at dusk, cover arms/legs, use a permethrin-treated net tonight.")}`,
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      "TRIGGER:-PT30M",
      `DESCRIPTION:${icsEscape("Bite prevention window starting")}`,
      "END:VALARM",
      "END:VEVENT",
    ].join("\r\n"),
  );

  events.push(
    [
      "BEGIN:VEVENT",
      `UID:${uid()}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${toIcsDate(stopMeds)}`,
      `DTEND;VALUE=DATE:${toIcsDate(addDays(stopMeds, 1))}`,
      `SUMMARY:${icsEscape(`Final antimalarial dose — ${destination}`)}`,
      `DESCRIPTION:${icsEscape("Last scheduled dose. Watch for fever for 3 months and mention travel history to any clinician.")}`,
      "END:VEVENT",
    ].join("\r\n"),
  );

  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Tropikit//Travel Health//EN", "CALSCALE:GREGORIAN", ...events, "END:VCALENDAR"].join(
    "\r\n",
  );
}

export function downloadIcs(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function buildGoogleCalendarUrl(params: {
  title: string;
  details: string;
  dates: string;
  recur?: string;
  ctz?: string;
}): string {
  const u = new URL("https://calendar.google.com/calendar/render");
  u.searchParams.set("action", "TEMPLATE");
  u.searchParams.set("text", params.title);
  u.searchParams.set("dates", params.dates);
  u.searchParams.set("details", params.details);
  if (params.recur) u.searchParams.set("recur", `RRULE:${params.recur}`);
  if (params.ctz) u.searchParams.set("ctz", params.ctz);
  return u.toString();
}

export function gcalDate(d: Date): string {
  return toIcsDate(d);
}

export function gcalDateTime(d: Date, hour: number, minute = 0): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return `${y}${m}${day}T${hh}${mm}00`;
}

export function openGoogleCalendarEvents(events: { url: string }[]) {
  events.forEach((e, i) => {
    setTimeout(() => window.open(e.url, "_blank", "noopener,noreferrer"), i * 250);
  });
}

export function formatInTz(d: Date, tz: string, hour: number, minute = 0): string {
  const wall = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), hour, minute));
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone: tz,
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    })
      .format(wall)
      .replace("UTC", tz);
  } catch {
    return `${wall.toISOString().slice(0, 16).replace("T", " ")} (${tz})`;
  }
}

export const COMMON_TIMEZONES: string[] = (() => {
  const anyIntl = Intl as unknown as { supportedValuesOf?: (k: string) => string[] };
  if (typeof anyIntl.supportedValuesOf === "function") {
    try {
      return anyIntl.supportedValuesOf("timeZone");
    } catch {
      /* fall through */
    }
  }
  return [
    "UTC", "Europe/London", "Europe/Paris", "Europe/Berlin", "Africa/Lagos", "Africa/Nairobi",
    "Africa/Johannesburg", "Asia/Dubai", "Asia/Kolkata", "Asia/Bangkok", "Asia/Singapore",
    "Asia/Hong_Kong", "Asia/Tokyo", "Australia/Sydney", "Pacific/Auckland",
    "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
    "America/Mexico_City", "America/Bogota", "America/Lima", "America/Sao_Paulo",
  ];
})();

/**
 * Browser notification reminder.
 *
 * KNOWN LIMITATION, carried over intentionally from the original prototype and now
 * documented rather than silently trusted: this relies on a setTimeout surviving in an
 * open tab. It will NOT fire if the tab is closed, refreshed, or the device sleeps/restarts
 * before the target time — which is likely for anything more than a few hours out. The
 * .ics / Google Calendar export is the reliable option for anything beyond same-session use;
 * the UI must say this explicitly rather than imply a durable reminder (see MalariaScheduler).
 */
export async function scheduleBrowserReminder(
  title: string,
  body: string,
  when: Date,
): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }
  let perm = Notification.permission;
  if (perm === "default") perm = await Notification.requestPermission();
  if (perm !== "granted") return false;

  const delay = when.getTime() - Date.now();
  if (delay <= 0) {
    new Notification(title, { body });
    return true;
  }
  const MAX = 2_000_000_000;
  const fire = () => new Notification(title, { body });
  const chain = (remaining: number) => {
    if (remaining <= MAX) window.setTimeout(fire, remaining);
    else window.setTimeout(() => chain(remaining - MAX), MAX);
  };
  chain(delay);
  return true;
}
