import { Syringe, Bug, ClipboardList, Siren, CheckCircle2 } from "lucide-react";
import type { VaccineStatus, MalariaPlanStatus } from "@/types/api";

const STATUS_STYLES: Record<string, string> = {
  "not-reviewed": "bg-muted text-muted-foreground",
  "not-planned": "bg-muted text-muted-foreground",
  "in-progress": "bg-warning/20 text-warning-foreground",
  planned: "bg-warning/20 text-warning-foreground",
  reviewed: "bg-success/20 text-success",
  confirmed: "bg-success/20 text-success",
};

function StatusPill({ status, label }: { status: string; label: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
        STATUS_STYLES[status] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {label}
    </span>
  );
}

function PrepCard({
  icon,
  title,
  statusLabel,
  status,
  detail,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  statusLabel: string;
  status: string;
  detail?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className="text-left rounded-lg border border-border bg-card p-4 shadow-soft hover:border-primary/40 transition-colors disabled:hover:border-border w-full"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-foreground font-medium">
          {icon}
          {title}
        </div>
      </div>
      <div className="mt-3">
        <StatusPill status={status} label={statusLabel} />
      </div>
      {detail && <p className="mt-2 text-xs text-muted-foreground">{detail}</p>}
    </button>
  );
}

const VACCINE_LABELS: Record<VaccineStatus, string> = {
  "not-reviewed": "Not reviewed",
  "in-progress": "In progress",
  reviewed: "Reviewed",
};

const MALARIA_LABELS: Record<MalariaPlanStatus, string> = {
  "not-planned": "Not planned",
  planned: "Planned",
  confirmed: "Confirmed",
};

export function HealthPreparationCards({
  vaccineStatus,
  malariaApplicable,
  malariaPlanStatus,
  checklistCompleted,
  checklistTotal,
  emergencyAcknowledged,
  onOpenVaccines,
  onOpenMalaria,
  onOpenChecklist,
  onOpenEmergency,
}: {
  vaccineStatus: VaccineStatus;
  malariaApplicable: boolean;
  malariaPlanStatus: MalariaPlanStatus;
  checklistCompleted: number;
  checklistTotal: number;
  emergencyAcknowledged: boolean;
  onOpenVaccines: () => void;
  onOpenMalaria: () => void;
  onOpenChecklist: () => void;
  onOpenEmergency: () => void;
}) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <PrepCard
        icon={<Syringe className="h-4 w-4 text-primary" />}
        title="Vaccines"
        status={vaccineStatus}
        statusLabel={VACCINE_LABELS[vaccineStatus]}
        onClick={onOpenVaccines}
      />
      {malariaApplicable ? (
        <PrepCard
          icon={<Bug className="h-4 w-4 text-accent" />}
          title="Malaria"
          status={malariaPlanStatus}
          statusLabel={MALARIA_LABELS[malariaPlanStatus]}
          onClick={onOpenMalaria}
        />
      ) : (
        <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground flex items-center gap-2">
          <Bug className="h-4 w-4" /> No malaria risk for this destination
        </div>
      )}
      <PrepCard
        icon={<ClipboardList className="h-4 w-4 text-primary" />}
        title="Medical Kit"
        status={checklistCompleted === checklistTotal ? "reviewed" : "in-progress"}
        statusLabel={`${checklistCompleted}/${checklistTotal} items`}
        onClick={onOpenChecklist}
      />
      <PrepCard
        icon={
          emergencyAcknowledged ? (
            <CheckCircle2 className="h-4 w-4 text-success" />
          ) : (
            <Siren className="h-4 w-4 text-destructive" />
          )
        }
        title="Emergency Prep"
        status={emergencyAcknowledged ? "reviewed" : "not-reviewed"}
        statusLabel={emergencyAcknowledged ? "Reviewed" : "Not reviewed"}
        onClick={onOpenEmergency}
      />
    </div>
  );
}
