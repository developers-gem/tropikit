import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import * as destinationService from "../services/destinationService";
import { calculateMalariaPlan, listDrugRegimens } from "../services/malariaService";
import { Story } from "../models/Story";

export const getDestinations = asyncHandler(async (req: Request, res: Response) => {
  const { search, region, malariaRisk } = req.query as Record<string, string | undefined>;
  const destinations = await destinationService.listDestinations({ search, region, malariaRisk });
  sendSuccess(res, destinations);
});

export const getDestinationBySlug = asyncHandler(async (req: Request, res: Response) => {
  const destination = await destinationService.getDestinationBySlug(req.params.slug);
  sendSuccess(res, destination);
});

export const getDestinationAdvice = asyncHandler(async (req: Request, res: Response) => {
  const destination = await destinationService.getDestinationBySlug(req.params.slug);
  sendSuccess(res, { advice: destination.advice });
});

export const getDestinationVaccines = asyncHandler(async (req: Request, res: Response) => {
  const destination = await destinationService.getDestinationBySlug(req.params.slug);
  sendSuccess(res, { vaccines: destination.vaccines, sources: destination.sources });
});

export const getDestinationMalaria = asyncHandler(async (req: Request, res: Response) => {
  const destination = await destinationService.getDestinationBySlug(req.params.slug);
  sendSuccess(res, {
    malariaRisk: destination.malariaRisk,
    malaria: destination.malaria,
    sources: destination.sources,
    drugRegimens: listDrugRegimens(),
  });
});

export const getDestinationEmergency = asyncHandler(async (req: Request, res: Response) => {
  const destination = await destinationService.getDestinationBySlug(req.params.slug);
  sendSuccess(res, { emergencyContacts: destination.emergencyContacts });
});

/**
 * "Your Tropikit Story" for this destination. Returns an empty array (never a 404) when no
 * published story exists yet — the frontend renders this as "Story coming soon," not an
 * error and never fabricated content, per the storytelling architecture requirement.
 */
export const getDestinationStories = asyncHandler(async (req: Request, res: Response) => {
  const destination = await destinationService.getDestinationBySlug(req.params.slug);
  const stories = await Story.find({ destinationId: destination._id, isPublished: true })
    .sort({ category: 1, createdAt: -1 })
    .lean();
  sendSuccess(res, stories);
});

export const postMalariaCalculate = asyncHandler(async (req: Request, res: Response) => {
  const { drug, tripStart, tripEnd } = req.body;
  const plan = calculateMalariaPlan({ drug, tripStart, tripEnd });
  sendSuccess(res, plan);
});
