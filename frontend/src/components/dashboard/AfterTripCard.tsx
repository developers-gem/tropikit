import { Stethoscope, Home } from "lucide-react";
import type { AfterTripSection } from "@/types/api";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function AfterTripCard({ section }: { section: AfterTripSection }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center gap-2 mb-1">
        <Home className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">After Your Trip</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        General, source-backed information — not a diagnosis. If you feel unwell, talk to a
        healthcare provider.
      </p>

      <div className="space-y-4">
        {section.topics.map((topic) => (
          <div key={topic.key} className="rounded-md border border-border bg-muted/30 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Stethoscope className="h-4 w-4 text-accent flex-shrink-0" />
              <h4 className="text-sm font-semibold text-foreground">{topic.title}</h4>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{topic.content}</p>
            <div className="text-[11px] text-muted-foreground">
              {topic.sources.map((s, i) => (
                <span key={s.url}>
                  {i > 0 && ", "}
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {s.title}
                  </a>
                  {s.lastReviewedAt && <> (reviewed {fmtDate(s.lastReviewedAt)})</>}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
