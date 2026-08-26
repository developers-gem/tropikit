import type { Source } from "@/types/api";

export function Citations({ items }: { items: Source[] }) {
  if (!items.length) return null;
  return (
    <div className="mt-5 rounded-lg border border-border/70 bg-background p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        Sources
      </div>
      <ul className="space-y-1.5 text-sm">
        {items.map((s) => (
          <li key={s.url} className="leading-snug">
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline-offset-2 hover:underline font-medium"
            >
              {s.title}
            </a>
            <span className="text-muted-foreground"> — {s.publisher}</span>
            {s.needsReview && (
              <span className="ml-2 rounded bg-warning/20 px-1.5 py-0.5 text-[10px] font-medium text-warning-foreground align-middle">
                unverified link — pending review
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
