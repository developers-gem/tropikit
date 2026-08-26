import { Reminder } from "../models/Reminder";
import { Trip } from "../models/Trip";
import { MalariaPlan } from "../models/MalariaPlan";
import { AppError } from "../utils/AppError";
import { calculateMalariaPlan, type DrugKey } from "./malariaService";

const TIMELINE_FRAMEWORK: {
  weeksBefore: number;
  label: string;
  type: "consultation" | "travel-preparation" | "checklist";
}[] = [
  { weeksBefore: 8, label: "Health consultation", type: "consultation" },
  { weeksBefore: 6, label: "Review vaccines", type: "travel-preparation" },
  { weeksBefore: 4, label: "Prepare medical kit", type: "travel-preparation" },
  { weeksBefore: 2, label: "Confirm medication", type: "travel-preparation" },
  { weeksBefore: 1, label: "Complete checklist", type: "checklist" },
  { weeksBefore: 0, label: "Final preparation", type: "travel-preparation" },
];

function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

async function findOwnedTrip(tripId: string, userId: string) {
  const trip = await Trip.findById(tripId);
  if (!trip) throw AppError.notFound("Trip not found");
  if (String(trip.userId) !== String(userId)) throw AppError.forbidden();
  return trip;
}

/**
 * Regenerates every auto-derived reminder for a trip from its current state (dates + malaria
 * plan, if any). Safe to call as often as needed — always replaces the previous auto-derived
 * set rather than accumulating duplicates or drifting out of sync after a trip date edit.
 * Manually-created reminders (source: "manual", not created by anything yet but reserved for
 * future use) are deliberately left untouched.
 */
export async function syncTripReminders(tripId: string, userId: string): Promise<void> {
  const trip = await findOwnedTrip(tripId, userId);

  await Reminder.deleteMany({ tripId, source: { $in: ["timeline", "malaria-plan"] } });

  const docs: {
    tripId: string;
    userId: string;
    type: string;
    label: string;
    scheduledFor: Date;
    timezone: string;
    source: string;
  }[] = [];

  const timezone = "UTC"; // default for timeline reminders; malaria-plan reminders use the plan's own timezone

  for (const step of TIMELINE_FRAMEWORK) {
    docs.push({
      tripId,
      userId,
      type: step.type,
      label: step.label,
      scheduledFor: addDays(trip.departureDate, -step.weeksBefore * 7),
      timezone,
      source: "timeline",
    });
  }

  const planDoc = await MalariaPlan.findOne({ tripId }).lean();
  if (planDoc) {
    const calculated = calculateMalariaPlan({
      drug: planDoc.medication as DrugKey,
      tripStart: trip.departureDate,
      tripEnd: trip.returnDate,
    });

    docs.push({
      tripId,
      userId,
      type: "medication",
      label: `Start antimalarial: ${calculated.drug.label}`,
      scheduledFor: calculated.beginMeds,
      timezone: planDoc.timezone,
      source: "malaria-plan",
    });
    docs.push({
      tripId,
      userId,
      type: "final-dose",
      label: `Final antimalarial dose: ${calculated.drug.label}`,
      scheduledFor: calculated.stopMeds,
      timezone: planDoc.timezone,
      source: "malaria-plan",
    });
    docs.push({
      tripId,
      userId,
      type: "bite-prevention",
      label: "Begin nightly bite-prevention routine",
      scheduledFor: trip.departureDate,
      timezone: planDoc.timezone,
      source: "malaria-plan",
    });
  }

  if (docs.length > 0) {
    await Reminder.insertMany(docs);
  }
}

export async function listUpcomingReminders(tripId: string, userId: string) {
  await findOwnedTrip(tripId, userId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Reminder.find({ tripId, scheduledFor: { $gte: today } })
    .sort({ scheduledFor: 1 })
    .lean();
}

export async function listAllReminders(tripId: string, userId: string) {
  await findOwnedTrip(tripId, userId);
  return Reminder.find({ tripId }).sort({ scheduledFor: 1 }).lean();
}
