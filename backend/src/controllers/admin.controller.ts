import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { AppError } from "../utils/AppError";
import * as adminDashboardService from "../services/adminDashboardService";
import * as adminDestinationService from "../services/adminDestinationService";
import * as adminStoryService from "../services/adminStoryService";
import * as adminSourceService from "../services/adminSourceService";

function requireUserId(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.userId;
}

export const getDashboard = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await adminDashboardService.getAdminDashboardStats();
  sendSuccess(res, stats);
});

export const listDestinations = asyncHandler(async (req: Request, res: Response) => {
  const { search } = req.query as { search?: string };
  const destinations = await adminDestinationService.listDestinationsForAdmin(search);
  sendSuccess(res, destinations);
});

export const getDestination = asyncHandler(async (req: Request, res: Response) => {
  const destination = await adminDestinationService.getDestinationForAdmin(req.params.id);
  sendSuccess(res, destination);
});

export const updateDestinationContent = asyncHandler(async (req: Request, res: Response) => {
  const destination = await adminDestinationService.updateDestinationContent(
    req.params.id,
    req.body,
  );
  sendSuccess(res, destination, "Destination content updated");
});

export const setDestinationActive = asyncHandler(async (req: Request, res: Response) => {
  const destination = await adminDestinationService.setDestinationActive(
    req.params.id,
    req.body.isActive,
  );
  sendSuccess(res, destination, req.body.isActive ? "Destination activated" : "Destination deactivated");
});

export const updateDestinationReview = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const destination = await adminDestinationService.updateDestinationReviewStatus(
    req.params.id,
    req.body,
    userId,
  );
  sendSuccess(res, destination, "Review status updated");
});

export const listStories = asyncHandler(async (_req: Request, res: Response) => {
  const stories = await adminStoryService.listStoriesForAdmin();
  sendSuccess(res, stories);
});

export const getStory = asyncHandler(async (req: Request, res: Response) => {
  const story = await adminStoryService.getStoryForAdmin(req.params.id);
  sendSuccess(res, story);
});

export const createStory = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const story = await adminStoryService.createStory(req.body, userId);
  sendSuccess(res, story, "Story created", 201);
});

export const updateStory = asyncHandler(async (req: Request, res: Response) => {
  const story = await adminStoryService.updateStory(req.params.id, req.body);
  sendSuccess(res, story, "Story updated");
});

export const setStoryPublished = asyncHandler(async (req: Request, res: Response) => {
  const story = await adminStoryService.setStoryPublished(req.params.id, req.body.isPublished);
  sendSuccess(res, story, req.body.isPublished ? "Story published" : "Story unpublished");
});

export const updateStoryReview = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const story = await adminStoryService.updateStoryReviewStatus(req.params.id, req.body, userId);
  sendSuccess(res, story, "Review status updated");
});

export const deleteStory = asyncHandler(async (req: Request, res: Response) => {
  await adminStoryService.deleteStory(req.params.id);
  sendSuccess(res, null, "Story deleted");
});

export const listSources = asyncHandler(async (_req: Request, res: Response) => {
  const result = await adminSourceService.listSourcesForAdmin();
  sendSuccess(res, result);
});
