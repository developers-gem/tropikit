// frontend/src/pages/ChecklistPage.tsx
import { useSearchParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ListChecks,
  CheckCircle2,
  Circle,
  Printer,
  Download,
  Sparkles,
  RotateCcw,
  CheckCheck,
  Plane,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
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
import {
  flattenChecklist,
  stillToDo,
  buildChecklistText,
  downloadChecklistText,
} from "@/utils/checklist";
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

  const {
    data: baseTemplate,
    isLoading: baseLoading,
    isError: baseError,
    refetch: refetchBase,
  } = useQuery({
    queryKey: ["checklist-template"],
    queryFn: fetchChecklistTemplate,
    enabled: !tripId,
  });

  const {
    data: tripTemplate,
    isLoading: tripTemplateLoading,
    isError: tripTemplateError,
  } = useQuery({
    queryKey: ["trip-checklist-template", tripId],
    queryFn: () => fetchTripChecklistTemplate(tripId!),
    enabled: !!tripId,
  });

  const {
    data: tripProgress,
    isLoading: tripProgressLoading,
    isError: tripProgressError,
  } = useQuery({
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

  if (isLoading) return <LoadingState label="Loading personalized checklist..." />;
  if (isError)
    return (
      <ErrorState
        message="Couldn't load the checklist. Please verify your connection."
        onRetry={() => refetchBase()}
      />
    );

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
      title: selectedTrip
        ? `Travel Health Checklist — ${selectedTrip._id}`
        : "Travel Health Checklist",
      template,
      checkedKeys,
    });
    downloadChecklistText("tropikit-checklist.txt", text);
  }

  return (
    <section id="checklist" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* 1. Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary/10 via-card to-background border border-border p-8 md:p-12 shadow-soft no-print">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Step 02 • Health Preparation Protocols
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Your Travel <span className="text-primary">Health Checklist</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Track vital pre-departure vaccinations, mosquito prophylaxis, prescription medications,
            and essential documentation tailored to your travel destinations.
          </p>

          <div className="flex flex-wrap items-center gap-6 pt-2 text-xs font-medium text-muted-foreground">
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-primary" />
              <span>
                <strong className="text-foreground">{total}</strong> Total Requirements
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-emerald-600" />
              <span>
                <strong className="text-foreground">{completed}</strong> Completed ({percentage}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Control Toolbar & Progress Bar */}
      <div className="space-y-4 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-border bg-card shadow-soft">
          <div className="flex-1">
            {status === "authenticated" && trips && trips.length > 0 ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <label
                  htmlFor="trip-select"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap"
                >
                  Checklist for:
                </label>
                <select
                  id="trip-select"
                  value={tripId ?? ""}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (next) setSearchParams({ trip: next });
                    else setSearchParams({});
                  }}
                  className="h-9.5 rounded-xl border border-border bg-background px-3 text-xs sm:text-sm text-foreground focus:outline-hidden focus:border-primary cursor-pointer max-w-xs shadow-xs"
                >
                  <option value="">General checklist (this device only)</option>
                  {trips.map((t) => (
                    <option key={t._id} value={t._id}>
                      Trip — {new Date(t.departureDate).toLocaleDateString()}
                    </option>
                  ))}
                </select>

                {tripId && (
                  <Link
                    to={`/trip/${tripId}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    <Plane className="h-3.5 w-3.5" /> Open Trip Hub
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Progress saved locally on this device.{" "}
                <Link to="/login" className="font-semibold text-primary hover:underline">
                  Log in
                </Link>{" "}
                to sync with your trips.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={completeAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer shadow-xs"
            >
              <CheckCheck className="h-3.5 w-3.5 text-primary" /> Complete All
            </button>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-background text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shadow-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="h-3.5 w-3.5" /> Print
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground hover:bg-muted transition-colors cursor-pointer shadow-xs"
            >
              <Download className="h-3.5 w-3.5 text-primary" /> Export (.TXT)
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 space-y-2.5 shadow-soft">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-foreground">Travel Health Readiness Score</span>
            <span className="text-primary font-bold">{percentage}% Complete ({completed}/{total})</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Priority Callout */}
      {todo.length > 0 && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 space-y-2.5 no-print">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
              Immediate Priorities (Still to do)
            </h2>
          </div>
          <ol className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-foreground">
            {todo.map((ref, idx) => (
              <li
                key={ref.key}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-card"
              >
                <span className="h-5 w-5 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                  {idx + 1}
                </span>
                <span className="truncate">{ref.item}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* 4. Checklist Cards (Top-aligned items) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:grid-cols-2">
        {template.map((group) => {
          const groupItems = group.items;
          const groupDone = groupItems.filter((item) =>
            checkedSet.has(`${group.category}::${item}`)
          ).length;

          return (
            <Card
              key={group.category}
              className="rounded-2xl border border-border bg-card shadow-soft hover:border-primary/40 transition-colors flex flex-col justify-start"
            >
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    {group.category}
                  </CardTitle>
                  <span className="text-xs font-semibold text-primary px-2 py-0.5 rounded-md bg-primary/10">
                    {groupDone}/{groupItems.length}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-2 pt-4 flex-1 flex flex-col justify-start">
                {groupItems.map((item) => {
                  const key = `${group.category}::${item}`;
                  const isChecked = checkedSet.has(key);

                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggle(key)}
                      className={`flex items-start gap-3 w-full text-left p-2 rounded-xl transition-all cursor-pointer ${
                        isChecked
                          ? "bg-primary/5 text-muted-foreground"
                          : "hover:bg-muted/60 text-foreground"
                      }`}
                    >
                      {isChecked ? (
                        <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="h-4.5 w-4.5 text-muted-foreground/40 shrink-0 mt-0.5 hover:text-primary transition-colors" />
                      )}
                      <span
                        className={`text-xs leading-relaxed transition-colors ${
                          isChecked ? "line-through text-muted-foreground" : "font-medium"
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
    </section>
  );
}