import { Story } from "../models/Story";
import * as tripService from "./tripService";
import * as destinationService from "./destinationService";
import * as checklistService from "./checklistService";
import * as malariaPlanService from "./malariaPlanService";
import * as reminderService from "./reminderService";
import { DRUG_REGIMENS } from "./malariaService";
import { buildDuringTripSection, buildAfterTripSection } from "./journeyContentService";

const STORY_GROUPS: { key: string; label: string; category: string }[] = [
  { key: "before-you-go", label: "Before You Go", category: "before-you-go" },
  { key: "mosquito", label: "Mosquito Protection", category: "mosquito" },
  { key: "food-water", label: "Food & Water", category: "food-water" },
  { key: "safety", label: "Staying Safe", category: "safety" },
];

/**
 * The structural preparation framework requested for the dashboard timeline. This is
 * intentionally NOT medical content — it names generic task types (schedule a consultation,
 * review vaccines, etc.) that the destination's own advice/vaccines/malaria tabs already
 * carry the actual source-backed guidance for. No new medical claims are introduced here.
 */
const TIMELINE_FRAMEWORK: { weeksBefore: number; label: string }[] = [
  { weeksBefore: 8, label: "Health consultation" },
  { weeksBefore: 6, label: "Review vaccines" },
  { weeksBefore: 4, label: "Prepare medical kit" },
  { weeksBefore: 2, label: "Confirm medication" },
  { weeksBefore: 1, label: "Complete checklist" },
  { weeksBefore: 0, label: "Final preparation" },
];

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

export interface ReadinessInput {
  checklistCompleted: number;
  checklistTotal: number;
  vaccineStatus: string;
  malariaApplicable: boolean;
  malariaPlanStatus: string;
  emergencyAcknowledged: boolean;
}

export interface ReadinessResult {
  completed: number;
  total: number;
  percentage: number;
}

/**
 * Readiness is a plain completed/total ratio over real, discrete preparation tasks — not a
 * weighted or subjective score. Each checklist item counts as one task; vaccines, malaria
 * planning (only when the destination actually carries malaria risk), and emergency
 * acknowledgement each count as exactly one additional task, complete only at their final
 * status. Nothing here is fabricated or estimated — every number traces back to a stored
 * status field or the checklist progress record.
 */
export function calculateReadiness(input: ReadinessInput): ReadinessResult {
  let completed = input.checklistCompleted;
  let total = input.checklistTotal;

  total += 1; // vaccines
  if (input.vaccineStatus === "reviewed") completed += 1;

  if (input.malariaApplicable) {
    total += 1;
    if (input.malariaPlanStatus === "confirmed") completed += 1;
  }

  total += 1; // emergency
  if (input.emergencyAcknowledged) completed += 1;

  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { completed, total, percentage };
}

export interface TimelineMilestone {
  label: string;
  weeksBefore: number;
  date: string;
  status: "passed" | "today" | "upcoming";
}

export function buildTimeline(departureDate: Date, today: Date = new Date()): TimelineMilestone[] {
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);

  return TIMELINE_FRAMEWORK.map((step) => {
    const date = addDays(departureDate, -step.weeksBefore * 7);
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    const diff = daysBetween(todayStart, dateStart);
    const status: TimelineMilestone["status"] = diff < 0 ? "passed" : diff === 0 ? "today" : "upcoming";
    return { label: step.label, weeksBefore: step.weeksBefore, date: date.toISOString(), status };
  });
}

export interface ReminderItem {
  type: "timeline" | "medication" | "final-dose" | "checklist" | "consultation" | "travel-preparation" | "bite-prevention";
  label: string;
  date: string | null;
}

/**
 * Merges the trip's persisted, upcoming Reminder documents (timeline milestones + malaria
 * plan dates, if any — see reminderService.syncTripReminders) with one synthetic item that
 * isn't worth persisting: "N checklist items remaining" has no fixed calendar date, since it
 * changes every time an item is checked off. Sorted soonest-first; the undated item sorts last.
 */
