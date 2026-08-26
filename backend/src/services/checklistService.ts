import { TripChecklistProgress } from "../models/TripChecklistProgress";
import { Trip } from "../models/Trip";
import { AppError } from "../utils/AppError";
import checklistTemplate from "../seed/data/checklist.json";
import personalizationRules from "../seed/data/checklistPersonalizationRules.json";

export interface ChecklistGroup {
  category: string;
  items: string[];
}

interface PersonalizationRule {
  id: string;
  category: string;
  triggers: { tripTypes: string[]; activities: string[] };
  items: string[];
}

export function getChecklistTemplate(): ChecklistGroup[] {
  return checklistTemplate as ChecklistGroup[];
}

function totalItemCount(template: ChecklistGroup[]): number {
  return template.reduce((n, group) => n + group.items.length, 0);
}

/**
 * Additional checklist categories based on the trip's own type/activities — e.g. Safari,
 * Jungle travel, Beach. These are NOT generated or invented per trip; they come from a fixed,
 * reviewed rules file (checklistPersonalizationRules.json), matching the exact three example
 * categories in the product spec. A trip can match more than one rule (e.g. "Safari" trip type
 * plus "Jungle travel" activity both add their own category) — each matched rule contributes
 * its own category so items are never silently merged into the base list.
 */
export function getPersonalizedAdditions(trip: {
  tripType?: string | null;
  activities?: string[] | null;
}): ChecklistGroup[] {
  const rules = personalizationRules as PersonalizationRule[];
  const activities = trip.activities ?? [];
  const tripType = trip.tripType ?? "";

  return rules
    .filter(
      (rule) =>
        (tripType && rule.triggers.tripTypes.includes(tripType)) ||
        activities.some((a) => rule.triggers.activities.includes(a)),
    )
    .map((rule) => ({ category: rule.category, items: rule.items }));
}

/**
 * The full template for a specific trip: the base 23-item checklist, unchanged and always
 * present, plus any personalized categories that apply. The base checklist is never modified
 * or removed — personalization only ever adds new categories alongside it.
 */
export function getPersonalizedChecklistTemplate(trip: {
  tripType?: string | null;
  activities?: string[] | null;
}): ChecklistGroup[] {
  return [...getChecklistTemplate(), ...getPersonalizedAdditions(trip)];
}

async function getOwnedTrip(tripId: string, userId: string) {
  const trip = await Trip.findById(tripId);
  if (!trip) throw AppError.notFound("Trip not found");
  if (String(trip.userId) !== String(userId)) throw AppError.forbidden();
  return trip;
}

export async function getTripChecklistTemplate(tripId: string, userId: string) {
  const trip = await getOwnedTrip(tripId, userId);
  return getPersonalizedChecklistTemplate(trip);
}

export async function getTripChecklistProgress(tripId: string, userId: string) {
  const trip = await getOwnedTrip(tripId, userId);
  const template = getPersonalizedChecklistTemplate(trip);
  const progress = await TripChecklistProgress.findOne({ tripId, userId }).lean();
  const checkedItemKeys = progress?.checkedItemKeys ?? [];
  return {
    checkedItemKeys,
    total: totalItemCount(template),
    completed: checkedItemKeys.length,
  };
}

/**
 * Replaces the full set of checked item keys for a trip (client sends full state on save,
 * matching the frontend's local checklist behavior — simplest, avoids partial-update races
 * across devices for last-write-wins semantics).
 *
 * Valid keys are computed against THIS TRIP'S personalized template, not just the base
 * checklist — otherwise a checked personalized item (e.g. a Safari-specific task) would be
 * silently discarded on save, which would be a real, confusing bug for exactly the
 * personalization feature this phase adds.
 */
export async function setTripChecklistProgress(
  tripId: string,
  userId: string,
  checkedItemKeys: string[],
) {
  const trip = await getOwnedTrip(tripId, userId);
  const template = getPersonalizedChecklistTemplate(trip);

  const validKeys = new Set(
    template.flatMap((g) => g.items.map((item) => `${g.category}::${item}`)),
  );
  const filtered = checkedItemKeys.filter((k) => validKeys.has(k));

  const updated = await TripChecklistProgress.findOneAndUpdate(
    { tripId, userId },
    { $set: { checkedItemKeys: filtered } },
    { upsert: true, new: true },
  ).lean();

  return {
    checkedItemKeys: updated?.checkedItemKeys ?? [],
    total: totalItemCount(template),
    completed: filtered.length,
  };
}
