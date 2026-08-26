import { Destination } from "../models/Destination";
import { AppError } from "../utils/AppError";

export interface DestinationListQuery {
  search?: string;
  region?: string;
  malariaRisk?: string;
}

export async function listDestinations(query: DestinationListQuery) {
  const filter: Record<string, unknown> = { isActive: true };

  if (query.region) {
    filter.region = new RegExp(`^${escapeRegex(query.region)}$`, "i");
  }
  if (query.malariaRisk) {
    filter["malariaRisk.level"] = query.malariaRisk;
  }
  if (query.search) {
    // Deliberately substring regex, not the schema's unused text index — the frontend
    // does live search-as-you-type (see DestinationsPage.tsx), which needs partial/prefix
    // matching ("Bra" -> "Brazil"). MongoDB $text search only matches whole stemmed words
    // and would silently break that UX, so regex is the correct choice here despite the
    // index existing. See Destination.ts for the corresponding index removal.
    filter.$or = [
      { name: new RegExp(escapeRegex(query.search), "i") },
      { region: new RegExp(escapeRegex(query.search), "i") },
    ];
  }

  return Destination.find(filter).sort({ name: 1 }).lean();
}

export async function getDestinationBySlug(slug: string) {
  const destination = await Destination.findOne({ slug, isActive: true }).lean();
  if (!destination) throw AppError.notFound(`Destination not found: ${slug}`);
  return destination;
}

export async function getDestinationById(id: string) {
  const destination = await Destination.findById(id).lean();
  if (!destination) throw AppError.notFound("Destination not found");
  return destination;
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
