// frontend/src/pages/TripDetailPage.tsx
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  ArrowLeft,
  ShieldCheck,
  Clock,
  Siren,
  CheckCircle2,
  Circle,
  Bell,
  BookOpen,
  Compass,
  HeartHandshake,
  Download,
  ListChecks,
  Pill,
  Settings,
  AlertCircle,
  Trash2,
  Plus,
  X,
  CalendarDays,
  MapPin,
} from "lucide-react";
import {
  fetchTripDashboard,
  saveTripChecklist,
  downloadTripCalendar,
  updateTripPreparation,
  saveTripMalariaPlan,
  deleteTripMalariaPlan,
} from "@/api/tripApi";
import { apiRequest } from "@/api/client";
import { LoadingState, ErrorState } from "@/components/StateViews";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MalariaPlanModal } from "@/components/MalariaPlanModal";
import { flattenChecklist } from "@/utils/checklist";
import type { ChecklistGroup, DrugKey } from "@/types/api";

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getDaysUntil(iso: string): number {
  const diff = new Date(iso).getTime() - new Date().setHours(0, 0, 0, 0);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getRegimenTimeline(medication: any, depIso: string, retIso: string) {
  const dep = new Date(depIso);
  const ret = new Date(retIso);

  const medKey = typeof medication === "string" ? medication.toLowerCase() : "";
  let daysBefore = 1;
  let daysAfter = 7;
  let isWeekly = false;

  if (medKey.includes("doxycycline")) {
    daysBefore = 2;
    daysAfter = 28;
  } else if (medKey.includes("mefloquine")) {
    daysBefore = 14;
    daysAfter = 28;
    isWeekly = true;
  } else if (medKey.includes("chloroquine")) {
    daysBefore = 7;
    daysAfter = 28;
    isWeekly = true;
  }

  const start = new Date(dep);
  start.setDate(start.getDate() - daysBefore);

  const finalDose = new Date(ret);
  finalDose.setDate(finalDose.getDate() + daysAfter);

  const totalDays = Math.ceil((finalDose.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const doseCount = isWeekly ? Math.ceil(totalDays / 7) : totalDays;

  return {
    startDate: start.toISOString(),
    finalDoseDate: finalDose.toISOString(),
    totalDoseDays: doseCount,
    frequency: isWeekly ? "weekly" : "daily",
  };
}

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [downloadingCal, setDownloadingCal] = useState(false);
  const [isMalariaModalOpen, setIsMalariaModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);

  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [reminderType, setReminderType] = useState("travel-preparation");
  const [isSavingReminder, setIsSavingReminder] = useState(false);

  const [customReminders, setCustomReminders] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem(`custom_reminders_${id}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);

  const {
    data: dashboard,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["trip-dashboard", id],
    queryFn: () => fetchTripDashboard(id!),
    enabled: Boolean(id && id !== "undefined"),
  });

  useEffect(() => {
    if (dashboard?.checklist?.progress?.checkedItemKeys) {
      setCheckedKeys(dashboard.checklist.progress.checkedItemKeys);
    }
  }, [dashboard?.checklist?.progress?.checkedItemKeys]);

  const saveMutation = useMutation({
    mutationFn: (keys: string[]) => saveTripChecklist(id!, keys),
    onSuccess: (data: any) => {
      const incomingKeys = Array.isArray(data?.checkedItemKeys)
        ? data.checkedItemKeys
        : Array.isArray(data)
          ? data
          : checkedKeys;

      setCheckedKeys(incomingKeys);

      queryClient.setQueryData(["trip-dashboard", id], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          checklist: {
            ...old.checklist,
            progress: {
              ...old.checklist?.progress,
              checkedItemKeys: incomingKeys,
              completed: incomingKeys.length,
            },
          },
        };
      });
    },
    onError: () => {
      if (dashboard?.checklist?.progress?.checkedItemKeys) {
        setCheckedKeys(dashboard.checklist.progress.checkedItemKeys);
      }
    },
  });

  const prepMutation = useMutation({
    mutationFn: (vars: Parameters<typeof updateTripPreparation>[1]) =>
      updateTripPreparation(id!, vars),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip-dashboard", id] });
    },
  });

  const saveMalariaMutation = useMutation({
    mutationFn: ({ medication, timezone }: { medication: DrugKey; timezone: string }) =>
      saveTripMalariaPlan(id!, medication, timezone),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip-dashboard", id] });
    },
  });

  const deleteMalariaMutation = useMutation({
    mutationFn: () => deleteTripMalariaPlan(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip-dashboard", id] });
    },
  });

  if (!id || id === "undefined") {
    return <ErrorState message="Invalid Trip ID specified. Please return to your trips." />;
  }

  if (isLoading) {
    return <LoadingState label="Loading comprehensive travel preparation hub..." />;
  }

  if (isError || !dashboard) {
    return (
      <ErrorState
        message="Could not load details for this trip."
        onRetry={() => refetch()}
      />
    );
  }

  const {
    trip,
    destination,
    checklist,
    malariaPlan,
    reminders: serverReminders = [],
    stories = [],
  } = dashboard;

  const reminders = [...customReminders, ...serverReminders];
  const template: ChecklistGroup[] = (checklist?.template as ChecklistGroup[]) || [];
  const checkedSet = new Set(checkedKeys);

  const allFlattened = flattenChecklist(template);
  const total = allFlattened.length || 1;
  const completed = checkedKeys.length;
  const percentage = Math.min(100, Math.round((completed / total) * 100));
  const daysUntil = getDaysUntil(trip.departureDate);

  // Safe accessor for malaria plan drug / medication key
  const activeMedication = (malariaPlan as any)?.drugKey || (malariaPlan as any)?.medication || "";

  const malariaTimeline = malariaPlan
    ? getRegimenTimeline(
        activeMedication,
        trip.departureDate,
        trip.returnDate
      )
    : null;

  // Safe accessor for destination vaccines
  const vaccineList = destination?.vaccines || (destination as any)?.vaccineRequirements || [];

  // Safe accessor for destination emergency numbers
  const policeContact = destination?.emergencyContacts?.find(
    (c) => c.category?.toLowerCase() === "police"
  )?.number || (destination as any)?.emergencyNumbers?.police || "112 / 911";

  const ambulanceContact = destination?.emergencyContacts?.find(
    (c) => c.category?.toLowerCase() === "ambulance"
  )?.number || (destination as any)?.emergencyNumbers?.ambulance || "112 / 911";

  const resolveItemKey = (groupCategory: string, item: any): string => {
    if (typeof item === "string") return `${groupCategory}::${item}`;
    return item.key || item.itemKey || `${groupCategory}::${item.text || item.label || ""}`;
  };

  const resolveItemText = (item: any): string => {
    if (typeof item === "string") return item;
    return item.text || item.label || item.title || "";
  };

  const handleToggle = (key: string) => {
    if (!key) return;
    const next = checkedSet.has(key)
      ? checkedKeys.filter((k) => k !== key)
      : [...checkedKeys, key];

    setCheckedKeys(next);
    saveMutation.mutate(next);
  };

  const handleDownloadCalendar = async () => {
    try {
      setDownloadingCal(true);
      await downloadTripCalendar(id!, destination?.slug || "trip");
    } catch (err: any) {
      alert(err.message || "Failed to download calendar.");
    } finally {
      setDownloadingCal(false);
    }
  };

  const handleDeletePlan = async () => {
    if (confirm("Are you sure you want to remove the malaria plan from this trip?")) {
      await deleteMalariaMutation.mutateAsync();
    }
  };

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderTitle.trim()) return;

    setIsSavingReminder(true);
    const newReminder = {
      _id: `custom-${Date.now()}`,
      title: reminderTitle.trim(),
      dueDate: reminderDate || trip.departureDate,
      type: reminderType,
      createdAt: new Date().toISOString(),
    };

    try {
      await apiRequest(`/trips/${id}/reminders`, {
        method: "POST",
        body: {
          title: newReminder.title,
          dueDate: newReminder.dueDate,
          type: newReminder.type,
        },
        auth: true,
      });
      queryClient.invalidateQueries({ queryKey: ["trip-dashboard", id] });
    } catch {
      const updated = [newReminder, ...customReminders];
      setCustomReminders(updated);
      localStorage.setItem(`custom_reminders_${id}`, JSON.stringify(updated));
    } finally {
      setIsSavingReminder(false);
      setIsReminderModalOpen(false);
      setReminderTitle("");
    }
  };

  return (
    <div className="w-full space-y-3 p-0 m-0">
      {/* 1. Hero Hub Header */}
      <div className="relative overflow-hidden rounded-xl bg-linear-to-br from-primary/10 via-card to-background border border-border p-4 sm:p-5 shadow-xs">
        <Link
          to="/account/trips"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline mb-1.5"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to all trips
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
                <Compass className="h-3.5 w-3.5" />
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                <MapPin className="h-2.5 w-2.5" />
                {destination?.region || "Global Destination"}
              </span>
            </div>

            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {destination?.name || "Trip"} <span className="text-primary">Preparation Hub</span>
            </h1>

            <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground pt-0.5">
              <div className="flex items-center gap-1 font-medium">
                <Calendar className="h-3 w-3 text-primary" />
                <span>
                  {formatDate(trip.departureDate)} — {formatDate(trip.returnDate)}
                </span>
              </div>
              <span className="text-border">•</span>
              <div className="flex items-center gap-1 font-semibold text-primary">
                <CalendarDays className="h-3 w-3" />
                <span>
                  {daysUntil > 0 ? `${daysUntil} days until departure` : "Trip active / in-progress"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
            <button
              onClick={handleDownloadCalendar}
              disabled={downloadingCal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-all shadow-xs cursor-pointer"
            >
              <Download className="h-3 w-3 text-primary" />
              {downloadingCal ? "Exporting..." : "Sync (.ICS)"}
            </button>
            <Link
              to={`/checklist?trip=${id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs cursor-pointer"
            >
              <ListChecks className="h-3 w-3" />
              Checklist
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Readiness Score Bar */}
      <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-xs space-y-1.5">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-foreground font-bold">Travel Health Readiness Score</span>
          <span className="text-primary font-bold text-xs">
            {percentage}% Complete ({completed}/{total} tasks)
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* 3. Directives Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Vaccines */}
        <div className="p-4 rounded-xl border border-border bg-card space-y-2 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-colors">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Vaccines
              </span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                Directives
              </span>
            </div>
            <p className="text-base font-bold capitalize text-foreground mt-1">
              {trip?.vaccineStatus ? String(trip.vaccineStatus).replace(/-/g, " ") : "Not Reviewed"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {vaccineList.length > 0
                ? `${vaccineList.length} recommended immunization(s) for${destination?.name || "destination"}.`
                : "No high-risk endemic vaccines flagged."}
            </p>
          </div>
          <button
            onClick={() =>
              prepMutation.mutate({
                vaccineStatus: trip.vaccineStatus === "reviewed" ? "not-reviewed" : "reviewed",
              })
            }
            className="text-xs text-primary font-semibold hover:underline text-left cursor-pointer pt-2 border-t border-border/60"
          >
            Mark as {trip.vaccineStatus === "reviewed" ? "Unreviewed" : "Reviewed"}
          </button>
        </div>

        {/* Malaria Regimen Overview */}
        <div className="p-4 rounded-xl border border-border bg-card space-y-2 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-colors">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-500" /> Malaria Prophylaxis
              </span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
                Timeline
              </span>
            </div>
            <p className="text-base font-bold capitalize text-foreground mt-1">
              {activeMedication
                ? String(activeMedication).replace(/-/g, " ")
                : trip?.malariaPlanStatus
                  ? String(trip.malariaPlanStatus).replace(/-/g, " ")
                  : "No Plan Configured"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {malariaPlan
                ? `Active schedule synchronized in ${malariaPlan.timezone || "local"} timezone.`
                : "Configure your antimalarial timeline for pre-trip and post-trip doses."}
            </p>
          </div>
          <button
            onClick={() => setIsMalariaModalOpen(true)}
            className="text-xs text-primary font-semibold hover:underline text-left cursor-pointer pt-2 border-t border-border/60"
          >
            {malariaPlan ? "Modify Regimen Parameters →" : "Configure Regimen →"}
          </button>
        </div>

        {/* Emergency Readiness */}
        <div className="p-4 rounded-xl border border-border bg-card space-y-2 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-colors">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Siren className="h-3.5 w-3.5 text-destructive" /> Emergency Readiness
              </span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
                Hotlines
              </span>
            </div>
            <p className="text-base font-bold text-foreground mt-1">
              {trip.emergencyAcknowledged ? "Acknowledged" : "Action Needed"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Police: {policeContact} • Ambulance: {ambulanceContact}
            </p>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border/60">
            <button
              onClick={() =>
                prepMutation.mutate({
                  emergencyAcknowledged: !trip.emergencyAcknowledged,
                })
              }
              className="text-xs text-primary font-semibold hover:underline text-left cursor-pointer"
            >
              {trip.emergencyAcknowledged ? "Reset Confirmation" : "Confirm Numbers"}
            </button>
            <Link
              to={`/emergency?destination=${destination?.slug || ""}`}
              className="text-xs text-muted-foreground hover:text-foreground font-medium"
            >
              Directory →
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Complete Malaria Plan Dashboard Section */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-border/60 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
              <Pill className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Saved Malaria Prevention Plan</h2>
              <p className="text-[11px] text-muted-foreground">
                Clinical timing for pre-exposure, duration, and terminal post-travel doses.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {malariaPlan && (
              <button
                onClick={handleDeletePlan}
                disabled={deleteMalariaMutation.isPending}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
              >
                <Trash2 className="h-3 w-3" />
                Remove
              </button>
            )}
            <button
              onClick={() => setIsMalariaModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer shadow-xs"
            >
              <Settings className="h-3 w-3 text-primary" />
              {malariaPlan ? "Edit Plan" : "Set Up Plan"}
            </button>
          </div>
        </div>

        {malariaPlan && malariaTimeline ? (
          <div className="space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 bg-muted/30 p-2.5 rounded-lg border border-border/80 text-xs">
              <div className="col-span-2">
                <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                  Medication
                </span>
                <span className="font-bold text-foreground capitalize">
                  {activeMedication ? String(activeMedication).replace(/-/g, " ") : "Configured Regimen"}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                  Start Date
                </span>
                <span className="font-semibold text-foreground">
                  {formatDate(malariaTimeline.startDate)}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                  Departure
                </span>
                <span className="font-semibold text-foreground">
                  {formatDate(trip.departureDate)}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                  Return
                </span>
                <span className="font-semibold text-foreground">
                  {formatDate(trip.returnDate)}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                  Final Dose
                </span>
                <span className="font-bold text-emerald-600">
                  {formatDate(malariaTimeline.finalDoseDate)}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                  Total Dose-Days
                </span>
                <span className="font-bold text-primary">
                  {malariaTimeline.totalDoseDays} {malariaTimeline.frequency === "weekly" ? "wks" : "days"}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                  Reminders
                </span>
                <span className="font-semibold text-emerald-600 inline-flex items-center gap-1">
                  <Bell className="h-3 w-3" /> Active ({malariaPlan.timezone || "Local"})
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-muted-foreground gap-1 pt-0.5">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-foreground">Calendar Integration:</span>
                <span className="text-emerald-600">
                  Bundled into trip .ICS calendar download
                </span>
              </div>

              <span className="text-[11px] italic">
                *Terminal post-exposure doses are mandatory to eradicate liver-stage parasites.
              </span>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-center space-y-1.5">
            <Pill className="h-5 w-5 text-muted-foreground mx-auto" />
            <p className="text-xs font-semibold text-foreground">No Malaria Regimen saved for this trip yet</p>
            <p className="text-[11px] text-muted-foreground max-w-md mx-auto">
              Traveling to a malaria risk area? Configure your regimen to automatically calculate pre-travel start dates, final dose deadlines, and calendar reminders.
            </p>
            <button
              onClick={() => setIsMalariaModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer shadow-xs"
            >
              <Pill className="h-3 w-3" />
              Configure Plan
            </button>
          </div>
        )}

        <div className="rounded-lg border border-border bg-muted/40 p-2.5 flex gap-2 items-start text-xs text-muted-foreground">
          <AlertCircle className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            <strong>Recommendation:</strong> Source-based guidelines (CDC, WHO, NaTHNaC). Please consult a qualified travel-health professional before starting prescription prophylaxis.
          </p>
        </div>
      </div>

      {/* 5. Health Checklist Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-primary/10 text-primary">
              <ListChecks className="h-3.5 w-3.5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-foreground">Personalized Health Checklist</h2>
            </div>
          </div>
          <span className="text-xs font-semibold text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
            {completed} / {total} completed
          </span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {template.map((group) => {
            const groupItems = (group.items || []) as any[];
            const groupDone = groupItems.filter((item) => {
              const itemKey = resolveItemKey(group.category, item);
              return checkedSet.has(itemKey);
            }).length;

            return (
              <Card
                key={group.category}
                className="rounded-xl border border-border bg-card shadow-xs hover:border-primary/40 transition-colors flex flex-col justify-start"
              >
                <CardHeader className="p-3 border-b border-border/60">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {group.category}
                    </CardTitle>
                    <span className="text-[10px] font-semibold text-primary px-1.5 py-0.5 rounded-md bg-primary/10 shrink-0">
                      {groupDone}/{groupItems.length}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1 p-3 pt-2.5 flex-1 flex flex-col justify-start">
                  {groupItems.map((item) => {
                    const itemKey = resolveItemKey(group.category, item);
                    const itemText = resolveItemText(item);
                    const isChecked = checkedSet.has(itemKey);

                    return (
                      <button
                        key={itemKey}
                        type="button"
                        onClick={() => handleToggle(itemKey)}
                        className={`flex items-start gap-2 w-full text-left p-1.5 rounded-md transition-all cursor-pointer ${
                          isChecked
                            ? "bg-primary/5 text-muted-foreground"
                            : "hover:bg-muted/60 text-foreground"
                        }`}
                      >
                        {isChecked ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 mt-0.5 hover:text-primary transition-colors" />
                        )}
                        <span
                          className={`text-xs leading-relaxed transition-colors ${
                            isChecked
                              ? "line-through text-muted-foreground"
                              : "font-medium"
                          }`}
                        >
                          {itemText}
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

      {/* 6. Scheduled Travel Reminders */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-primary/10 text-primary">
              <Bell className="h-3.5 w-3.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Scheduled Travel Reminders</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setReminderDate(trip.departureDate ? trip.departureDate.split("T")[0] : "");
              setIsReminderModalOpen(true);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="h-3 w-3" />
            Add Reminder
          </button>
        </div>

        {reminders.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-3.5 text-center space-y-1">
            <Bell className="h-4 w-4 text-muted-foreground mx-auto" />
            <p className="text-xs font-semibold text-foreground">No reminders scheduled</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {reminders.map((reminder: any, idx: number) => {
              const rawDate =
                reminder.dueDate ||
                reminder.date ||
                reminder.targetDate ||
                reminder.scheduledFor ||
                reminder.time ||
                trip.departureDate;

              const displayTitle =
                reminder.title ||
                reminder.message ||
                reminder.label ||
                reminder.text ||
                reminder.description ||
                (reminder.type
                  ? `Task: ${String(reminder.type).replace(/-/g, " ")}`
                  : "Travel Task");

              const displayType =
                reminder.type ||
                reminder.category ||
                "travel-preparation";

              return (
                <div
                  key={reminder._id || reminder.id || idx}
                  className="flex items-center justify-between p-2 rounded-lg border border-border bg-background text-xs shadow-xs hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary min-w-[80px]">
                      {formatDate(rawDate)}
                    </span>
                    <span className="text-foreground font-medium">{displayTitle}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full capitalize">
                    {String(displayType).replace(/-/g, " ")}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 7. Clinical Guidance Protocols */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-3.5 space-y-1.5 shadow-xs">
          <div className="flex items-center gap-1.5 text-foreground font-bold">
            <div className="p-1 rounded-md bg-primary/10 text-primary">
              <Compass className="h-3 w-3" />
            </div>
            <h3 className="text-xs font-bold">During-Trip Protocol</h3>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside leading-relaxed">
            <li>Food & Water: Consume sealed bottled water; avoid unpeeled fruits and raw ice.</li>
            <li>Vector Protection: Apply 20–30% DEET or Picaridin at peak dusk and dawn feeding times.</li>
            <li>Thermal Health: Maintain balanced electrolyte intake in high tropical humidity.</li>
            <li>Emergency Care: Seek medical screening if fever &gt;38°C (100.4°F) arises in an endemic zone.</li>
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-card p-3.5 space-y-1.5 shadow-xs">
          <div className="flex items-center gap-1.5 text-foreground font-bold">
            <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-600">
              <HeartHandshake className="h-3 w-3" />
            </div>
            <h3 className="text-xs font-bold">After-Trip Protocol</h3>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside leading-relaxed">
            <li>Complete Regimen: Finish all terminal post-travel antimalarial tablets without early cessation.</li>
            <li>Symptom Watch: Monitor for fever, chills, or persistent malaise up to 6 months post-return.</li>
            <li>Physician Advisory: Always mention tropical destination exposure when seeking healthcare.</li>
          </ul>
        </div>
      </div>

      {/* 8. Destination Traveler Stories */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-2.5 shadow-xs">
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded-md bg-primary/10 text-primary">
            <BookOpen className="h-3.5 w-3.5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">
              Traveler Stories from {destination?.name || "Destination"}
            </h2>
          </div>
        </div>

        {(() => {
          const validStories = (stories || []).filter(
            (story: any) =>
              story &&
              typeof story === "object" &&
              Boolean(story._id || story.id || story.slug) &&
              Boolean(story.title || story.headline)
          );

          if (validStories.length === 0) {
            return (
              <div className="rounded-lg border border-dashed border-border bg-muted/20 p-3 text-center space-y-0.5">
                <p className="text-xs font-semibold text-foreground">No traveler stories available yet</p>
              </div>
            );
          }

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {validStories.map((story: any) => {
                const storyId = story._id || story.id || story.slug;
                return (
                  <Link
                    key={storyId}
                    to={`/stories/${storyId}`}
                    className="p-3 rounded-lg border border-border bg-background hover:border-primary/40 transition-all block space-y-1 shadow-xs"
                  >
                    <h4 className="text-xs font-bold text-foreground hover:text-primary transition-colors">
                      {story.title || story.headline}
                    </h4>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {story.summary || story.description || story.body || ""}
                    </p>
                  </Link>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Malaria Plan Configuration Modal */}
      <MalariaPlanModal
        isOpen={isMalariaModalOpen}
        onClose={() => setIsMalariaModalOpen(false)}
        onSave={async (plan: any) => {
          const medication = typeof plan === "object" ? plan.medication || plan.drugKey : plan;
          const timezone = typeof plan === "object" ? plan.timezone || "UTC" : "UTC";
          await saveMalariaMutation.mutateAsync({ medication, timezone });
        }}
        tripDeparture={trip.departureDate}
        tripReturn={trip.returnDate}
        existingPlan={malariaPlan}
      />

      {/* Add Reminder Modal */}
      {isReminderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-xl border border-border bg-card shadow-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-1.5">
                <Bell className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Create Travel Reminder</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsReminderModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateReminder} className="space-y-2.5">
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">
                  Reminder Title / Task
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Clinic appointment for Yellow Fever vaccine"
                  value={reminderTitle}
                  onChange={(e) => setReminderTitle(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-hidden shadow-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-hidden shadow-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">
                    Category
                  </label>
                  <select
                    value={reminderType}
                    onChange={(e) => setReminderType(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-hidden shadow-xs cursor-pointer"
                  >
                    <option value="travel-preparation">Preparation</option>
                    <option value="vaccine">Vaccine Clinic</option>
                    <option value="malaria">Antimalarial Dose</option>
                    <option value="bite-prevention">Bite Prevention</option>
                    <option value="checklist">Documents / Packing</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsReminderModalOpen(false)}
                  className="px-3 py-1 text-xs font-semibold rounded-lg border border-border text-foreground hover:bg-muted cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingReminder}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="h-3 w-3" />
                  {isSavingReminder ? "Saving..." : "Add Reminder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}