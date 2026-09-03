// frontend/src/components/MalariaPlanModal.tsx
import { useState, useEffect, type FormEvent } from "react";
import {
  X,
  Pill,
  Calendar,
  Globe,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface MalariaPlanPayload {
  medication: string;
  timezone: string;
}

export interface MalariaPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (plan: MalariaPlanPayload) => Promise<void>;
  tripDeparture?: string;
  tripReturn?: string;
  existingPlan?: {
    medication?: string;
    drugKey?: string;
    timezone?: string;
  } | null;
}

const DRUG_OPTIONS = [
  {
    key: "atovaquone-proguanil",
    name: "Atovaquone / Proguanil (Malarone)",
    frequency: "Daily",
    timing: "Start 1–2 days before travel, continue daily during trip, finish 7 days post-return.",
    daysBefore: 1,
    daysAfter: 7,
  },
  {
    key: "doxycycline",
    name: "Doxycycline",
    frequency: "Daily",
    timing: "Start 1–2 days before travel, continue daily during trip, finish 28 days post-return.",
    daysBefore: 2,
    daysAfter: 28,
  },
  {
    key: "mefloquine",
    name: "Mefloquine (Lariam)",
    frequency: "Weekly",
    timing: "Start ≥ 2 weeks before travel, continue weekly during trip, finish 4 weeks post-return.",
    daysBefore: 14,
    daysAfter: 28,
  },
  {
    key: "chloroquine",
    name: "Chloroquine",
    frequency: "Weekly",
    timing: "Start 1–2 weeks before travel, continue weekly during trip, finish 4 weeks post-return. (Only for sensitive zones).",
    daysBefore: 7,
    daysAfter: 28,
  },
];

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function MalariaPlanModal({
  isOpen,
  onClose,
  onSave,
  tripDeparture,
  tripReturn,
  existingPlan,
}: MalariaPlanModalProps) {
  const [selectedDrug, setSelectedDrug] = useState("atovaquone-proguanil");
  const [timezone, setTimezone] = useState("UTC");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existingPlan) {
      const drug = existingPlan.drugKey || existingPlan.medication || "atovaquone-proguanil";
      setSelectedDrug(drug);
      if (existingPlan.timezone) {
        setTimezone(existingPlan.timezone);
      }
    } else {
      try {
        const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (localTz) setTimezone(localTz);
      } catch {
        setTimezone("UTC");
      }
    }
  }, [existingPlan, isOpen]);

  if (!isOpen) return null;

  const activeDrugInfo = DRUG_OPTIONS.find((d) => d.key === selectedDrug) || DRUG_OPTIONS[0];

  // Regimen timeline calculation for preview
  let calculatedStart = "—";
  let calculatedEnd = "—";
  if (tripDeparture && tripReturn) {
    const dep = new Date(tripDeparture);
    const ret = new Date(tripReturn);

    const start = new Date(dep);
    start.setDate(start.getDate() - activeDrugInfo.daysBefore);
    calculatedStart = formatDate(start.toISOString());

    const finish = new Date(ret);
    finish.setDate(finish.getDate() + activeDrugInfo.daysAfter);
    calculatedEnd = formatDate(finish.toISOString());
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      await onSave({
        medication: selectedDrug,
        timezone: timezone.trim() || "UTC",
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to save malaria plan.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <Pill className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                Configure Malaria Prevention Plan
              </h2>
              <p className="text-xs text-muted-foreground">
                Select your chemoprophylaxis regimen and target reminder timezone.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Medication Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Select Prescription Medication
            </Label>
            <div className="grid gap-2">
              {DRUG_OPTIONS.map((opt) => {
                const isSelected = selectedDrug === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setSelectedDrug(opt.key)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary/30"
                        : "border-border bg-background hover:bg-muted/60 text-muted-foreground"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold ${
                            isSelected ? "text-primary" : "text-foreground"
                          }`}
                        >
                          {opt.name}
                        </span>
                        <span className="text-[10px] uppercase font-semibold px-2 py-0.2 rounded-md bg-muted">
                          {opt.frequency}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-muted-foreground">
                        {opt.timing}
                      </p>
                    </div>

                    <div className="pt-0.5 shrink-0">
                      <div
                        className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/40"
                        }`}
                      >
                        {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timezone Input */}
          <div className="space-y-1.5">
            <Label
              htmlFor="reminder-tz"
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1"
            >
              <Globe className="h-3.5 w-3.5 text-primary" />
              Reminder & Schedule Timezone
            </Label>
            <Input
              id="reminder-tz"
              type="text"
              required
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="e.g. America/New_York or Asia/Phnom_Penh"
              className="rounded-xl border-border bg-background text-xs sm:text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              Used to calculate calendar notification times across border crossings.
            </p>
          </div>

          {/* Schedule Summary Preview */}
          {tripDeparture && tripReturn && (
            <div className="p-3 rounded-xl border border-border bg-muted/30 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <span>Dosing Schedule Preview</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-background border border-border/60">
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                    Start Dosing
                  </span>
                  <span className="font-semibold text-foreground">{calculatedStart}</span>
                  <span className="block text-[10px] text-muted-foreground">
                    ({activeDrugInfo.daysBefore} day{activeDrugInfo.daysBefore > 1 ? "s" : ""} prior)
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-background border border-border/60">
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">
                    Final Terminal Dose
                  </span>
                  <span className="font-bold text-emerald-600">{calculatedEnd}</span>
                  <span className="block text-[10px] text-muted-foreground">
                    ({activeDrugInfo.daysAfter} days post-travel)
                  </span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl border border-destructive/30 bg-destructive/5 flex items-center gap-2 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Clinical Advisory Notice */}
          <div className="p-2.5 rounded-lg border border-border bg-muted/20 text-[11px] text-muted-foreground leading-relaxed flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span>
              Antimalarial tablets require consultation with a licensed physician or travel-health
              clinic to match your medical history and local drug resistance.
            </span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-xl px-4 text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="rounded-xl px-4 text-xs font-semibold cursor-pointer shadow-xs"
            >
              {isSaving ? "Saving..." : "Save Regimen"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}