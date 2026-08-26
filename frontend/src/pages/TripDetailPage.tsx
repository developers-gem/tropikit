import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchTripDashboard,
  deleteTrip,
  saveTripChecklist,
  updateTripPreparation,
  saveTripMalariaPlan,
  deleteTripMalariaPlan,
  downloadTripCalendar,
} from "@/api/tripApi";
import { LoadingState, ErrorState } from "@/components/StateViews";
import { TripHeader } from "@/components/dashboard/TripHeader";
import { ReadinessCard } from "@/components/dashboard/ReadinessCard";
import { HealthPreparationCards } from "@/components/dashboard/HealthPreparationCards";
import { TripMalariaCard } from "@/components/dashboard/TripMalariaCard";
import { TripChecklistCard } from "@/components/dashboard/TripChecklistCard";
import { PreparationTimeline } from "@/components/dashboard/PreparationTimeline";
import { RemindersList } from "@/components/dashboard/RemindersList";
import { TripStoriesSection } from "@/components/dashboard/TripStoriesSection";
import { DuringTripCard } from "@/components/dashboard/DuringTripCard";
import { AfterTripCard } from "@/components/dashboard/AfterTripCard";
import { TripEmergencySection } from "@/components/dashboard/TripEmergencySection";
import type { VaccineStatus, MalariaPlanStatus, DrugKey } from "@/types/api";

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

const VACCINE_STATUS_CYCLE: VaccineStatus[] = ["not-reviewed", "in-progress", "reviewed"];

export default function TripDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: dashboard,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["trip-dashboard", id],
    queryFn: () => fetchTripDashboard(id),
    enabled: !!id,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["trip-dashboard", id] });
  }

  const checklistMutation = useMutation({
    mutationFn: (keys: string[]) => saveTripChecklist(id, keys),
    onSuccess: invalidate,
  });

  const preparationMutation = useMutation({
    mutationFn: (input: {
      vaccineStatus?: VaccineStatus;
      malariaPlanStatus?: MalariaPlanStatus;
      emergencyAcknowledged?: boolean;
    }) => updateTripPreparation(id, input),
    onSuccess: invalidate,
  });

  const malariaPlanMutation = useMutation({
    mutationFn: ({ drug, timezone }: { drug: string; timezone: string }) =>
      saveTripMalariaPlan(id, drug as DrugKey, timezone),
    onSuccess: invalidate,
  });

  const confirmMalariaPlanMutation = useMutation({
    mutationFn: () => updateTripPreparation(id, { malariaPlanStatus: "confirmed" }),
    onSuccess: invalidate,
  });

  const deleteMalariaPlanMutation = useMutation({
    mutationFn: () => deleteTripMalariaPlan(id),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteTrip(id),
    onSuccess: () => navigate("/account/trips"),
  });

  if (isLoading) return <LoadingState label="Loading your trip dashboard..." />;
  if (isError || !dashboard)
    return <ErrorState message="Couldn't load this trip." onRetry={() => refetch()} />;

  const { trip, destination, readiness, checklist, malariaPlan, malariaApplicable, drugRegimens, timeline, reminders, stories, duringTrip, afterTrip } =
    dashboard;

  function handleDelete() {
    if (!confirm("Delete this trip? This cannot be undone.")) return;
    deleteMutation.mutate();
  }

  function cycleVaccineStatus() {
    const currentIndex = VACCINE_STATUS_CYCLE.indexOf(trip.vaccineStatus);
    const next = VACCINE_STATUS_CYCLE[(currentIndex + 1) % VACCINE_STATUS_CYCLE.length];
    preparationMutation.mutate({ vaccineStatus: next });
  }

  function toggleChecklistItem(key: string) {
    const current = new Set(checklist.checkedItemKeys);
    if (current.has(key)) current.delete(key);
    else current.add(key);
    checklistMutation.mutate([...current]);
  }

  function completeAllChecklist() {
    const allKeys = checklist.template.flatMap((g) => g.items.map((item) => `${g.category}::${item}`));
    checklistMutation.mutate(allKeys);
  }

  function resetChecklist() {
    if (!confirm("Reset all checklist progress for this trip?")) return;
    checklistMutation.mutate([]);
  }

  return (
    <section className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
      <TripHeader
        destinationName={destination.name}
        region={destination.region}
        departureDate={trip.departureDate}
        returnDate={trip.returnDate}
        daysUntilDeparture={trip.daysUntilDeparture}
        durationDays={trip.durationDays}
        onDelete={handleDelete}
        onOpenPlanner={() => navigate(`/destinations/${destination.slug}`)}
      />

      <div className="space-y-6">
        <ReadinessCard readiness={readiness} />

        <HealthPreparationCards
          vaccineStatus={trip.vaccineStatus}
          malariaApplicable={malariaApplicable}
          malariaPlanStatus={trip.malariaPlanStatus}
          checklistCompleted={checklist.completed}
          checklistTotal={checklist.total}
          emergencyAcknowledged={trip.emergencyAcknowledged}
          onOpenVaccines={cycleVaccineStatus}
          onOpenMalaria={() => scrollToSection("malaria-section")}
          onOpenChecklist={() => scrollToSection("checklist-section")}
          onOpenEmergency={() => scrollToSection("emergency-section")}
        />

        {malariaApplicable && (
          <div id="malaria-section">
            <TripMalariaCard
              malariaPlan={malariaPlan}
              malariaPlanStatus={trip.malariaPlanStatus}
              drugRegimens={drugRegimens}
              onSavePlan={async (drug, timezone) => {
                await malariaPlanMutation.mutateAsync({ drug, timezone });
              }}
              onConfirmPlan={async () => {
                await confirmMalariaPlanMutation.mutateAsync();
              }}
              onDeletePlan={async () => {
                await deleteMalariaPlanMutation.mutateAsync();
              }}
              onDownloadCalendar={() => downloadTripCalendar(id, destination.slug)}
            />
          </div>
        )}

        <div id="checklist-section">
          <TripChecklistCard
            tripId={id}
            template={checklist.template}
            checkedItemKeys={checklist.checkedItemKeys}
            completed={checklist.completed}
            total={checklist.total}
            saving={checklistMutation.isPending}
            onToggleItem={toggleChecklistItem}
            onCompleteAll={completeAllChecklist}
            onReset={resetChecklist}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <PreparationTimeline timeline={timeline} />
          <RemindersList reminders={reminders} />
        </div>

        <TripStoriesSection groups={stories} />

        <div className="grid sm:grid-cols-2 gap-6">
          <DuringTripCard section={duringTrip} />
          <AfterTripCard section={afterTrip} />
        </div>

        <div id="emergency-section">
          <TripEmergencySection
            localContacts={destination.emergencyContacts}
            destinationSlug={destination.slug}
            acknowledged={trip.emergencyAcknowledged}
            onAcknowledge={() =>
              preparationMutation.mutate({ emergencyAcknowledged: !trip.emergencyAcknowledged })
            }
          />
        </div>
      </div>
    </section>
  );
}
