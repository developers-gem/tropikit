import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import * as tripService from "../services/tripService";
import * as dashboardService from "../services/dashboardService";
import * as reminderService from "../services/reminderService";
import { AppError } from "../utils/AppError";

function requireUserId(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.userId;
}

export const createTrip = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const trip = await tripService.createTrip({ ...req.body, userId });
  // Seeds the timeline-based reminders (consultation, checklist, etc.) as soon as a trip
  // exists, rather than waiting for a later dashboard load to materialize them.
  await reminderService.syncTripReminders(String(trip._id), userId);
  sendSuccess(res, trip, "Trip created", 201);
});

export const listTrips = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const trips = await tripService.listTripsForUser(userId);
  sendSuccess(res, trips);
});

export const getTrip = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const trip = await tripService.getTripForUser(req.params.id, userId);
  sendSuccess(res, trip);
});

export const updateTrip = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const trip = await tripService.updateTripForUser(req.params.id, userId, req.body);
  // Departure/return date changes shift every date-derived reminder (timeline milestones and,
  // if a malaria plan exists, its medication/bite-prevention dates) — resync unconditionally
  // rather than trying to detect exactly which fields changed.
  if (req.body.departureDate || req.body.returnDate) {
    await reminderService.syncTripReminders(req.params.id, userId);
  }
  sendSuccess(res, trip, "Trip updated");
});

export const deleteTrip = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  await tripService.deleteTripForUser(req.params.id, userId);
  sendSuccess(res, null, "Trip deleted");
});

export const updateTripPreparation = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const trip = await tripService.updateTripPreparationForUser(req.params.id, userId, req.body);
  sendSuccess(res, trip, "Preparation status updated");
});

export const getTripDashboard = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  const dashboard = await dashboardService.buildTripDashboard(req.params.id, userId);
  sendSuccess(res, dashboard);
});