export function mergeReminders(params: {
  persisted: { type: string; label: string; scheduledFor: Date }[];
  checklistRemaining: number;
}): ReminderItem[] {
  const items: ReminderItem[] = params.persisted.map((r) => ({
    type: r.type as ReminderItem["type"],
    label: r.label,
    date: r.scheduledFor.toISOString(),
  }));

  if (params.checklistRemaining > 0) {
    items.push({
      type: "checklist",
      label: `${params.checklistRemaining} checklist item${params.checklistRemaining === 1 ? "" : "s"} remaining`,
      date: null,
    });
  }

  return items.sort((a, b) => {
    if (a.date === null) return 1;
    if (b.date === null) return -1;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
}

export async function buildTripDashboard(tripId: string, userId: string) {
  const trip = await tripService.getTripForUser(tripId, userId);
  const destination = await destinationService.getDestinationById(String(trip.destinationId));
  const checklistProgress = await checklistService.getTripChecklistProgress(tripId, userId);
  const checklistTemplate = await checklistService.getTripChecklistTemplate(tripId, userId);

  // malariaRisk is an embedded object without its own `required: true` at the schema level
  // (see Destination.ts), so Mongoose's inferred type is honestly optional even though seed
  // data always populates it — handled defensively rather than asserted past, since a
  // destination genuinely missing this field should be treated as "risk unknown", not crash.
  const malariaApplicable = destination.malariaRisk?.level !== undefined && destination.malariaRisk.level !== "none";

  // The persisted plan (see malariaPlanService.ts) is now the single source of truth for
  // "does this trip have a malaria plan" — it always recomputes dates fresh from the trip's
  // current departure/return dates, so it can never silently drift out of sync with the trip.
  const malariaPlan = malariaApplicable ? await malariaPlanService.getMalariaPlanForTrip(tripId, userId) : null;

  const readiness = calculateReadiness({
    checklistCompleted: checklistProgress.completed,
    checklistTotal: checklistProgress.total,
    vaccineStatus: trip.vaccineStatus,
    malariaApplicable,
    malariaPlanStatus: trip.malariaPlanStatus,
    emergencyAcknowledged: trip.emergencyAcknowledged,
  });

  const timeline = buildTimeline(trip.departureDate);

  const persistedReminders = await reminderService.listUpcomingReminders(tripId, userId);
  const reminders = mergeReminders({
    persisted: persistedReminders,
    checklistRemaining: checklistProgress.total - checklistProgress.completed,
  });

  const allStories = await Story.find({ destinationId: trip.destinationId, isPublished: true }).lean();
  const stories = STORY_GROUPS.map((g) => ({
    key: g.key,
    label: g.label,
    stories: allStories.filter((s) => s.category === g.category),
  }));

  const duringTrip = buildDuringTripSection({
    destinationName: destination.name,
    advice: destination.advice,
    malariaApplicable,
    malariaAbcd: destination.malaria?.abcd ?? null,
    malariaPlanDrugLabel: malariaPlan?.drug.label ?? null,
    malariaPlanFrequency: malariaPlan?.drug.frequency ?? null,
  });

  const afterTrip = buildAfterTripSection({ malariaApplicable });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const departureStart = new Date(trip.departureDate);
  departureStart.setHours(0, 0, 0, 0);

  return {
    trip: {
      id: String(trip._id),
      destinationId: String(trip.destinationId),
      departureDate: trip.departureDate,
      returnDate: trip.returnDate,
      tripType: trip.tripType,
      accommodationType: trip.accommodationType,
      activities: trip.activities,
      selectedAntimalarial: trip.selectedAntimalarial,
      vaccineStatus: trip.vaccineStatus,
      malariaPlanStatus: trip.malariaPlanStatus,
      malariaPlanConfirmedAt: trip.malariaPlanConfirmedAt,
      emergencyAcknowledged: trip.emergencyAcknowledged,
      daysUntilDeparture: daysBetween(today, departureStart),
      durationDays: daysBetween(trip.departureDate, trip.returnDate) + 1,
    },
    destination: {
      id: String(destination._id),
      name: destination.name,
      slug: destination.slug,
      region: destination.region,
      malariaRisk: destination.malariaRisk,
      vaccines: destination.vaccines,
      emergencyContacts: destination.emergencyContacts,
      sources: destination.sources,
    },
    readiness,
    checklist: {
      ...checklistProgress,
      template: checklistTemplate,
    },
    malariaPlan,
    malariaApplicable,
    drugRegimens: Object.values(DRUG_REGIMENS),
    timeline,
    reminders,
    stories,
    duringTrip,
    afterTrip,
  };
}
