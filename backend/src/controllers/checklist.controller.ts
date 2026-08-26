import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import * as checklistService from "../services/checklistService";
import { AppError } from "../utils/AppError";

function requireUserId(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.userId;
}

export const getChecklistTemplate = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, checklistService.getChecklistTemplate());
});

export const getTripChecklistTemplate = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const template = await checklistService.getTripChecklistTemplate(req.params.id, userId);
  sendSuccess(res, template);
});

export const getTripChecklist = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const progress = await checklistService.getTripChecklistProgress(req.params.id, userId);
  sendSuccess(res, progress);
});

export const putTripChecklist = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const progress = await checklistService.setTripChecklistProgress(
    req.params.id,
    userId,
    req.body.checkedItemKeys,
  );
  sendSuccess(res, progress, "Checklist saved");
});
