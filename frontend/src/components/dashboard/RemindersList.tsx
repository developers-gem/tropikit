import { Bell, Pill, ListChecks, PlaneTakeoff, Clock3, Stethoscope, Bug } from "lucide-react";
import type { ReminderItem } from "@/types/api";

const ICONS: Record<ReminderItem["type"], React.ReactNode> = {
  timeline: <Clock3 className="h-4 w-4 text-primary" />,
  medication: <Pill className="h-4 w-4 text-accent" />,
  "final-dose": <Pill className="h-4 w-4 text-destructive" />,
  checklist: <ListChecks className="h-4 w-4 text-primary" />,
  consultation: <Stethoscope className="h-4 w-4 text-primary" />,
  "travel-preparation": <PlaneTakeoff className="h-4 w-4 text-primary" />,
  "bite-prevention": <Bug className="h-4 w-4 text-accent" />,
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function RemindersList({ reminders }: { reminders: ReminderItem[] }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Upcoming reminders</h3>
      </div>
      {reminders.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing upcoming right now.</p>
      ) : (
        <ul className="space-y-3">
          {reminders.map((r, i) => (
            <li key={`${r.type}-${i}`} className="flex items-center gap-3">
              {ICONS[r.type]}
              <span className="text-sm text-foreground flex-1">{r.label}</span>
              {r.date && <span className="text-xs text-muted-foreground">{fmtDate(r.date)}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
