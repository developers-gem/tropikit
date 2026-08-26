import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, CalendarPlus, CalendarDays, BellRing, AlertTriangle } from "lucide-react";
import { calculateMalariaPlan } from "@/api/destinationApi";
import type { Destination, DrugKey, DrugRegimen } from "@/types/api";
import {
  buildIcs,
  downloadIcs,
  buildGoogleCalendarUrl,
  gcalDate,
  gcalDateTime,
  openGoogleCalendarEvents,
  formatInTz,
  COMMON_TIMEZONES,
  scheduleBrowserReminder,
} from "@/utils/calendar";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function MalariaScheduler({
  destination,
  drugRegimens,
}: {
  destination: Destination;
  drugRegimens: DrugRegimen[];
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const addDays = (d: Date, n: number) => {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
  };
  const defaultStart = addDays(today, 30).toISOString().slice(0, 10);
  const defaultEnd = addDays(today, 44).toISOString().slice(0, 10);

  const [startStr, setStartStr] = useState(defaultStart);
  const [endStr, setEndStr] = useState(defaultEnd);
  const [drug, setDrug] = useState<DrugKey>("atovaquone-proguanil");
  const [reminderStatus, setReminderStatus] = useState<string | null>(null);
  const [tz, setTz] = useState<string>(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return "UTC";
    }
  });

  const { data: plan, isLoading, isError } = useQuery({
    queryKey: ["malaria-plan", drug, startStr, endStr],
    queryFn: () =>
      calculateMalariaPlan({
        drug,
        tripStart: startStr,
        tripEnd: endStr,
      }),
    enabled: !!startStr && !!endStr,
  });

  if (isLoading) return <div className="text-sm text-muted-foreground py-6">Calculating plan...</div>;
  if (isError || !plan)
    return (
      <div className="text-sm text-destructive py-6">
        Couldn't calculate a plan for these dates. Check your trip dates and try again.
      </div>
    );

  const beginMeds = new Date(plan.beginMeds);
  const stopMeds = new Date(plan.stopMeds);
  const tripStart = new Date(plan.tripStart);
  const tripEnd = new Date(plan.tripEnd);

  function handleDownloadIcs() {
    const ics = buildIcs({
      destination: destination.name,
      drugLabel: plan!.drug.label,
      frequency: plan!.drug.frequency,
      beginMeds,
      stopMeds,
      tripStart,
      tripEnd,
      isWeekly: plan!.drug.isWeekly,
    });
    downloadIcs(`tropikit-${destination.slug}-malaria-plan.ics`, ics);
  }

  function handleGoogleCalendar() {
    const doseEvent = buildGoogleCalendarUrl({
      title: `Antimalarial dose — ${plan!.drug.label}`,
      details: `${plan!.drug.frequency}. Trip to ${destination.name}.`,
      dates: `${gcalDateTime(beginMeds, 8)}/${gcalDateTime(beginMeds, 8, 15)}`,
      recur: `FREQ=${plan!.drug.isWeekly ? "WEEKLY" : "DAILY"};UNTIL=${gcalDate(stopMeds)}`,
      ctz: tz,
    });
    const biteEvent = buildGoogleCalendarUrl({
      title: `Bite prevention — ${destination.name}`,
      details: "Apply DEET at dusk, cover arms/legs, use a treated net tonight.",
      dates: `${gcalDateTime(tripStart, 18)}/${gcalDateTime(tripStart, 22)}`,
      recur: `FREQ=DAILY;UNTIL=${gcalDate(tripEnd)}`,
      ctz: tz,
    });
    openGoogleCalendarEvents([{ url: doseEvent }, { url: biteEvent }]);
  }

  async function handleBrowserReminder(kind: "start" | "bite") {
    setReminderStatus(null);
    const when = kind === "start" ? beginMeds : tripStart;
    const ok = await scheduleBrowserReminder(
      kind === "start" ? "Start your antimalarial today" : "Nightly bite-prevention reminder",
      kind === "start"
        ? `Time to start ${plan!.drug.label} for your trip to ${destination.name}.`
        : `Apply repellent and check your net for tonight in ${destination.name}.`,
      when,
    );
    setReminderStatus(
      ok
        ? "Reminder set — this only works if this tab stays open. For a reliable reminder, use the calendar download instead."
        : "Notifications aren't available or weren't allowed. Use the calendar download instead.",
    );
  }

  return (
    <div className="mt-6 space-y-5">
      <div className="rounded-lg border border-border p-6 bg-card">
        <div className="flex items-center gap-3 mb-4">
          <CalendarDays className="h-6 w-6 text-primary" />
          <h4 className="font-semibold text-foreground">Personalised prophylaxis reminders</h4>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Enter your trip dates and preferred antimalarial — we'll calculate when to start, when
          to stop and how many doses to pack.
        </p>

        <div className="rounded-md border border-accent/40 bg-accent/10 p-3 mb-5 flex items-center justify-between flex-wrap gap-2">
          <p className="text-xs text-foreground">
            This is a quick preview. Create a trip to save your plan, get it on your dashboard,
            and turn on calendar reminders.
          </p>
          <Link
            to={`/trip/create?destination=${destination.slug}`}
            className="text-xs font-semibold text-accent hover:underline whitespace-nowrap flex-shrink-0"
          >
            Create a trip for {destination.name} →
          </Link>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-5">
          <div>
            <label htmlFor="malaria-trip-start" className="text-xs font-medium text-muted-foreground">
              Trip start
            </label>
            <input
              id="malaria-trip-start"
              type="date"
              value={startStr}
              onChange={(e) => setStartStr(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="malaria-trip-end" className="text-xs font-medium text-muted-foreground">
              Trip end
            </label>
            <input
              id="malaria-trip-end"
              type="date"
              value={endStr}
              onChange={(e) => setEndStr(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="malaria-drug" className="text-xs font-medium text-muted-foreground">
              Antimalarial
            </label>
            <select
              id="malaria-drug"
              value={drug}
              onChange={(e) => setDrug(e.target.value as DrugKey)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {drugRegimens.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <div className="rounded-lg border border-border bg-muted/40 p-4">
            <div className="text-xs font-medium text-accent mb-1">Start taking tablets</div>
            <div className="text-lg font-semibold text-foreground">{fmtDate(plan.beginMeds)}</div>
          </div>
          <div className="rounded-lg border border-border bg-muted/40 p-4">
            <div className="text-xs font-medium text-primary mb-1">Depart</div>
            <div className="text-lg font-semibold text-foreground">{fmtDate(plan.tripStart)}</div>
          </div>
          <div className="rounded-lg border border-border bg-muted/40 p-4">
            <div className="text-xs font-medium text-primary mb-1">Return home</div>
            <div className="text-lg font-semibold text-foreground">{fmtDate(plan.tripEnd)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Keep taking tablets — malaria can incubate for weeks.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/40 p-4">
            <div className="text-xs font-medium text-destructive mb-1">Last dose</div>
            <div className="text-lg font-semibold text-foreground">{fmtDate(plan.stopMeds)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {plan.totalDoseDays} total dose-days
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/40 p-4 mb-4 text-sm">
          <span className="font-semibold text-foreground">Regimen:</span> {plan.drug.frequency}
          <p className="text-muted-foreground mt-1">{plan.drug.notes}</p>
        </div>

        {plan.startDateInPast && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 mb-4 text-sm text-destructive-foreground flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>
              This drug's recommended start date has already passed for a trip this close.
              Talk to a travel-health clinician promptly — they may recommend a different
              antimalarial with a shorter lead time.
            </span>
          </div>
        )}

        <div className="rounded-lg border border-warning/40 bg-warning/10 p-4 mb-4 text-sm">
          <span className="font-semibold text-foreground">Nightly bite-prevention reminder:</span>{" "}
          from {fmtDate(plan.tripStart)} to {fmtDate(plan.tripEnd)} — apply DEET at dusk, cover
          arms and legs, and sleep under a permethrin-treated net every night of your trip.
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CalendarClock className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">Schedule these reminders</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Add to your calendar for recurring alerts on every device, or set a one-off browser
            reminder for the day you start your tablets.
          </p>

          <label htmlFor="malaria-timezone" className="text-xs font-medium text-muted-foreground">
            Timezone for Google Calendar
          </label>
          <select
            id="malaria-timezone"
            value={tz}
            onChange={(e) => setTz(e.target.value)}
            className="mt-1 mb-3 w-full sm:w-64 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {COMMON_TIMEZONES.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>

          <div className="mb-3 rounded-lg border border-border bg-background p-3 text-xs">
            <div className="font-semibold text-foreground mb-2">
              Google Calendar event preview · {tz}
            </div>
            <ul className="space-y-1.5">
              <li className="flex justify-between gap-3">
                <span className="text-foreground">First antimalarial dose ({plan.drug.label})</span>
                <span className="text-muted-foreground">{formatInTz(beginMeds, tz, 8, 0)}</span>
              </li>
              <li className="flex justify-between gap-3">
                <span className="text-foreground">First bite-prevention window</span>
                <span className="text-muted-foreground">{formatInTz(tripStart, tz, 18, 0)}</span>
              </li>
              <li className="flex justify-between gap-3">
                <span className="text-foreground">Final antimalarial dose</span>
                <span className="text-muted-foreground">{formatInTz(stopMeds, tz, 8, 0)}</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleDownloadIcs}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              <CalendarPlus className="h-3.5 w-3.5" /> Add to calendar (.ics)
            </button>
            <button
              onClick={handleGoogleCalendar}
              className="inline-flex items-center gap-2 rounded-md border border-input px-3 py-2 text-xs font-medium hover:bg-muted"
            >
              <CalendarDays className="h-3.5 w-3.5" /> Add to Google Calendar
            </button>
            <button
              onClick={() => handleBrowserReminder("start")}
              className="inline-flex items-center gap-2 rounded-md border border-input px-3 py-2 text-xs font-medium hover:bg-muted"
            >
              <BellRing className="h-3.5 w-3.5" /> Notify me on start day
            </button>
            <button
              onClick={() => handleBrowserReminder("bite")}
              className="inline-flex items-center gap-2 rounded-md border border-input px-3 py-2 text-xs font-medium hover:bg-muted"
            >
              <BellRing className="h-3.5 w-3.5" /> Nightly bite window
            </button>
          </div>
          {reminderStatus && (
            <p className="mt-2 text-xs text-muted-foreground flex items-start gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              {reminderStatus}
            </p>
          )}
        </div>

        <p className="mt-4 text-xs text-muted-foreground">{plan.disclaimer}</p>
      </div>
    </div>
  );
}
