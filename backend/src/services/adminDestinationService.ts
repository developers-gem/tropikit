import { Destination } from "../models/Destination";
import { AppError } from "../utils/AppError";

export async function listDestinationsForAdmin(search?: string) {
  const filter: Record<string, unknown> = {};
  if (search) {
    filter.$or = [
      { name: new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
      { slug: new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
    ];
  }
  return Destination.find(filter, {
    name: 1,
    slug: 1,
    region: 1,
    isActive: 1,
    reviewStatus: 1,
    lastReviewedAt: 1,
    contentVersion: 1,
    "malariaRisk.level": 1,
  })
    .sort({ name: 1 })
    .lean();
}

export async function getDestinationForAdmin(id: string) {
  const destination = await Destination.findById(id).lean();
  if (!destination) throw AppError.notFound("Destination not found");
  return destination;
}

/**
 * Structured content update — every field here is one of the destination's existing typed
 * fields (advice, vaccines, malaria ABCD, emergency contacts, sources). This is intentionally
 * NOT a free-form "edit this document" endpoint and accepts no arbitrary prose-generation
 * input; an admin/editor supplies the same structured shapes the rest of the app already
 * reads, and Zod validates every one of them before this function is ever called.
 */
export interface UpdateDestinationContentInput {
  advice?: string[];
  vaccines?: {
    name: string;
    status: string;
    note: string;
    regionSpecific: boolean;
    region: string | null;
  }[];
  malaria?: {
    abcd: {
      awareness: string;
      bitePrevention: string;
      chemoprophylaxis: string;
      diagnosis: string;
    };
  } | null;
  emergencyContacts?: {
    label: string;
    number: string;
    category: string;
    source: string | null;
    lastVerifiedAt: string | null;
  }[];
  sources?: {
    publisher: string;
    title: string;
    url: string;
    contentType?: string;
    sourceType?: string;
    needsReview: boolean;
    lastReviewedAt: string | null;
  }[];
}

export async function updateDestinationContent(
  id: string,
  updates: UpdateDestinationContentInput,
) {
  const destination = await Destination.findById(id);
  if (!destination) throw AppError.notFound("Destination not found");

  if (updates.advice !== undefined) destination.advice = updates.advice;
  if (updates.vaccines !== undefined) destination.vaccines = updates.vaccines as never;
  if (updates.malaria !== undefined) destination.malaria = updates.malaria as never;
  if (updates.emergencyContacts !== undefined) {
    destination.emergencyContacts = updates.emergencyContacts as never;
  }
  if (updates.sources !== undefined) destination.sources = updates.sources as never;

  // Any substantive content edit bumps the version and reopens review — content that was
  // "reviewed" or "published" against the OLD text shouldn't silently keep that status
  // against changed text.
  destination.contentVersion += 1;
  if (destination.reviewStatus === "reviewed" || destination.reviewStatus === "published") {
    destination.reviewStatus = "needs-review";
  }

  await destination.save();
  return destination.toObject();
}

export async function setDestinationActive(id: string, isActive: boolean) {
  const destination = await Destination.findByIdAndUpdate(id, { $set: { isActive } }, { new: true });
  if (!destination) throw AppError.notFound("Destination not found");
  return destination.toObject();
}

export interface UpdateReviewStatusInput {
  reviewStatus: "draft" | "needs-review" | "reviewed" | "published";
}

export async function updateDestinationReviewStatus(
  id: string,
  input: UpdateReviewStatusInput,
  reviewerId: string,
) {
  const destination = await Destination.findById(id);
  if (!destination) throw AppError.notFound("Destination not found");

  destination.reviewStatus = input.reviewStatus;
  if (input.reviewStatus === "reviewed" || input.reviewStatus === "published") {
    destination.lastReviewedAt = new Date();
    destination.reviewedBy = reviewerId as never;
  }

  await destination.save();
  return destination.toObject();
}
