import { Bug, Utensils, Sun, Pill, LifeBuoy, PlaneTakeoff } from "lucide-react";
import type { DuringTripSection } from "@/types/api";

const ICONS: Record<string, React.ReactNode> = {
  mosquito: <Bug className="h-4 w-4 text-accent" />,
  "food-water": <Utensils className="h-4 w-4 text-primary" />,
  environment: <Sun className="h-4 w-4 text-warning-foreground" />,
  medication: <Pill className="h-4 w-4 text-destructive" />,
};

export function DuringTripCard({ section }: { section: DuringTripSection }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center gap-2 mb-1">
        <PlaneTakeoff className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">During Your Trip</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Practical reminders for while you're there — not a diagnostic tool.
      </p>

      {section.reminders.length === 0 ? (
        <p className="text-sm text-muted-foreground mb-4">
          No specific reminders available yet for this destination — see the destination's
          Advice tab for general guidance.
        </p>
      ) : (
        <ul className="space-y-3 mb-4">
          {section.reminders.map((r) => (
            <li key={r.key} className="flex items-start gap-3">
              <span className="mt-0.5">{ICONS[r.key] ?? <Bug className="h-4 w-4 text-muted-foreground" />}</span>
              <div>
                <div className="text-sm font-medium text-foreground">{r.label}</div>
                <p className="text-sm text-muted-foreground">{r.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-md border border-warning/40 bg-warning/10 p-3 flex items-start gap-2">
        <LifeBuoy className="h-4 w-4 text-warning-foreground flex-shrink-0 mt-0.5" />
        <div>
          <div className="text-xs font-semibold text-foreground mb-0.5">When to seek help</div>
          <p className="text-xs text-muted-foreground">{section.whenToSeekHelp}</p>
        </div>
      </div>
    </div>
  );
}
