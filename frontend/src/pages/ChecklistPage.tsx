import { useSearchParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ListChecks, CheckCircle2, Circle, Printer, Download } from "lucide-react";
import {
  fetchChecklistTemplate,
  fetchTripChecklistTemplate,
  fetchTrips,
  fetchTripChecklist,
  saveTripChecklist,
} from "@/api/tripApi";
import { useLocalChecklist } from "@/hooks/useLocalChecklist";
import { LoadingState, ErrorState } from "@/components/StateViews";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { flattenChecklist, stillToDo, buildChecklistText, downloadChecklistText } from "@/utils/checklist";
import type { ChecklistGroup } from "@/types/api";

export default function ChecklistPage() {
  const { status } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tripId = searchParams.get("trip");
  const queryClient = useQueryClient();

  const local = useLocalChecklist();

  const { data: trips } = useQuery({
    queryKey: ["trips"],
    queryFn: fetchTrips,
    enabled: status === "authenticated",
  });

  const { data: baseTemplate, isLoading: baseLoading, isError: baseError, refetch: refetchBase } = useQuery({
    queryKey: ["checklist-template"],
    queryFn: fetchChecklistTemplate,
    enabled: !tripId,
  });

  const { data: tripTemplate, isLoading: tripTemplateLoading, isError: tripTemplateError } = useQuery({
    queryKey: ["trip-checklist-template", tripId],
    queryFn: () => fetchTripChecklistTemplate(tripId!),
    enabled: !!tripId,
  });

  const { data: tripProgress, isLoading: tripProgressLoading, isError: tripProgressError } = useQuery({
    queryKey: ["trip-checklist", tripId],
    queryFn: () => fetchTripChecklist(tripId!),
    enabled: !!tripId,
  });

  const saveMutation = useMutation({
    mutationFn: (keys: string[]) => saveTripChecklist(tripId!, keys),
    onSuccess: (data) => {
      queryClient.setQueryData(["trip-checklist", tripId], data);
    },
  });

  const isLoading = tripId ? tripTemplateLoading || tripProgressLoading : baseLoading;
  const isError = tripId ? tripTemplateError || tripProgressError : baseError;

  if (isLoading) return <LoadingState label="Loading checklist..." />;
  if (isError) return <ErrorState message="Couldn't load the checklist." onRetry={() => refetchBase()} />;

  const template: ChecklistGroup[] = tripId ? tripTemplate ?? [] : baseTemplate ?? [];
  const checkedKeys: string[] = tripId ? tripProgress?.checkedItemKeys ?? [] : local.getCheckedKeys();
  const checkedSet = new Set(checkedKeys);

  const allItems = flattenChecklist(template);
  const total = allItems.length;
  const completed = checkedKeys.length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  const todo = stillToDo(template, checkedKeys, 3);
  const selectedTrip = trips?.find((t) => t._id === tripId);

  function toggle(key: string) {
    if (tripId) {
      const next = checkedSet.has(key)
        ? checkedKeys.filter((k) => k !== key)
        : [...checkedKeys, key];
      saveMutation.mutate(next);
    } else {
      local.toggle(key);
    }
  }

  function completeAll() {
    const allKeys = allItems.map((ref) => ref.key);
    if (tripId) saveMutation.mutate(allKeys);
    else local.setFromKeys(allKeys);
  }

  function reset() {
    if (!confirm("Reset all checklist progress?")) return;
    if (tripId) saveMutation.mutate([]);
    else local.reset();
  }

  function handlePrint() {
    window.print();
  }

  function handleDownload() {
    const text = buildChecklistText({
      title: selectedTrip ? `Travel Health Checklist — ${selectedTrip._id}` : "Travel Health Checklist",
      template,
      checkedKeys,
    });
    downloadChecklistText("tropikit-checklist.txt", text);
  }

  return (
    <section id="checklist" className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-6 no-print">
        <div>
          <p className="text-sm font-medium text-accent uppercase tracking-wider">Step 02</p>
          <h1 className="mt-1 text-3xl font-semibold text-foreground flex items-center gap-2">
            <ListChecks className="h-7 w-7 text-primary" /> Your Travel Health Checklist
          </h1>
        </div>
      </div>

      {status === "authenticated" && trips && trips.length > 0 && (
        <div className="mb-6 no-print">
          <label htmlFor="trip-select" className="text-xs font-medium text-muted-foreground">
            Checklist for
          </label>
          <select
            id="trip-select"
            value={tripId ?? ""}
            onChange={(e) => {
              const next = e.target.value;
              if (next) setSearchParams({ trip: next });
              else setSearchParams({});
            }}
            className="mt-1 block w-full sm:w-72 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">General checklist (this device only)</option>
            {trips.map((t) => (
              <option key={t._id} value={t._id}>
                Trip — {new Date(t.departureDate).toLocaleDateString()}
              </option>
            ))}
          </select>
          {tripId && (
            <p className="mt-1 text-xs text-muted-foreground">
              Synced to your account.{" "}
              <Link to={`/trip/${tripId}`} className="text-primary hover:underline">
                Open trip dashboard
              </Link>
            </p>
          )}
        </div>
      )}
      {status !== "authenticated" && (
        <p className="mb-6 text-sm text-muted-foreground no-print">
          Saved on this device.{" "}
          <Link to="/login" className="text-primary hover:underline">
            Log in
          </Link>{" "}
          and create a trip to sync progress across devices and personalize this checklist.
        </p>
      )}

      <div className="print-area">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-6">
          <div>
            <div className="text-3xl font-semibold text-primary">
              {completed}
              <span className="text-lg text-muted-foreground"> / {total} complete</span>
            </div>
            <div className="h-2 w-48 mt-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary" style={{ width: `${percentage}%` }} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 no-print">
            <button
              onClick={completeAll}
              className="rounded-md border border-input px-3 py-2 text-xs font-medium hover:bg-muted"
            >
              Complete all
            </button>
            <button
              onClick={reset}
              className="rounded-md border border-input px-3 py-2 text-xs font-medium hover:bg-muted"
            >
              Reset checklist
            </button>
            <button
              onClick={handlePrint}
              className="rounded-md border border-input px-3 py-2 text-xs font-medium hover:bg-muted flex items-center gap-1.5"
            >
              <Printer className="h-3.5 w-3.5" /> Print
            </button>
            <button
              onClick={handleDownload}
              className="rounded-md border border-input px-3 py-2 text-xs font-medium hover:bg-muted flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" /> Download
            </button>
          </div>
        </div>

        {todo.length > 0 && (
          <div className="mb-8 rounded-lg border border-border bg-muted/40 p-4">
            <h2 className="text-sm font-semibold text-foreground mb-2">Still to do</h2>
            <ol className="list-decimal list-inside space-y-1 text-sm text-foreground">
              {todo.map((ref) => (
                <li key={ref.key}>{ref.item}</li>
              ))}
            </ol>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {template.map((group) => {
            const groupItems = group.items;
            const groupDone = groupItems.filter((item) => checkedSet.has(`${group.category}::${item}`)).length;
            return (
              <Card key={group.category}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{group.category}</CardTitle>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {groupDone}/{groupItems.length}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {groupItems.map((item) => {
                    const key = `${group.category}::${item}`;
                    const isChecked = checkedSet.has(key);
                    return (
                      <button
                        key={item}
                        onClick={() => toggle(key)}
                        className="flex items-start gap-3 w-full text-left group"
                      >
                        {isChecked ? (
                          <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground/50 flex-shrink-0 mt-0.5 group-hover:text-primary" />
                        )}
                        <span
                          className={`text-sm transition-colors ${
                            isChecked ? "line-through text-muted-foreground" : "text-foreground"
                          }`}
                        >
                          {item}
                        </span>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
