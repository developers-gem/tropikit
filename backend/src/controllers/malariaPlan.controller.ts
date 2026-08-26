import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import * as malariaPlanService from "../services/malariaPlanService";
import * as reminderService from "../services/reminderService";
import { AppError } from "../utils/AppError";

function requireUserId(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.userId;
}

export const getMalariaPlan = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const plan = await malariaPlanService.getMalariaPlanForTrip(req.params.id, userId);
  sendSuccess(res, plan);
});

export const saveMalariaPlan = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const plan = await malariaPlanService.saveMalariaPlanForTrip(req.params.id, userId, req.body);
  // Reminders (medication start, final dose, bite prevention) are derived from the plan, so
  // they need to be regenerated whenever the plan itself changes.
  await reminderService.syncTripReminders(req.params.id, userId);
  sendSuccess(res, plan, "Malaria plan saved");
});

export const deleteMalariaPlan = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  await malariaPlanService.deleteMalariaPlanForTrip(req.params.id, userId);
  await reminderService.syncTripReminders(req.params.id, userId);
  sendSuccess(res, null, "Malaria plan deleted");
});
