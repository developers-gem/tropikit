import type { ReadinessResult } from "@/types/api";

export function ReadinessCard({ readiness }: { readiness: ReadinessResult }) {
  const { completed, total, percentage } = readiness;
  const remaining = total - completed;

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="text-sm font-medium text-muted-foreground">Readiness Score</div>
          <div className="mt-1 text-4xl font-semibold text-primary">
            {percentage}% <span className="text-lg font-normal text-muted-foreground">Ready</span>
          </div>
        </div>
        <div className="text-sm text-right text-muted-foreground">
          <div>
            <span className="font-medium text-foreground">{completed}</span> completed
          </div>
          <div>
            <span className="font-medium text-foreground">{remaining}</span> remaining
          </div>
          <div className="text-xs mt-1">out of {total} preparation tasks</div>
        </div>
      </div>
      <div className="mt-4 h-2.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Trip readiness"
        />
      </div>
    </div>
  );
}
