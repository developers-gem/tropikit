import { Schema, model, type InferSchemaType } from "mongoose";

const StorySourceSchema = new Schema(
  {
    publisher: { type: String, required: true },
    title: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: false },
);

/**
 * Provider-independent audio reference. The UI only ever sees a URL + metadata — it never
 * knows or cares whether that URL points at S3, a CDN, an external host, or nothing yet.
 * Swapping storage providers later means changing what populates `url`, not touching any
 * frontend code or the shape of this schema.
 */
const AudioAssetSchema = new Schema(
  {
    url: { type: String, default: null },
    provider: {
      type: String,
      enum: ["none", "external", "object-storage", "cdn"],
      default: "none",
    },
    mimeType: { type: String, default: null },
    durationSeconds: { type: Number, default: null },
    fileSizeBytes: { type: Number, default: null },
  },
  { _id: false },
);

/**
 * Content lifecycle, independent of `isPublished` (visibility) and `reviewedAt` (clinical
 * review sign-off). A story can be "published" (visible in the app) while still having
 * `reviewedAt: null` — that combination is the honest state of every story in this system
 * today: written from the destination's own already-cited advice/vaccines/malaria content,
 * visible to users, but not yet formally signed off by a qualified reviewer. Do not set
 * `reviewedAt` except when a real review has actually happened.
 */
const STORY_STATUSES = ["draft", "in-review", "reviewed", "published"] as const;

const StorySchema = new Schema(
  {
    destinationId: { type: Schema.Types.ObjectId, ref: "Destination", required: true, index: true },
    category: {
      type: String,
      enum: [
        "before-you-go",
        "arrival",
        "mosquito",
        "food-water",
        "safety",
        "emergency",
        "return-home",
      ],
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    transcript: { type: String, required: true },
    audio: { type: AudioAssetSchema, default: () => ({}) },
    sources: { type: [StorySourceSchema], default: [] },
    status: { type: String, enum: STORY_STATUSES, default: "draft" },
    isPublished: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

StorySchema.index({ destinationId: 1, category: 1, isPublished: 1 });

export type StoryDoc = InferSchemaType<typeof StorySchema>;
export const Story = model("Story", StorySchema);
