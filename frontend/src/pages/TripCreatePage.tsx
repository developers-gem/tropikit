// frontend/src/pages/TripDetailPage.tsx
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  MapPin,
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Siren,
  CheckSquare,
  Square,
  Bell,
  BookOpen,
  Compass,
  HeartHandshake,
  Download,
} from "lucide-react";
import {
  fetchTripDashboard,
  saveTripChecklist,
  downloadTripCalendar,
  updateTripPreparation,
} from "@/api/tripApi";
import { LoadingState, ErrorState } from "@/components/StateViews";

function formatDate(iso: string) {
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

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [downloadingCal, setDownloadingCal] = useState(false);

  // Local state for immediate checkbox feedback
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

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

  // Checklist mutation with optimistic updates
  const checklistMutation = useMutation({
    mutationFn: (checkedItemKeys: string[]) => saveTripChecklist(id!, checkedItemKeys),
    onSuccess: (updatedProgress) => {
      if (updatedProgress?.checkedItemKeys) {
        setSelectedKeys(updatedProgress.checkedItemKeys);
      }
      queryClient.setQueryData(["trip-dashboard", id], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          checklist: {
            ...old.checklist,
            progress: updatedProgress || {
              ...old.checklist?.progress,
              checkedItemKeys: selectedKeys,
              completed: selectedKeys.length,
            },
          },
        };
      });
    },
    onError: () => {
      if (dashboard?.checklist?.progress?.checkedItemKeys) {
        setSelectedKeys(dashboard.checklist.progress.checkedItemKeys);
      }
    },
  });

  // Initialize and sync from server data when mutation isn't running
  useEffect(() => {
    if (dashboard?.checklist?.progress?.checkedItemKeys && !checklistMutation.isPending) {
      setSelectedKeys(dashboard.checklist.progress.checkedItemKeys);
    }
  }, [dashboard?.checklist?.progress?.checkedItemKeys]);

  const prepMutation = useMutation({
    mutationFn: (vars: Parameters<typeof updateTripPreparation>[1]) =>
      updateTripPreparation(id!, vars),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip-dashboard", id] });
    },
  });

  if (!id || id === "undefined") {
    return <ErrorState message="Invalid Trip ID specified. Please return to your trips." />;
  }

  if (isLoading) {
    return <LoadingState label="Loading comprehensive travel dashboard..." />;
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
    reminders = [],
    stories = [],
    readiness,
  } = dashboard;

  const daysUntil = getDaysUntil(trip.departureDate);

  // Resolves the canonical key from any Tropikit checklist schema
  const getItemKey = (item: any, fallbackIdx: number): string => {
    if (typeof item === "string") return item;
    return (
      item.itemKey ||
      item.key ||
      item.id ||
      item._id ||
      item.code ||
      item.text ||
      item.label ||
      `item-${fallbackIdx}`
    );
  };

  const getItemLabel = (item: any): string => {
    if (typeof item === "string") return item;
    return item.text || item.label || item.title || item.name || "Checklist Item";
  };

  const getItemDescription = (item: any): string => {
    if (typeof item === "string") return "";
    return item.description || item.detail || item.hint || "";
  };

  // Toggle single item
  const toggleChecklistItem = (itemKey: string) => {
    if (!itemKey) return;

    const isCurrentlyChecked = selectedKeys.includes(itemKey);
    const updated = isCurrentlyChecked
      ? selectedKeys.filter((k) => k !== itemKey)
      : [...selectedKeys, itemKey];

    setSelectedKeys(updated);
    checklistMutation.mutate(updated);
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

  const totalItems =
    checklist?.progress?.total ||
    checklist?.template?.reduce(
      (acc: number, g: any) => acc + (g.items?.length || g.checklistItems?.length || 0),
      0
    ) ||
    28;
  const completedCount = selectedKeys.length;
  const progressScore =
    readiness?.score ?? Math.min(100, Math.round((completedCount / totalItems) * 100));

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Destination & Dates Header */}
      <div>
        <Link
          to="/account/trips"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to all trips
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span>{destination?.region || "Global Travel"}</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground mt-1">
              {destination?.name || "Destination"} Preparation Hub
            </h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {formatDate(trip.departureDate)} — {formatDate(trip.returnDate)}
              </span>
              <span className="font-semibold text-primary">
                ({daysUntil > 0 ? `${daysUntil} days until departure` : "Trip in progress"})
              </span>
            </div>
          </div>

          <button
            onClick={handleDownloadCalendar}
            disabled={downloadingCal}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors self-start md:self-auto cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-primary" />
            {downloadingCal ? "Exporting..." : "Sync Schedule (.ICS)"}
          </button>
        </div>
      </div>

      {/* 2. Preparation Progress Bar */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-2">
        <div className="flex justify-between items-center text-xs font-semibold">
          <span className="text-foreground">Travel-Health Readiness Score</span>
          <span className="text-primary font-bold">{progressScore}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 rounded-full"
            style={{ width: `${progressScore}%` }}
          />
        </div>
      </div>

      {/* 3. Clinical Directives */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Vaccines */}
        <div className="p-5 rounded-xl border border-border bg-card space-y-3 shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Vaccines
            </div>
            <p className="text-lg font-bold capitalize text-foreground mt-1">
              {trip.vaccineStatus.replace("-", " ")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {destination?.vaccineRequirements?.length
                ? `${destination.vaccineRequirements.length} recommended for ${destination.name}`
                : "No high-risk endemic vaccines flagged."}
            </p>
          </div>
          <button
            onClick={() =>
              prepMutation.mutate({
                vaccineStatus: trip.vaccineStatus === "reviewed" ? "not-reviewed" : "reviewed",
              })
            }
            className="text-xs text-primary font-semibold hover:underline text-left cursor-pointer pt-2 border-t border-border"
          >
            Mark as {trip.vaccineStatus === "reviewed" ? "Unreviewed" : "Reviewed"}
          </button>
        </div>

        {/* Malaria Plan */}
        <div className="p-5 rounded-xl border border-border bg-card space-y-3 shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
              <Clock className="h-4 w-4 text-amber-500" />
              Malaria Plan
            </div>
            <p className="text-lg font-bold capitalize text-foreground mt-1">
              {malariaPlan ? malariaPlan.medication : trip.malariaPlanStatus.replace("-", " ")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {malariaPlan
                ? `Zone: ${malariaPlan.timezone}. Regimen active.`
                : "No antimalarial regimen configured."}
            </p>
          </div>
          <Link
            to="/checklist"
            className="text-xs text-primary font-semibold hover:underline pt-2 border-t border-border"
          >
            Manage Regimen →
          </Link>
        </div>

        {/* Emergency Readiness */}
        <div className="p-5 rounded-xl border border-border bg-card space-y-3 shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
              <Siren className="h-4 w-4 text-destructive" />
              Emergency Info
            </div>
            <p className="text-lg font-bold text-foreground mt-1">
              {trip.emergencyAcknowledged ? "Acknowledged" : "Action Needed"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Police: {destination?.emergencyNumbers?.police || "911 / 112"} | Ambulance:{" "}
              {destination?.emergencyNumbers?.ambulance || "911 / 112"}
            </p>
          </div>
          <button
            onClick={() =>
              prepMutation.mutate({
                emergencyAcknowledged: !trip.emergencyAcknowledged,
              })
            }
            className="text-xs text-primary font-semibold hover:underline text-left cursor-pointer pt-2 border-t border-border"
          >
            {trip.emergencyAcknowledged ? "Clear Confirmation" : "Confirm Emergency Numbers"}
          </button>
        </div>
      </div>

      {/* 4. Interactive Personalized Checklist */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-soft">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Personalized Health Checklist</h2>
          </div>
          <span className="text-xs text-muted-foreground">
            {completedCount} of {totalItems} completed
          </span>
        </div>

        <div className="space-y-6 pt-2">
          {checklist?.template?.map((group: any, gIdx: number) => {
            const categoryName =
              group.category || group.title || group.name || `Category ${gIdx + 1}`;
            const groupItems = group.items || group.checklistItems || [];

            return (
              <div key={categoryName} className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {categoryName}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {groupItems.map((item: any, iIdx: number) => {
                    const uniqueKey = getItemKey(item, iIdx);
                    const label = getItemLabel(item);
                    const description = getItemDescription(item);
                    const isChecked = selectedKeys.includes(uniqueKey);

                    return (
                      <button
                        type="button"
                        key={uniqueKey}
                        onClick={() => toggleChecklistItem(uniqueKey)}
                        className={`flex items-start text-left gap-3 p-3.5 rounded-xl border transition-all cursor-pointer w-full ${
                          isChecked
                            ? "bg-primary/5 border-primary/30 text-muted-foreground shadow-none"
                            : "bg-background border-border hover:border-primary/40 text-foreground shadow-xs"
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        ) : (
                          <Square className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p
                            className={`text-xs font-semibold leading-snug ${
                              isChecked
                                ? "line-through text-muted-foreground"
                                : "text-foreground"
                            }`}
                          >
                            {label}
                          </p>
                          {description && (
                            <p className="text-[11px] text-muted-foreground mt-1 leading-normal">
                              {description}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Scheduled Travel Reminders */}
      {reminders.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-soft">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Scheduled Travel Reminders</h2>
          </div>
          <div className="space-y-2">
            {reminders.map((reminder: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-background text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-primary">{formatDate(reminder.dueDate)}</span>
                  <span className="text-foreground">{reminder.title}</span>
                </div>
                <span className="text-muted-foreground">{reminder.type || "Preparation"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Guidance Protocols */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border bg-card p-6 space-y-3 shadow-soft">
          <div className="flex items-center gap-2 text-foreground font-bold">
            <Compass className="h-5 w-5 text-primary" />
            <h3>During-Trip Protocol</h3>
          </div>
          <ul className="text-xs text-muted-foreground space-y-2 list-disc list-inside leading-relaxed">
            <li>Food & Water: Stick to sealed beverages; avoid unpeeled produce.</li>
            <li>Vector Protection: Apply 20–30% DEET insect repellent at dawn and dusk.</li>
            <li>Heat & Hydration: Maintain electrolyte intake in high humidity.</li>
            <li>Seek urgent medical care if fever above 38°C (100.4°F) arises in a malaria zone.</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-3 shadow-soft">
          <div className="flex items-center gap-2 text-foreground font-bold">
            <HeartHandshake className="h-5 w-5 text-emerald-600" />
            <h3>After-Trip Protocol</h3>
          </div>
          <ul className="text-xs text-muted-foreground space-y-2 list-disc list-inside leading-relaxed">
            <li>Complete all terminal post-travel antimalarial doses without interruption.</li>
            <li>Monitor for fever or persistent gastrointestinal symptoms up to 6 months post-trip.</li>
            <li>Always inform doctors of your recent tropical travel history if illness occurs.</li>
          </ul>
        </div>
      </div>

      {/* 7. Traveler Stories */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-soft">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">
            Traveler Stories from {destination?.name || "Destination"}
          </h2>
        </div>

        {stories.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center space-y-1">
            <p className="text-sm font-semibold text-foreground">No traveler stories in db</p>
            <p className="text-xs text-muted-foreground">
              No firsthand community stories or medical experiences have been posted for this destination yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stories.map((story: any) => {
              // Ensure we never link to /stories/undefined
              const storyId = story._id || story.id || story.slug;
              if (!storyId) return null;

              return (
                <Link
                  key={storyId}
                  to={`/stories/${storyId}`}
                  className="p-4 rounded-xl border border-border bg-background hover:border-primary/40 transition-colors block space-y-1.5"
                >
                  <h4 className="text-sm font-semibold text-foreground">{story.title}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {story.summary || story.body}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}