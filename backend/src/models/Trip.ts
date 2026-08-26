import { Schema, model, Types, type InferSchemaType } from "mongoose";

const TripSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    destinationId: { type: Schema.Types.ObjectId, ref: "Destination", required: true },
    departureDate: { type: Date, required: true },
    returnDate: { type: Date, required: true },
    tripType: { type: String, default: "" },
    accommodationType: { type: String, default: "" },
    activities: { type: [String], default: [] },

    // Malaria drug choice already existed; the two fields below track *preparation status*
    // for the dashboard's readiness calculation, additive to existing trips (default to the
    // "nothing done yet" state so old trips read correctly with no migration needed).
    selectedAntimalarial: { type: String, default: "" },
    malariaPlanStatus: {
      type: String,
      enum: ["not-planned", "planned", "confirmed"],
      default: "not-planned",
    },
    // Set by the service layer when malariaPlanStatus transitions to "confirmed" — never
    // client-writable directly, to keep it an honest record of when confirmation happened.
    malariaPlanConfirmedAt: { type: Date, default: null },

    vaccineStatus: {
      type: String,
      enum: ["not-reviewed", "in-progress", "reviewed"],
      default: "not-reviewed",
    },

    emergencyAcknowledged: { type: Boolean, default: false },
  },
  { timestamps: true },
);

TripSchema.path("returnDate").validate(function (this: { departureDate: Date }, value: Date) {
  return value >= this.departureDate;
}, "returnDate must be on or after departureDate");

export type TripDoc = InferSchemaType<typeof TripSchema> & { _id: Types.ObjectId };
export const Trip = model("Trip", TripSchema);
