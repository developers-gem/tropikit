import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import apiRouter from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.clientUrl,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  // Refresh tokens travel as an httpOnly cookie, not a header — this is what lets the
  // /auth/refresh and /auth/logout controllers read it via req.cookies.
  app.use(cookieParser());
  app.use(morgan(env.isProduction ? "combined" : "dev"));

  const limiter = rateLimit({
    windowMs: env.rateLimitWindowMs,
    max: env.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api", limiter);

  // Login/register get a much stricter ceiling than general API traffic, since these are
  // the endpoints a credential-stuffing or brute-force attempt would actually hit.
  const authLimiter = rateLimit({
    windowMs: env.authRateLimitWindowMs,
    max: env.authRateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: { code: "RATE_LIMITED", message: "Too many attempts. Try again later." },
    },
  });
  app.use("/api/v1/auth/login", authLimiter);
  app.use("/api/v1/auth/register", authLimiter);

  // Stricter still — password reset requests are the classic email-enumeration/spam target,
  // and unlike login there's no legitimate reason for a real user to hit this often.
  const passwordResetLimiter = rateLimit({
    windowMs: env.passwordResetRateLimitWindowMs,
    max: env.passwordResetRateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: { code: "RATE_LIMITED", message: "Too many attempts. Try again later." },
    },
  });
  app.use("/api/v1/auth/forgot-password", passwordResetLimiter);
  app.use("/api/v1/auth/reset-password", passwordResetLimiter);

  app.use("/api/v1", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
