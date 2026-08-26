import { Trip } from "../models/Trip";
import { Destination } from "../models/Destination";
import { MalariaPlan } from "../models/MalariaPlan";
import { AppError } from "../utils/AppError";

export interface CreateTripInput {
  userId: string;
  destinationId: string;
  departureDate: Date;
  returnDate: Date;
  tripType?: string;
  accommodationType?: string;
  activities?: string[];
  selectedAntimalarial?: string;
}

export interface UpdateTripPreparationInput {
  vaccineStatus?: "not-reviewed" | "in-progress" | "reviewed";
  malariaPlanStatus?: "not-planned" | "planned" | "confirmed";
  emergencyAcknowledged?: boolean;
}

export async function createTrip(input: CreateTripInput) {
  const destination = await Destination.findById(input.destinationId);
  if (!destination) throw AppError.notFound("Destination not found");

  return Trip.create(input);
}

export async function listTripsForUser(userId: string) {
  return Trip.find({ userId }).sort({ departureDate: 1 }).lean();
}

async function findOwnedTrip(tripId: string, userId: string) {
  const trip = await Trip.findById(tripId);
  if (!trip) throw AppError.notFound("Trip not found");
  // A user must never be able to access another user's trip by guessing/changing an ID.
  if (String(trip.userId) !== String(userId)) {
    throw AppError.forbidden();
  }
  return trip;
}

export async function getTripForUser(tripId: string, userId: string) {
  return findOwnedTrip(tripId, userId);
}

export async function updateTripForUser(
  tripId: string,
  userId: string,
  updates: Partial<CreateTripInput>,
) {
  const trip = await findOwnedTrip(tripId, userId);
  if (updates.destinationId) {
    const destination = await Destination.findById(updates.destinationId);
    if (!destination) throw AppError.notFound("Destination not found");
  }
  Object.assign(trip, updates);
  await trip.save();
  return trip;
}

/**
 * Updates only the dashboard preparation-status fields. Kept separate from the general
 * trip-edit path (updateTripForUser) so the dashboard's status toggles don't need to round
 * -trip the whole trip payload, and so malariaPlanConfirmedAt can be set authoritatively
 * server-side rather than trusting a client-supplied timestamp.
 */
export async function updateTripPreparationForUser(
  tripId: string,
  userId: string,
  updates: UpdateTripPreparationInput,
) {
  const trip = await findOwnedTrip(tripId, userId);

  if (updates.vaccineStatus !== undefined) {
    trip.vaccineStatus = updates.vaccineStatus;
  }
  if (updates.emergencyAcknowledged !== undefined) {
    trip.emergencyAcknowledged = updates.emergencyAcknowledged;
  }
  if (updates.malariaPlanStatus !== undefined) {
    if (updates.malariaPlanStatus === "confirmed") {
      const planExists = await MalariaPlan.exists({ tripId });
      if (!planExists) {
        throw AppError.validation(
          "Cannot confirm a malaria plan that doesn't exist yet — create one first.",
        );
      }
    }
    const wasConfirmed = trip.malariaPlanStatus === "confirmed";
    trip.malariaPlanStatus = updates.malariaPlanStatus;
    if (updates.malariaPlanStatus === "confirmed" && !wasConfirmed) {
      trip.malariaPlanConfirmedAt = new Date();
    } else if (updates.malariaPlanStatus !== "confirmed") {
      trip.malariaPlanConfirmedAt = null;
    }
  }

  await trip.save();
  return trip;
}

export async function deleteTripForUser(tripId: string, userId: string) {
  const trip = await findOwnedTrip(tripId, userId);
  await trip.deleteOne();
}
