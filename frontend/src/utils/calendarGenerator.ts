// frontend/src/utils/calendarGenerator.ts

export interface MalariaDosingConfig {
  drugName: string;
  startDate: string; // ISO date string YYYY-MM-DD
  endDate: string;   // ISO date string YYYY-MM-DD
  frequency: "daily" | "weekly";
  destinationName: string;
  notes?: string;
}

export interface TripICSOptions {
  tripId: string;
  destinationName: string;
  departureDate: string;
  returnDate: string;
  malariaPlan?: MalariaDosingConfig | null;
  vaccines?: string[];
  emergencyContacts?: { name: string; number: string }[];
}

function formatDateToICS(isoString: string, allDay = false): string {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const year = d.getUTCFullYear();
  const month = pad(d.getUTCMonth() + 1);
  const day = pad(d.getUTCDate());

  if (allDay) {
    return `${year}${month}${day}`;
  }

  const hours = pad(d.getUTCHours());
  const minutes = pad(d.getUTCMinutes());
  const seconds = pad(d.getUTCSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

export function generateTripICS(params: TripICSOptions): string {
  const {
    tripId,
    destinationName,
    departureDate,
    returnDate,
    malariaPlan,
    vaccines = [],
  } = params;

  const nowICS = formatDateToICS(new Date().toISOString());
  const events: string[] = [];

  // 1. Departure Event
  const depStart = formatDateToICS(departureDate, true);
  events.push(`BEGIN:VEVENT
UID:trip-dep-${tripId}@tropikit.com
DTSTAMP:${nowICS}
DTSTART;VALUE=DATE:${depStart}
DTEND;VALUE=DATE:${depStart}
SUMMARY:Departure: Trip to ${destinationName}
DESCRIPTION:Tropikit Departure Milestone.\\nDestination: ${destinationName}\\nEnsure passports, vaccine records, and medication are packed.
STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:-P1D
ACTION:DISPLAY
DESCRIPTION:Reminder: Pack medication and travel documents for ${destinationName}
END:VALARM
END:VEVENT`);

  // 2. Return Event
  const retStart = formatDateToICS(returnDate, true);
  events.push(`BEGIN:VEVENT
UID:trip-ret-${tripId}@tropikit.com
DTSTAMP:${nowICS}
DTSTART;VALUE=DATE:${retStart}
DTEND;VALUE=DATE:${retStart}
SUMMARY:Return from ${destinationName}
DESCRIPTION:Tropikit Return Milestone.\\nComplete post-travel medication regimens and monitor for fever/symptoms.
STATUS:CONFIRMED
END:VEVENT`);

  // 3. Vaccine Consultation Window (4 weeks prior)
  const depTime = new Date(departureDate).getTime();
  const vaccineReminderDate = new Date(depTime - 28 * 24 * 60 * 60 * 1000);
  if (vaccineReminderDate.getTime() > Date.now()) {
    const vaxStart = formatDateToICS(vaccineReminderDate.toISOString(), true);
    const vaxList = vaccines.length > 0 ? vaccines.join(", ") : "Routine boosters";
    events.push(`BEGIN:VEVENT
UID:trip-vax-${tripId}@tropikit.com
DTSTAMP:${nowICS}
DTSTART;VALUE=DATE:${vaxStart}
DTEND;VALUE=DATE:${vaxStart}
SUMMARY:Travel Clinic Appointment (${destinationName})
DESCRIPTION:Recommended to consult travel doctor 4-6 weeks prior to departure.\\nImmunizations to verify: ${vaxList}.
STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:-PT9H
ACTION:DISPLAY
DESCRIPTION:Book travel clinic appointment for ${destinationName}
END:VALARM
END:VEVENT`);
  }

  // 4. Malaria Prophylaxis Dosing Timetable (Recurring Series)
  if (malariaPlan && malariaPlan.startDate && malariaPlan.endDate) {
    const mStart = formatDateToICS(malariaPlan.startDate, true);
    const mEndUtc = formatDateToICS(malariaPlan.endDate);
    const isWeekly = malariaPlan.frequency === "weekly";

    const rrule = isWeekly
      ? `RRULE:FREQ=WEEKLY;UNTIL=${mEndUtc}`
      : `RRULE:FREQ=DAILY;UNTIL=${mEndUtc}`;

    events.push(`BEGIN:VEVENT
UID:malaria-dose-${tripId}@tropikit.com
DTSTAMP:${nowICS}
DTSTART;VALUE=DATE:${mStart}
DTEND;VALUE=DATE:${mStart}
${rrule}
SUMMARY:Dose: ${malariaPlan.drugName} (${destinationName})
DESCRIPTION:Tropikit Malaria Chemoprophylaxis.\\nMedication: ${malariaPlan.drugName}\\nSchedule: ${malariaPlan.frequency}\\nTake with food/water. Do not skip doses.\\n${malariaPlan.notes || ""}
STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:-PT15M
ACTION:DISPLAY
DESCRIPTION:Time for ${malariaPlan.drugName} dose
END:VALARM
END:VEVENT`);
  }

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Tropikit Travel Health//NONSGML Trip Dossier//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:Tropikit: ${destinationName}`,
    "X-WR-TIMEZONE:UTC",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");
}

export function triggerCalendarDownload(icsContent: string, filename: string) {
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${filename.toLowerCase().replace(/\s+/g, "-")}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}