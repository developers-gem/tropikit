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

function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

export interface IcsReminder {
  label: string;
  scheduledFor: Date;
  type: string;
}

/**
 * Generates a valid RFC 5545 .ics file bundling every reminder for a trip into one calendar
 * a user can import once. Each reminder becomes an all-day VEVENT with a same-day VALARM —
 * matches the format already verified to import correctly in the existing per-plan export.
 */
export function buildTripIcs(params: { destinationName: string; reminders: IcsReminder[] }): string {
  const stamp = toIcsStamp(new Date());
  const uid = () => `${Math.random().toString(36).slice(2)}-${Date.now()}@tropikit`;

  const events = params.reminders.map((r) =>
    [
      "BEGIN:VEVENT",
      `UID:${uid()}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${toIcsDate(r.scheduledFor)}`,
      `DTEND;VALUE=DATE:${toIcsDate(addDays(r.scheduledFor, 1))}`,
      `SUMMARY:${icsEscape(`${r.label} — ${params.destinationName}`)}`,
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      "TRIGGER:-PT0M",
      `DESCRIPTION:${icsEscape(r.label)}`,
      "END:VALARM",
      "END:VEVENT",
    ].join("\r\n"),
  );

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Tropikit//Trip Reminders//EN",
    "CALSCALE:GREGORIAN",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");
}
