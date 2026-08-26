import dotenv from "dotenv";

dotenv.config();

const INSECURE_DEV_JWT_SECRET = "dev-only-insecure-secret-change-me";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const nodeEnv = process.env.NODE_ENV ?? "development";
const isProduction = nodeEnv === "production";

// The JWT secret is intentionally NOT allowed to silently fall back to a known dev value
// in production — a hardcoded fallback secret sitting in a public repo would let anyone
// forge valid tokens against any deployment that forgot to set the real env var. In any
// non-production environment, the dev fallback is still convenient and safe enough to keep.
const jwtSecret = process.env.JWT_SECRET;
if (isProduction && (!jwtSecret || jwtSecret === INSECURE_DEV_JWT_SECRET)) {
  throw new Error(
    "JWT_SECRET must be set to a strong, unique value in production. Refusing to start " +
      "with an unset or default secret.",
  );
}

export const env = {
  nodeEnv,
  isProduction,
  port: Number(process.env.PORT ?? 5000),
  mongodbUri: required("MONGODB_URI", "mongodb://localhost:27017/tropikit"),
  jwtSecret: jwtSecret ?? INSECURE_DEV_JWT_SECRET,
  // Short-lived by design — this is the token attached to every API request. A stolen access
  // token is only useful for a short window; the refresh token (below) is what carries a
  // longer session, and it never leaves an httpOnly cookie, so JS on the page can't read it.
  accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN ?? "15m",
  refreshTokenExpiresInDays: Number(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS ?? 30),
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173",
  apiUrl: process.env.API_URL ?? "http://localhost:5000",
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 900000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX ?? 300),
  authRateLimitWindowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? 900000),
  authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX ?? 20),
  // Stricter still — password reset requests are the classic email-enumeration/spam target.
  passwordResetRateLimitWindowMs: Number(process.env.PASSWORD_RESET_RATE_LIMIT_WINDOW_MS ?? 3600000),
  passwordResetRateLimitMax: Number(process.env.PASSWORD_RESET_RATE_LIMIT_MAX ?? 5),
};

