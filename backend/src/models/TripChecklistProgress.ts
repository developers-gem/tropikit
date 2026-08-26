import { Schema, model, type InferSchemaType } from "mongoose";

const TripChecklistProgressSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tripId: { type: Schema.Types.ObjectId, ref: "Trip", required: true, index: true },
    // key format: "<category>::<item>" — matches the frontend's item identity scheme
    checkedItemKeys: { type: [String], default: [] },
  },
  { timestamps: true },
);

TripChecklistProgressSchema.index({ userId: 1, tripId: 1 }, { unique: true });

export type TripChecklistProgressDoc = InferSchemaType<typeof TripChecklistProgressSchema>;
export const TripChecklistProgress = model(
  "TripChecklistProgress",
  TripChecklistProgressSchema,
);
