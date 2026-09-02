import { X, ShieldAlert, CheckCircle2, Info } from "lucide-react";
import type { Vaccine, VaccineStatus } from "@/types/api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  vaccines: Vaccine[];
  currentStatus: VaccineStatus;
  onUpdateStatus: (status: VaccineStatus) => void;
}

export function VaccineDetailModal({
  isOpen,
  onClose,
  vaccines,
  currentStatus,
  onUpdateStatus,
}: Props) {
  if (!isOpen) return null;

  const getStatusBadge = (status: Vaccine["status"]) => {
    switch (status) {
      case "required":
        return "bg-destructive/15 text-destructive border-destructive/30";
      case "recommended":
        return "bg-primary/15 text-primary border-primary/30";
      case "conditional":
      case "consider":
        return "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl shadow-lg w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground text-base">Vaccine Requirements & Advice</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Vaccine List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          {vaccines.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No destination-specific vaccines documented for this trip.
            </div>
          ) : (
            vaccines.map((vax, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-lg border border-border bg-background space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-foreground text-sm">{vax.name}</span>
                  <span
                    className={`uppercase font-bold text-[10px] px-2 py-0.5 rounded border ${getStatusBadge(
                      vax.status
                    )}`}
                  >
                    {vax.status}
                  </span>
                </div>
                {vax.note && <p className="text-muted-foreground leading-relaxed">{vax.note}</p>}
                {vax.regionSpecific && vax.region && (
                  <div className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                    <Info className="h-3 w-3" />
                    <span>Specific to region: {vax.region}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer Status Controls */}
        <div className="p-4 border-t border-border bg-muted/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            Current Status:{" "}
            <span className="font-semibold capitalize text-foreground">
              {currentStatus.replace("-", " ")}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                onUpdateStatus("in-progress");
                onClose();
              }}
              className="px-3 py-1.5 rounded-md border border-input text-xs font-medium hover:bg-muted transition-colors"
            >
              Mark In Progress
            </button>
            <button
              onClick={() => {
                onUpdateStatus("reviewed");
                onClose();
              }}
              className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Mark Reviewed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}