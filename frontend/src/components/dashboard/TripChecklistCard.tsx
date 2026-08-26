import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Circle, ListChecks, Printer, Download, ExternalLink } from "lucide-react";
import type { ChecklistGroup } from "@/types/api";
import { stillToDo, buildChecklistText, downloadChecklistText } from "@/utils/checklist";

export function TripChecklistCard({
  tripId,
  template,
  checkedItemKeys,
  completed,
  total,
  saving,
  onToggleItem,
  onCompleteAll,
  onReset,
}: {
  tripId: string;
  template: ChecklistGroup[];
  checkedItemKeys: string[];
  completed: number;
  total: number;
  saving: boolean;
  onToggleItem: (key: string) => void;
  onCompleteAll: () => void;
  onReset: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const checkedSet = new Set(checkedItemKeys);
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  const todo = stillToDo(template, checkedItemKeys, 3);

  function handlePrint() {
    window.print();
  }

  function handleDownload() {
    const text = buildChecklistText({ title: "Travel Health Checklist", template, checkedKeys: checkedItemKeys });
    downloadChecklistText("tropikit-trip-checklist.txt", text);
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-soft print-area">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
        <div className="flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">
            {completed} / {total} complete
          </h3>
        </div>
        <div className="flex flex-wrap gap-2 text-xs no-print">
          <button
            disabled={saving}
            onClick={onCompleteAll}
            className="rounded-md border border-input px-3 py-1.5 font-medium hover:bg-muted disabled:opacity-60"
          >
            Complete all
          </button>
          <button
            disabled={saving}
            onClick={onReset}
            className="rounded-md border border-input px-3 py-1.5 font-medium hover:bg-muted disabled:opacity-60"
          >
            Reset
          </button>
          <button
            onClick={handlePrint}
            className="rounded-md border border-input px-3 py-1.5 font-medium hover:bg-muted flex items-center gap-1"
          >
            <Printer className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleDownload}
            className="rounded-md border border-input px-3 py-1.5 font-medium hover:bg-muted flex items-center gap-1"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 font-medium hover:bg-primary/90"
          >
            {expanded ? "Collapse" : "Open checklist"}
          </button>
        </div>
      </div>

      <div className="h-2 w-full rounded-full bg-muted overflow-hidden mb-4">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Checklist progress"
        />
      </div>

      {todo.length > 0 && (
        <div className="mb-4 rounded-md border border-border bg-muted/40 p-3">
          <div className="text-xs font-semibold text-foreground mb-1">Still to do</div>
          <ol className="list-decimal list-inside text-sm text-foreground space-y-0.5">
            {todo.map((ref) => (
              <li key={ref.key}>{ref.item}</li>
            ))}
          </ol>
        </div>
      )}

      {!expanded ? (
        <ul className="grid sm:grid-cols-2 gap-1.5 text-sm">
          {template.map((group) => {
            const groupDone = group.items.filter((item) =>
              checkedSet.has(`${group.category}::${item}`),
            ).length;
            return (
              <li key={group.category} className="flex justify-between text-muted-foreground">
                <span>{group.category}</span>
                <span className="font-medium text-foreground">
                  {groupDone}/{group.items.length}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {template.map((group) => (
            <div key={group.category}>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                {group.category}
              </h4>
              <div className="space-y-1.5">
                {group.items.map((item) => {
                  const key = `${group.category}::${item}`;
                  const isChecked = checkedSet.has(key);
                  return (
                    <button
                      key={item}
                      onClick={() => onToggleItem(key)}
                      className="flex items-start gap-2 w-full text-left"
                    >
                      {isChecked ? (
                        <CheckCircle2 className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
                      )}
                      <span
                        className={`text-sm ${isChecked ? "line-through text-muted-foreground" : "text-foreground"}`}
                      >
                        {item}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-border no-print">
        <Link to={`/checklist?trip=${tripId}`} className="text-xs font-medium text-primary hover:underline flex items-center gap-1 w-fit">
          <ExternalLink className="h-3 w-3" /> Open on main checklist page
        </Link>
      </div>
    </div>
  );
}
