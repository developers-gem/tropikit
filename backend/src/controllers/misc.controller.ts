import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import globalEmergency from "../seed/data/globalEmergency.json";
import { Destination } from "../models/Destination";

export const getGlobalEmergencyContacts = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, globalEmergency);
});

/** All sources across all destinations, flattened and de-duplicated by URL — mainly useful
 *  for a future admin review pass over the `needsReview` flagged links. */
export const getSources = asyncHandler(async (_req: Request, res: Response) => {
  const destinations = await Destination.find({}, { name: 1, slug: 1, sources: 1 }).lean();
  const flattened = destinations.flatMap((d) =>
    d.sources.map((s) => ({ ...s, destinationName: d.name, destinationSlug: d.slug })),
  );
  sendSuccess(res, flattened);
});
