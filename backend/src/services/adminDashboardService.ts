import { Destination } from "../models/Destination";
import { Story } from "../models/Story";

/**
 * Every number here is a direct count from the database — nothing is estimated, sampled, or
 * fabricated. "Content requiring review" and "source warnings" reuse the exact same
 * reviewStatus/needsReview fields already established in the medical-content architecture
 * phase, not a new parallel notion of "needs attention."
 */
export async function getAdminDashboardStats() {
  const [
    destinationCount,
    storyCount,
    unpublishedStoryCount,
    destinationsNeedingReview,
    destinationsWithSourceWarnings,
    recentDestinationUpdates,
    recentStoryUpdates,
  ] = await Promise.all([
    Destination.countDocuments({}),
    Story.countDocuments({}),
    Story.countDocuments({ isPublished: false }),
    Destination.countDocuments({ reviewStatus: { $in: ["draft", "needs-review"] } }),
    Destination.countDocuments({ "sources.needsReview": true }),
    Destination.find({}, { name: 1, slug: 1, updatedAt: 1, reviewStatus: 1 })
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean(),
    Story.find({}, { title: 1, updatedAt: 1, isPublished: 1, status: 1 })
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean(),
  ]);

  const recentUpdates = [
    ...recentDestinationUpdates.map((d) => ({
      type: "destination" as const,
      id: String(d._id),
      label: d.name,
      slug: d.slug,
      updatedAt: d.updatedAt,
      status: d.reviewStatus,
    })),
    ...recentStoryUpdates.map((s) => ({
      type: "story" as const,
      id: String(s._id),
      label: s.title,
      updatedAt: s.updatedAt,
      status: s.status,
    })),
  ]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 8);

  return {
    destinationCount,
    storyCount,
    unpublishedStoryCount,
    destinationsNeedingReview,
    destinationsWithSourceWarnings,
    recentUpdates,
  };
}
