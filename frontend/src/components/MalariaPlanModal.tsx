// frontend/src/components/MalariaPlanModal.tsx
import { useState, useMemo } from "react";
import {
  ShieldAlert,
  Clock,
  Calendar,
  Pill,
  Bell,
  X,
  Info,
  Check,
} from "lucide-react";
import { MalariaPlanPayload } from "@/api/tripApi";

interface MalariaPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (plan: MalariaPlanPayload) => Promise<void>;
  tripDeparture: string;
  tripReturn: string;
  existingPlan?: any;
}

interface RegimenConfig {
  name: string;
  brand: string;
  daysBefore: number;
  daysAfter: number;
  frequency: "daily" | "weekly";
  guidance: string;
}

const REGIMENS: Record<string, RegimenConfig> = {
  "atovaquone-proguanil": {
    name: "Atovaquone-Proguanil",
    brand: "Malarone",
    daysBefore: 1, // 1-2 days before
    daysAfter: 7, // 7 days after leaving endemic zone
    frequency: "daily",
    guidance: "Take daily with food or milk at the same time every day.",
  },
  doxycycline: {
    name: "Doxycycline",
    brand: "Vibramycin",
    daysBefore: 2, // 1-2 days before
    daysAfter: 28, // 4 weeks after travel
    frequency: "daily",
    guidance: "Take daily with a full glass of water. Avoid lying down for 30 minutes. Use sun protection.",
  },
  mefloquine: {
    name: "Mefloquine",
    brand: "Lariam",
    daysBefore: 14, // 2-3 weeks before
    daysAfter: 28, // 4 weeks after travel
    frequency: "weekly",
    guidance: "Take once weekly on the same day each week, starting 2 weeks before travel.",
  },
  chloroquine: {
    name: "Chloroquine",
    brand: "Aralen",
    daysBefore: 7, // 1-2 weeks before
    daysAfter: 28, // 4 weeks after travel
    frequency: "weekly",
    guidance: "Only suitable for regions with chloroquine-sensitive P. vivax/malariae strains.",
  },
};

export function MalariaPlanModal({
  isOpen,
  onClose,
  onSave,
  tripDeparture,
  tripReturn,
  existingPlan,
}: MalariaPlanModalProps) {
  const [selectedMed, setSelectedMed] = useState<string>(
    existingPlan?.medicationKey || "atovaquone-proguanil"
  );
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(
    existingPlan?.reminderEnabled ?? true
  );
  const [reminderTime, setReminderTime] = useState<string>(
    existingPlan?.reminderTime || "08:00"
  );
  const [calendarSynced, setCalendarSynced] = useState<boolean>(
    existingPlan?.calendarSynced ?? true
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute clinical timeline dates
  const calculated = useMemo(() => {
    const regimen = REGIMENS[selectedMed] || REGIMENS["atovaquone-proguanil"];
    const dep = new Date(tripDeparture);
    const ret = new Date(tripReturn);

    // Start date = departure - daysBefore
    const start = new Date(dep);
    start.setDate(start.getDate() - regimen.daysBefore);

    // Final dose = return + daysAfter
    const end = new Date(ret);
    end.setDate(end.getDate() + regimen.daysAfter);

    // Total span in calendar days
    const totalDays = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

    // Total dose count
    const totalDoses =
      regimen.frequency === "weekly"
        ? Math.ceil(totalDays / 7)
        : totalDays;

    return {
      regimen,
      startDate: start.toISOString().split("T")[0],
      finalDoseDate: end.toISOString().split("T")[0],
      totalDoseDays: totalDoses,
    };
  }, [selectedMed, tripDeparture, tripReturn]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await onSave({
        medication: `${calculated.regimen.name} (${calculated.regimen.brand})`,
        startDate: calculated.startDate,
        departureDate: tripDeparture,
        returnDate: tripReturn,
        finalDoseDate: calculated.finalDoseDate,
        totalDoseDays: calculated.totalDoseDays,
        reminderEnabled,
        reminderTime,
        calendarSynced,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      onClose();
    } catch (err: any) {
      alert(err.message || "Failed to save malaria plan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <Pill className="h-6 w-6 text-primary" />
            <div>
              <h3 className="text-lg font-bold text-foreground">
                {existingPlan ? "Update Antimalarial Regimen" : "Configure Antimalarial Regimen"}
              </h3>
              <p className="text-xs text-muted-foreground">
                Personalized prophylaxis schedule synced with trip dates.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground cursor-pointer rounded-lg p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Medical Advisory Notice */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5 flex gap-3 text-xs text-amber-900 dark:text-amber-200">
          <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Medical Disclaimer:</strong> This schedule is for planning and reminder
            purposes only. Medication choices depend on drug resistance profiles, personal
            contraindications, and medical history. Always consult a qualified travel clinic
            or physician before taking prescription antimalarials.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Select Medication */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
              Select Prescribed Medication
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {Object.entries(REGIMENS).map(([key, reg]) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => setSelectedMed(key)}
                  className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${
                    selectedMed === key
                      ? "border-primary bg-primary/10 text-primary shadow-xs"
                      : "border-border bg-background hover:border-border/80 text-foreground"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold">{reg.name}</p>
                    {selectedMed === key && <Check className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {reg.brand} • {reg.frequency}
                  </p>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 italic flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 shrink-0 text-primary" />
              {calculated.regimen.guidance}
            </p>
          </div>

          {/* Schedule Summary Card */}
          <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Calculated Schedule
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground block text-[10px]">Start Date</span>
                <span className="font-semibold text-foreground">
                  {new Date(calculated.startDate).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  ({calculated.regimen.daysBefore}d pre-trip)
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Departure</span>
                <span className="font-semibold text-foreground">
                  {new Date(tripDeparture).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Return</span>
                <span className="font-semibold text-foreground">
                  {new Date(tripReturn).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Final Dose</span>
                <span className="font-semibold text-emerald-600">
                  {new Date(calculated.finalDoseDate).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  (+{calculated.regimen.daysAfter}d post-trip)
                </span>
              </div>
            </div>

            <div className="border-t border-border/80 pt-2 flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Total Doses Required:</span>
              <span className="font-bold text-primary text-sm">
                {calculated.totalDoseDays} {calculated.regimen.frequency === "weekly" ? "weekly doses" : "daily tablets"}
              </span>
            </div>
          </div>

          {/* Notifications & Calendar Integration */}
          <div className="space-y-3 border-t border-border pt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs font-semibold text-foreground">Dose Reminder Notification</p>
                  <p className="text-[11px] text-muted-foreground">Daily notification during regimen</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
              />
            </div>

            {reminderEnabled && (
              <div className="flex items-center justify-between pl-6">
                <span className="text-xs text-muted-foreground">Reminder Time:</span>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:border-primary"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs font-semibold text-foreground">Include in .ICS Calendar Export</p>
                  <p className="text-[11px] text-muted-foreground">Syncs regimen alerts directly to phone/Google Calendar</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={calendarSynced}
                onChange={(e) => setCalendarSynced(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-border text-foreground hover:bg-muted cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
            >
              {isSubmitting ? "Saving Plan..." : existingPlan ? "Update Plan" : "Save to Trip Hub"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}