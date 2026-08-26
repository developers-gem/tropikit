import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectId = z.string().regex(objectIdRegex, "Invalid identifier");

export const adminIdParamSchema = z.object({ id: objectId });

export const listDestinationsQuerySchema = z.object({
  search: z.string().max(100).optional(),
});

const vaccineStatusEnum = z.enum([
  "required",
  "recommended",
  "conditional",
  "consider",
  "not-routinely-recommended",
  "not-classified",
]);

const vaccineSchema = z.object({
  name: z.string().min(1).max(200),
  status: vaccineStatusEnum,
  note: z.string().max(500),
  regionSpecific: z.boolean(),
  region: z.string().max(100).nullable(),
});

const malariaAbcdSchema = z.object({
  awareness: z.string().min(1).max(1000),
  bitePrevention: z.string().min(1).max(1000),
  chemoprophylaxis: z.string().min(1).max(1000),
  diagnosis: z.string().min(1).max(1000),
});

const emergencyCategoryEnum = z.enum([
  "police",
  "ambulance",
  "fire",
  "embassy",
  "insurance",
  "assistance-provider",
  "health-authority",
  "travel-health-source",
  "other",
]);

const emergencyContactSchema = z.object({
  label: z.string().min(1).max(200),
  number: z.string().min(1).max(100),
  category: emergencyCategoryEnum,
  source: z.string().max(500).nullable(),
  lastVerifiedAt: z.string().nullable(),
});

const sourceTypeEnum = z.enum(["cdc", "who", "travelhealthpro", "government", "other"]);

const sourceSchema = z.object({
  publisher: z.string().min(1).max(200),
  title: z.string().min(1).max(300),
  // Sources are structured data an admin curates, not free text a model invents — the URL
  // format itself is validated, but this endpoint never generates a URL on the admin's behalf.
  url: z.string().url().max(1000),
  contentType: z.string().max(100).optional(),
  sourceType: sourceTypeEnum.optional(),
  needsReview: z.boolean(),
  lastReviewedAt: z.string().nullable(),
});

export const updateDestinationContentSchema = z
  .object({
    advice: z.array(z.string().min(1).max(500)).max(50),
    vaccines: z.array(vaccineSchema).max(50),
    malaria: z.object({ abcd: malariaAbcdSchema }).nullable(),
    emergencyContacts: z.array(emergencyContactSchema).max(50),
    sources: z.array(sourceSchema).max(50),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, "At least one field must be provided");

export const setActiveSchema = z.object({
  isActive: z.boolean(),
});

const reviewStatusEnum = z.enum(["draft", "needs-review", "reviewed", "published"]);

export const updateDestinationReviewSchema = z.object({
  reviewStatus: reviewStatusEnum,
});

const storyCategoryEnum = z.enum([
  "before-you-go",
  "arrival",
  "mosquito",
  "food-water",
  "safety",
  "emergency",
  "return-home",
]);

const audioAssetInputSchema = z.object({
  url: z.string().url().nullable(),
  provider: z.enum(["none", "external", "object-storage", "cdn"]),
  mimeType: z.string().max(100).nullable(),
  durationSeconds: z.number().positive().nullable(),
  fileSizeBytes: z.number().positive().nullable(),
});

const storySourceSchema = z.object({
  publisher: z.string().min(1).max(200),
  title: z.string().min(1).max(300),
  url: z.string().url().max(1000),
});

export const createStorySchema = z.object({
  destinationId: objectId,
  category: storyCategoryEnum,
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(500),
  transcript: z.string().min(1).max(20000),
  audio: audioAssetInputSchema.optional(),
  sources: z.array(storySourceSchema).max(20),
});

export const updateStorySchema = z
  .object({
    category: storyCategoryEnum,
    title: z.string().min(1).max(200),
    description: z.string().min(1).max(500),
    transcript: z.string().min(1).max(20000),
    audio: audioAssetInputSchema,
    sources: z.array(storySourceSchema).max(20),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, "At least one field must be provided");

export const setStoryPublishedSchema = z.object({
  isPublished: z.boolean(),
});

const storyStatusEnum = z.enum(["draft", "in-review", "reviewed", "published"]);

export const updateStoryReviewSchema = z.object({
  status: storyStatusEnum,
});
