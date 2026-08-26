import { Schema, model, type InferSchemaType } from "mongoose";

const SourceSchema = new Schema(
  {
    publisher: { type: String, required: true },
    title: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: false },
);

/**
 * A malaria plan belongs to exactly one trip (enforced by the unique index below).
 *
 * DESIGN NOTE on what's persisted vs. computed: `medication` and `timezone` are the two real
 * user choices, so those are stored. `medicationStartDate`, `finalDoseDate`, and
 * `totalDoseDays` are NOT stored — they're recomputed on every read from the trip's current
 * departure/return dates via the same source-backed regimen table in malariaService.ts. This
 * is deliberate: if a stored plan's dates were a frozen snapshot, editing a trip's departure
 * date after creating a malaria plan would leave the plan silently showing stale, wrong dates.
 * Computing fresh on every read means the plan can never drift out of sync with the trip it
 * belongs to. The API response still contains every field your spec lists — they're just not
 * all separate database columns.
 */
const MalariaPlanSchema = new Schema(
  {
    tripId: { type: Schema.Types.ObjectId, ref: "Trip", required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    destinationId: { type: Schema.Types.ObjectId, ref: "Destination", required: true },
    medication: {
      type: String,
      enum: ["atovaquone-proguanil", "doxycycline", "mefloquine", "chloroquine"],
      required: true,
    },
    timezone: { type: String, required: true, default: "UTC" },
    sources: { type: [SourceSchema], default: [] },
  },
  { timestamps: true },
);

export type MalariaPlanDoc = InferSchemaType<typeof MalariaPlanSchema>;
export const MalariaPlan = model("MalariaPlan", MalariaPlanSchema);
