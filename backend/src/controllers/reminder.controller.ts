import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import * as reminderService from "../services/reminderService";
import * as tripService from "../services/tripService";
import * as destinationService from "../services/destinationService";
import { buildTripIcs } from "../services/icsService";
import { AppError } from "../utils/AppError";

function requireUserId(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.userId;
}

export const getReminders = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const upcoming = req.query.upcoming !== "false";
  const reminders = upcoming
    ? await reminderService.listUpcomingReminders(req.params.id, userId)
    : await reminderService.listAllReminders(req.params.id, userId);
  sendSuccess(res, reminders);
});

export const getTripCalendar = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const trip = await tripService.getTripForUser(req.params.id, userId);
  const destination = await destinationService.getDestinationById(String(trip.destinationId));
  const reminders = await reminderService.listAllReminders(req.params.id, userId);

  const ics = buildTripIcs({
    destinationName: destination.name,
    reminders: reminders.map((r) => ({ label: r.label, scheduledFor: r.scheduledFor, type: r.type })),
  });

  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="tropikit-${destination.slug}-trip.ics"`,
  );
  res.send(ics);
});
