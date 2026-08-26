import { Schema, model, type InferSchemaType } from "mongoose";

export const REMINDER_TYPES = [
  "medication",
  "bite-prevention",
  "consultation",
  "checklist",
  "travel-preparation",
  "final-dose",
] as const;

/**
 * Reminders always belong to a trip. Most are auto-generated (and re-generated whenever the
 * trip's dates or malaria plan change — see reminderService.syncTripReminders) rather than
 * hand-created, so `source` distinguishes an auto-derived reminder from one a user might add
 * directly in the future, without needing a separate table.
 */
const ReminderSchema = new Schema(
  {
    tripId: { type: Schema.Types.ObjectId, ref: "Trip", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: REMINDER_TYPES, required: true },
    label: { type: String, required: true },
    scheduledFor: { type: Date, required: true },
    timezone: { type: String, required: true, default: "UTC" },
    source: { type: String, enum: ["malaria-plan", "timeline", "manual"], default: "timeline" },
  },
  { timestamps: true },
);

ReminderSchema.index({ tripId: 1, scheduledFor: 1 });

export type ReminderDoc = InferSchemaType<typeof ReminderSchema>;
export const Reminder = model("Reminder", ReminderSchema);
