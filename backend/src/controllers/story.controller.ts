import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { AppError } from "../utils/AppError";
import { Story } from "../models/Story";

export const getStories = asyncHandler(async (req: Request, res: Response) => {
  const { destinationSlug } = req.query as { destinationSlug?: string };
  const filter: Record<string, unknown> = { isPublished: true };

  if (destinationSlug) {
    const { Destination } = await import("../models/Destination");
    const destination = await Destination.findOne({ slug: destinationSlug }).lean();
    if (!destination) return sendSuccess(res, []);
    filter.destinationId = destination._id;
  }

  const stories = await Story.find(filter)
    .populate("destinationId", "name slug")
    .sort({ createdAt: -1 })
    .lean();
  sendSuccess(res, stories);
});

export const getStoryById = asyncHandler(async (req: Request, res: Response) => {
  const story = await Story.findOne({ _id: req.params.id, isPublished: true })
    .populate("destinationId", "name slug")
    .lean();
  if (!story) throw AppError.notFound("Story not found");
  sendSuccess(res, story);
});
