import { Destination } from "../models/Destination";

export interface SourceRow {
  destinationName: string;
  destinationSlug: string;
  publisher: string;
  title: string;
  url: string;
  sourceType?: string;
  contentType?: string | null;
  needsReview: boolean;
  lastReviewedAt: Date | null;
}

export interface SourceWarning {
  destinationName: string;
  destinationSlug: string;
  reason: string;
}

/**
 * Flattens every destination's sources into one admin-reviewable list, plus explicit
 * warnings for destinations that have NO sources at all for content that needs one — this is
 * a structural warning (a gap the admin should fill), not a claim about whether existing
 * sources are individually correct.
 */
export async function listSourcesForAdmin() {
  const destinations = await Destination.find(
    {},
    { name: 1, slug: 1, sources: 1, malariaRisk: 1 },
  ).lean();

  const sources: SourceRow[] = [];
  const warnings: SourceWarning[] = [];

  for (const d of destinations) {
    if (d.sources.length === 0) {
      warnings.push({
        destinationName: d.name,
        destinationSlug: d.slug,
        reason: "No sources recorded for this destination at all.",
      });
      continue;
    }

    if (d.malariaRisk?.level && d.malariaRisk.level !== "none") {
      const hasMalariaSource = d.sources.some((s) => s.contentType === "malaria");
      if (!hasMalariaSource) {
        warnings.push({
          destinationName: d.name,
          destinationSlug: d.slug,
          reason: "Destination carries malaria risk but has no source tagged as malaria content.",
        });
      }
    }

    for (const s of d.sources) {
      sources.push({
        destinationName: d.name,
        destinationSlug: d.slug,
        publisher: s.publisher,
        title: s.title,
        url: s.url,
        sourceType: s.sourceType,
        contentType: s.contentType,
        needsReview: s.needsReview ?? false,
        lastReviewedAt: s.lastReviewedAt ?? null,
      });
    }
  }

  return { sources, warnings };
}
