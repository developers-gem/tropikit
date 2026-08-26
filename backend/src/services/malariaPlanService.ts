import { MalariaPlan } from "../models/MalariaPlan";
import { Trip } from "../models/Trip";
import { Destination } from "../models/Destination";
import { AppError } from "../utils/AppError";
import { calculateMalariaPlan, type DrugKey, type MalariaPlan as CalculatedPlan } from "./malariaService";
import { isValidTimezone } from "../utils/timezone";

export interface SavePlanInput {
  medication: DrugKey;
  timezone: string;
}

async function findOwnedTrip(tripId: string, userId: string) {
  const trip = await Trip.findById(tripId);
  if (!trip) throw AppError.notFound("Trip not found");
  if (String(trip.userId) !== String(userId)) throw AppError.forbidden();
  return trip;
}

export interface FullMalariaPlanResponse extends CalculatedPlan {
  id: string;
  tripId: string;
  destinationId: string;
  timezone: string;
  sources: { publisher: string; title: string; url: string }[];
  createdAt: Date;
  updatedAt: Date;
}

interface PlanDocLike {
  _id: unknown;
  tripId: unknown;
  destinationId: unknown;
  medication: string;
  timezone: string;
  sources: { publisher: string; title: string; url: string }[];
  createdAt: Date;
  updatedAt: Date;
}

async function hydrate(
  planDoc: PlanDocLike,
  trip: { departureDate: Date; returnDate: Date },
): Promise<FullMalariaPlanResponse> {
  const calculated = calculateMalariaPlan({
    drug: planDoc.medication as DrugKey,
    tripStart: trip.departureDate,
    tripEnd: trip.returnDate,
  });

  return {
    ...calculated,
    id: String(planDoc._id),
    tripId: String(planDoc.tripId),
    destinationId: String(planDoc.destinationId),
    timezone: planDoc.timezone,
    sources: planDoc.sources,
    createdAt: planDoc.createdAt,
    updatedAt: planDoc.updatedAt,
  };
}

export async function getMalariaPlanForTrip(
  tripId: string,
  userId: string,
): Promise<FullMalariaPlanResponse | null> {
  const trip = await findOwnedTrip(tripId, userId);
  const planDoc = await MalariaPlan.findOne({ tripId }).lean();
  if (!planDoc) return null;
  return hydrate(planDoc, trip);
}

async function malariaSourcesForDestination(destinationId: unknown) {
  const destination = await Destination.findById(destinationId).lean();
  if (!destination) return [];
  return destination.sources
    .filter((s) => s.contentType === "malaria")
    .map((s) => ({ publisher: s.publisher, title: s.title, url: s.url }));
}

export async function saveMalariaPlanForTrip(
  tripId: string,
  userId: string,
  input: SavePlanInput,
): Promise<FullMalariaPlanResponse> {
  const trip = await findOwnedTrip(tripId, userId);

  if (!isValidTimezone(input.timezone)) {
    throw AppError.validation(`Unrecognized timezone: ${input.timezone}`);
  }

  // Validate the medication actually produces a valid schedule for this trip's real dates
  // before persisting anything — never save a plan that can't be calculated.
  calculateMalariaPlan({
    drug: input.medication,
    tripStart: trip.departureDate,
    tripEnd: trip.returnDate,
  });

  const sources = await malariaSourcesForDestination(trip.destinationId);

  const planDoc = await MalariaPlan.findOneAndUpdate(
    { tripId },
    {
      $set: {
        tripId,
        userId,
        destinationId: trip.destinationId,
        medication: input.medication,
        timezone: input.timezone,
        sources,
      },
    },
    { upsert: true, new: true },
  ).lean();

  // Keep the trip's own status field honest: creating/updating a plan means it's at least
  // "planned". We deliberately do NOT auto-advance to "confirmed" here — that's an explicit
  // user action via the preparation endpoint, representing "I discussed this with a
  // clinician," which saving a medication choice alone does not mean.
  if (trip.malariaPlanStatus === "not-planned") {
    trip.malariaPlanStatus = "planned";
    await trip.save();
  }

  return hydrate(planDoc as PlanDocLike, trip);
}

export async function deleteMalariaPlanForTrip(tripId: string, userId: string): Promise<void> {
  const trip = await findOwnedTrip(tripId, userId);
  await MalariaPlan.deleteOne({ tripId });

  // A deleted plan can no longer be "planned" or "confirmed" — resetting this prevents the
  // dashboard from showing a status for a plan that no longer exists.
  trip.malariaPlanStatus = "not-planned";
  trip.malariaPlanConfirmedAt = null;
  await trip.save();
}
