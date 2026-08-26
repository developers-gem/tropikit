import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectId = z.string().regex(objectIdRegex, "Invalid identifier");

// These lists match the spec exactly. "Other" is included in each so a trip that doesn't
// fit the preset options is still representable without falling back to a free-text field
// (which would reopen the door to arbitrary/unvalidated input on the server).
export const TRIP_TYPES = [
  "Leisure",
  "Business",
  "Backpacking",
  "Adventure",
  "Safari",
  "Beach",
  "Family",
  "Other",
] as const;

export const ACCOMMODATION_TYPES = [
  "Hotel",
  "Resort",
  "Hostel",
  "Camping",
  "Rural",
  "Jungle lodge",
  "Other",
] as const;

export const ACTIVITY_TYPES = [
  "Hiking",
  "Safari",
  "Jungle travel",
  "Diving",
  "Swimming",
  "Rural travel",
  "Animal exposure",
  "Other",
] as const;

export const createTripSchema = z.object({
  destinationId: objectId,
  departureDate: z.coerce.date(),
  returnDate: z.coerce.date(),
  tripType: z.enum(TRIP_TYPES).optional(),
  accommodationType: z.enum(ACCOMMODATION_TYPES).optional(),
  // Deliberately no "unnecessary sensitive medical information" here per the brief — this is
  // exposure/context for the checklist and malaria guidance, not a health questionnaire.
  activities: z.array(z.enum(ACTIVITY_TYPES)).max(20).optional(),
  selectedAntimalarial: z
    .enum(["atovaquone-proguanil", "doxycycline", "mefloquine", "chloroquine"])
    .optional(),
});

export const updateTripSchema = createTripSchema.partial();

// Preparation status updates are a separate, smaller surface from the main trip-edit form —
// validated separately so a client can update "I reviewed my vaccines" without needing to
// resend the whole trip payload. malariaPlanConfirmedAt is intentionally NOT accepted here;
// the service sets it itself when malariaPlanStatus transitions to "confirmed".
export const updateTripPreparationSchema = z
  .object({
    vaccineStatus: z.enum(["not-reviewed", "in-progress", "reviewed"]),
    malariaPlanStatus: z.enum(["not-planned", "planned", "confirmed"]),
    emergencyAcknowledged: z.boolean(),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, "At least one field must be provided");

export const tripIdParamSchema = z.object({
  id: objectId,
});

export const checklistUpdateSchema = z.object({
  checkedItemKeys: z.array(z.string()).max(200),
});
