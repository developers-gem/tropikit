import { useState } from "react";
import { Bug, AlertTriangle, Download, Trash2 } from "lucide-react";
import type { DrugRegimen, PersistedMalariaPlan, MalariaPlanStatus } from "@/types/api";
import { SUPPORTED_TIMEZONES } from "@/utils/timezones";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function browserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

export function TripMalariaCard({
  malariaPlan,
  malariaPlanStatus,
  drugRegimens,
  onSavePlan,
  onConfirmPlan,
  onDeletePlan,
  onDownloadCalendar,
}: {
  malariaPlan: PersistedMalariaPlan | null;
  malariaPlanStatus: MalariaPlanStatus;
  drugRegimens: DrugRegimen[];
  onSavePlan: (drug: string, timezone: string) => Promise<void>;
  onConfirmPlan: () => Promise<void>;
  onDeletePlan: () => Promise<void>;
  onDownloadCalendar: () => void;
}) {
  const [editing, setEditing] = useState(!malariaPlan);
  const [drug, setDrug] = useState<string>(malariaPlan?.drug.key || drugRegimens[0]?.key || "");
  const [timezone, setTimezone] = useState(malariaPlan?.timezone || browserTimezone());
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSavePlan(drug, timezone);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirm() {
    setSaving(true);
    try {
      await onConfirmPlan();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this malaria plan? Its reminders will also be removed.")) return;
    setSaving(true);
    try {
      await onDeletePlan();
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="rounded-lg border border-border bg-card p-5 shadow-soft">
        <div className="flex items-center gap-2 mb-3">
          <Bug className="h-5 w-5 text-accent" />
          <h3 className="font-semibold text-foreground">
            {malariaPlan ? "Edit malaria plan" : "Create malaria plan"}
          </h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Dates are calculated from this trip's departure and return dates. This plan is saved
          to your account and reloads exactly as you left it.
        </p>

        <label className="text-xs font-medium text-muted-foreground" htmlFor="trip-malaria-drug">
          Antimalarial
        </label>
        <select
          id="trip-malaria-drug"
          value={drug}
          onChange={(e) => setDrug(e.target.value)}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mb-4"
        >
          {drugRegimens.map((r) => (
            <option key={r.key} value={r.key}>
              {r.label}
            </option>
          ))}
        </select>

        <label className="text-xs font-medium text-muted-foreground" htmlFor="trip-malaria-tz">
          Timezone (for reminder scheduling)
        </label>
        <select
          id="trip-malaria-tz"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mb-4"
        >
          {!SUPPORTED_TIMEZONES.includes(timezone as (typeof SUPPORTED_TIMEZONES)[number]) && (
            <option value={timezone}>{timezone} (detected)</option>
          )}
          {SUPPORTED_TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>

        <div className="flex flex-wrap gap-2">
          <button
            disabled={saving}
            onClick={handleSave}
            className="rounded-md bg-primary text-primary-foreground px-3 py-2 text-xs font-medium hover:bg-primary/90 disabled:opacity-60"
          >
            {malariaPlan ? "Save changes" : "Save plan"}
          </button>
          {malariaPlan && (
            <button
              disabled={saving}
              onClick={() => setEditing(false)}
              className="rounded-md px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!malariaPlan) {
    return (
      <div className="rounded-lg border border-border bg-card p-5 shadow-soft text-center">
        <Bug className="h-6 w-6 text-accent mx-auto mb-2" />
        <p className="text-sm text-muted-foreground mb-3">No malaria plan yet for this trip.</p>
        <button
          onClick={() => setEditing(true)}
          className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90"
        >
          Create malaria plan
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Bug className="h-5 w-5 text-accent" />
          <h3 className="font-semibold text-foreground">{malariaPlan.drug.label}</h3>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              malariaPlanStatus === "confirmed"
                ? "bg-success/20 text-success"
                : "bg-warning/20 text-warning-foreground"
            }`}
          >
            {malariaPlanStatus === "confirmed" ? "Confirmed" : "Planned"}
          </span>
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          {malariaPlanStatus !== "confirmed" && (
            <button disabled={saving} onClick={handleConfirm} className="font-medium text-primary hover:underline disabled:opacity-60">
              Mark confirmed with clinician
            </button>
          )}
          <button onClick={() => setEditing(true)} className="font-medium text-primary hover:underline">
            Edit malaria plan
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-3 text-sm">
        <div>
          <span className="text-muted-foreground">Start taking tablets:</span>{" "}
          <span className="font-medium text-foreground">{fmtDate(malariaPlan.beginMeds)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Depart:</span>{" "}
          <span className="font-medium text-foreground">{fmtDate(malariaPlan.tripStart)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Return:</span>{" "}
          <span className="font-medium text-foreground">{fmtDate(malariaPlan.tripEnd)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Final dose:</span>{" "}
          <span className="font-medium text-foreground">{fmtDate(malariaPlan.stopMeds)}</span>{" "}
          <span className="text-xs text-muted-foreground">
            ({malariaPlan.totalDoseDays} total dose-days)
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Timezone:</span>{" "}
          <span className="font-medium text-foreground">{malariaPlan.timezone}</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-2">
        <span className="font-medium text-foreground">Regimen:</span> {malariaPlan.drug.frequency}
        {" — "}
        {malariaPlan.drug.notes}
      </p>

      {malariaPlan.startDateInPast && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive-foreground flex items-start gap-2 mb-2">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
          This drug's recommended start date has already passed for how close this trip is —
          talk to a travel-health clinician promptly.
        </div>
      )}

      <p className="text-xs text-muted-foreground italic mb-3">{malariaPlan.disclaimer}</p>

      {malariaPlan.sources.length > 0 && (
        <div className="text-xs text-muted-foreground mb-3">
          <span className="font-medium text-foreground">Source: </span>
          {malariaPlan.sources.map((s, i) => (
            <span key={s.url}>
              {i > 0 && ", "}
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                {s.title}
              </a>
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3 text-xs pt-2 border-t border-border">
        <button
          onClick={onDownloadCalendar}
          className="flex items-center gap-1.5 font-medium text-primary hover:underline"
        >
          <Download className="h-3.5 w-3.5" /> Download trip calendar (.ics)
        </button>
        <button
          disabled={saving}
          onClick={handleDelete}
          className="flex items-center gap-1.5 font-medium text-destructive hover:underline disabled:opacity-60"
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete plan
        </button>
      </div>
    </div>
  );
}
