import { CheckCircle2, Circle, Clock } from "lucide-react";
import type { TimelineMilestone } from "@/types/api";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function timeLabel(weeksBefore: number) {
  if (weeksBefore === 0) return "Departure day";
  return `${weeksBefore} week${weeksBefore === 1 ? "" : "s"} before`;
}

export function PreparationTimeline({ timeline }: { timeline: TimelineMilestone[] }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-soft">
      <h3 className="font-semibold text-foreground mb-1">Your Preparation Timeline</h3>
      <p className="text-xs text-muted-foreground mb-4">
        A general framework — see the destination's Advice, Vaccines, and Malaria tabs for the
        actual source-backed guidance behind each step.
      </p>
      <ol className="space-y-3">
        {timeline.map((m) => (
          <li key={m.weeksBefore} className="flex items-start gap-3">
            {m.status === "passed" ? (
              <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
            ) : m.status === "today" ? (
              <Clock className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <div
                className={`text-sm font-medium ${
                  m.status === "passed" ? "text-muted-foreground line-through" : "text-foreground"
                }`}
              >
                {timeLabel(m.weeksBefore)} → {m.label}
              </div>
              <div className="text-xs text-muted-foreground">{fmtDate(m.date)}</div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
