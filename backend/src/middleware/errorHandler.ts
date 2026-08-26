import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";
import { sendError } from "../utils/apiResponse";
import { env } from "../config/env";
import { logger } from "../utils/logger";

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  // Zod validation errors
  if (err instanceof ZodError) {
    return sendError(res, 400, "VALIDATION_ERROR", "Invalid request", err.flatten());
  }

  // Mongoose validation errors
  if (err instanceof mongoose.Error.ValidationError) {
    return sendError(res, 400, "VALIDATION_ERROR", "Invalid data", err.errors);
  }

  // Mongoose bad ObjectId cast
  if (err instanceof mongoose.Error.CastError) {
    return sendError(res, 400, "BAD_REQUEST", `Invalid identifier: ${err.value}`);
  }

  // Mongo duplicate key
  if (typeof err === "object" && err !== null && (err as { code?: number }).code === 11000) {
    return sendError(res, 409, "CONFLICT", "A record with this value already exists");
  }

  // JWT errors
  if (err instanceof Error && err.name === "JsonWebTokenError") {
    return sendError(res, 401, "UNAUTHORIZED", "Invalid authentication token");
  }
  if (err instanceof Error && err.name === "TokenExpiredError") {
    return sendError(res, 401, "UNAUTHORIZED", "Authentication token has expired");
  }

  // Our own operational errors
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(err.message, err);
    }
    return sendError(res, err.statusCode, err.code, err.message, err.details);
  }

  // Anything unexpected — never leak stack traces or internals in production
  logger.error("Unhandled error", err);
  const message =
    !env.isProduction && err instanceof Error ? err.message : "An unexpected error occurred";
  return sendError(res, 500, "INTERNAL_ERROR", message);
}
