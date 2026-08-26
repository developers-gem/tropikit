import { Schema, model, type InferSchemaType } from "mongoose";

/**
 * Vaccine recommendation strength, replacing a plain required:boolean per the medical-content
 * architecture review. Every status here was derived from language already present in the
 * existing (unverified, needsReview-flagged) note text via a documented, deterministic
 * migration — see backend/scripts/migrate-medical-content.js and the accompanying report.
 * Nothing here reflects new clinical judgment; it makes existing language structurally
 * queryable rather than collapsing it into a single boolean.
 */
const VACCINE_STATUSES = [
  "required",
  "recommended",
  "conditional",
  "consider",
  "not-routinely-recommended",
  "not-classified",
] as const;

const VaccineSchema = new Schema(
  {
    name: { type: String, required: true },
    status: { type: String, enum: VACCINE_STATUSES, required: true, default: "not-classified" },
    note: { type: String, default: "" },
    // True when the note names a specific sub-national area (e.g. "Amazon basin") rather than
    // applying to the whole country — `region` carries that name verbatim from the source note.
    regionSpecific: { type: Boolean, default: false },
    region: { type: String, default: null },
  },
  { _id: false },
);

const EMERGENCY_CATEGORIES = [
  "police",
  "ambulance",
  "fire",
  "embassy",
  "insurance",
  "assistance-provider",
  "health-authority",
  "travel-health-source",
  "other",
] as const;

const EmergencyContactSchema = new Schema(
  {
    label: { type: String, required: true },
    number: { type: String, required: true },
    category: { type: String, enum: EMERGENCY_CATEGORIES, default: "other" },
    source: { type: String, default: null },
    // Per project policy: only display verified information. This is null for every
    // contact migrated so far because no live verification pass has been performed against
    // an authoritative source — it is not defaulted to "now" or any other value that would
    // imply a verification that hasn't actually happened. See the migration report.
    lastVerifiedAt: { type: Date, default: null },
  },
  { _id: false },
);

const SOURCE_TYPES = ["cdc", "who", "travelhealthpro", "government", "other"] as const;

const SourceSchema = new Schema(
  {
    publisher: { type: String, required: true },
    title: { type: String, required: true },
    url: { type: String, required: true },
    contentType: { type: String },
    sourceType: { type: String, enum: SOURCE_TYPES, default: "other" },
    // True when this URL was generated programmatically during migration and has not
    // yet been manually confirmed to resolve for this specific destination.
    // Per project policy, sources are never fabricated — this flag makes unverified
    // links visible rather than silently trusting them.
    needsReview: { type: Boolean, default: true },
    lastReviewedAt: { type: Date, default: null },
  },
  { _id: false },
);

const MalariaAbcdSchema = new Schema(
  {
    awareness: { type: String, required: true },
    bitePrevention: { type: String, required: true },
    chemoprophylaxis: { type: String, required: true },
    diagnosis: { type: String, required: true },
  },
  { _id: false },
);

const REVIEW_STATUSES = ["draft", "needs-review", "reviewed", "published"] as const;

const DestinationSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    region: { type: String, required: true, index: true },

    malariaRisk: {
      // Country-level classification — UNCHANGED from before this migration. This is not
      // replaced by the regional structure below; it remains the authoritative top-line
      // figure, with the regional fields adding context underneath it, per the
      // Country -> Region -> Risk -> Guidance architecture requested. Collapsing a country
      // to one level where sources describe real regional difference is a known, flagged
      // limitation (see the migration report) — the fix here is additive context, not a
      // fabricated set of independently-verified per-region levels.
      level: {
        type: String,
        enum: ["high", "moderate", "low", "none"],
        required: true,
        index: true,
      },
      description: { type: String },
      // true: existing advice text names a specific sub-national area or altitude/seasonal
      //   concentration (e.g. "mainly in the Amazon basin", "below 2,500m").
      // false: existing advice text explicitly describes uniform/countrywide risk.
      // null: no malaria-specific advice text exists in current source data — genuinely
      //   unknown, not defaulted to false.
      hasSubnationalVariation: { type: Boolean, default: null },
      // The exact existing advice sentence(s) this classification was derived from —
      // kept alongside the classification so it's always auditable against its source text.
      regionalSourceText: { type: String, default: null },
      // Named sub-areas detected verbatim in that source text (e.g. ["Amazon", "Pantanal"]).
      // Carries NO independent risk level per name — see class comment above.
      namedRegions: { type: [String], default: [] },
    },

    advice: { type: [String], default: [] },
    vaccines: { type: [VaccineSchema], default: [] },
    malaria: { type: { abcd: MalariaAbcdSchema }, default: null },
    emergencyContacts: { type: [EmergencyContactSchema], default: [] },
    sources: { type: [SourceSchema], default: [] },

    isActive: { type: Boolean, default: true, index: true },

    // Content review workflow, additive to (not replacing) the existing per-source
    // needsReview/lastReviewedAt fields — this is the destination-level equivalent.
    reviewStatus: { type: String, enum: REVIEW_STATUSES, default: "needs-review" },
    lastReviewedAt: { type: Date, default: null },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    // Incremented whenever medical content on this destination is substantively changed —
    // lets a future admin view show "this content changed since it was last reviewed."
    contentVersion: { type: Number, default: 1 },
  },
  { timestamps: true },
);

// Note: no text index on name/region. Search is live substring/prefix matching as the
// user types (see destinationService.ts), which MongoDB's $text index does not support
// (it matches whole stemmed words only). A previous version declared an unused $text
// index here that didn't match the actual query pattern — removed rather than kept as
// dead weight on every write. If search performance becomes a real issue at a much larger
// destination count, consider a dedicated prefix index or a search service instead of
// reintroducing $text.

export type DestinationDoc = InferSchemaType<typeof DestinationSchema>;
export const Destination = model("Destination", DestinationSchema);
