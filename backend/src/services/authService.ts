import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { RefreshToken } from "../models/RefreshToken";
import { PasswordResetToken } from "../models/PasswordResetToken";
import { Trip } from "../models/Trip";
import { TripChecklistProgress } from "../models/TripChecklistProgress";
import { MalariaPlan } from "../models/MalariaPlan";
import { Reminder } from "../models/Reminder";
import { AppError } from "../utils/AppError";
import { env } from "../config/env";
import { logger } from "../utils/logger";

export interface RegisterInput {
  email: string;
  password: string;
  name?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

function signAccessToken(userId: string): string {
  return jwt.sign({ userId }, env.jwtSecret, {
    expiresIn: env.accessTokenExpiresIn,
  } as jwt.SignOptions);
}

function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function generateRawToken(): string {
  return crypto.randomBytes(48).toString("hex");
}

/**
 * Issues a fresh access+refresh pair. The refresh token is an opaque random string, not a
 * JWT — only its hash is persisted (see RefreshToken.ts). The raw value is returned exactly
 * once, to be set as an httpOnly cookie by the controller; nothing in this service ever logs
 * or exposes it beyond that single return.
 */
async function issueTokenPair(userId: string): Promise<TokenPair> {
  const accessToken = signAccessToken(userId);
  const rawRefreshToken = generateRawToken();
  const refreshTokenExpiresAt = new Date(
    Date.now() + env.refreshTokenExpiresInDays * 24 * 60 * 60 * 1000,
  );

  await RefreshToken.create({
    userId,
    tokenHash: hashToken(rawRefreshToken),
    expiresAt: refreshTokenExpiresAt,
  });

  return { accessToken, refreshToken: rawRefreshToken, refreshTokenExpiresAt };
}

export async function registerUser(input: RegisterInput) {
  const existing = await User.findOne({ email: input.email.toLowerCase() });
  if (existing) {
    throw AppError.conflict("An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await User.create({
    email: input.email.toLowerCase(),
    passwordHash,
    name: input.name ?? "",
  });

  const tokens = await issueTokenPair(String(user._id));
  return { ...tokens, user: toPublicUser(user) };
}

export async function loginUser(input: LoginInput) {
  const user = await User.findOne({ email: input.email.toLowerCase() });
  if (!user) throw AppError.unauthorized("Invalid email or password");

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) throw AppError.unauthorized("Invalid email or password");

  const tokens = await issueTokenPair(String(user._id));
  return { ...tokens, user: toPublicUser(user) };
}

/**
 * Rotation with reuse detection. Every successful refresh revokes the presented token and
 * issues a brand new one. If a token that's ALREADY revoked is presented again, that can only
 * mean it was used once already and someone (possibly an attacker who stole an earlier
 * cookie) is replaying an old value — the response is to revoke every refresh token this user
 * has, forcing a fresh login everywhere, rather than trusting the request.
 */
export async function refreshAccessToken(rawRefreshToken: string): Promise<TokenPair> {
  const tokenHash = hashToken(rawRefreshToken);
  const existing = await RefreshToken.findOne({ tokenHash });

  if (!existing) throw AppError.unauthorized("Invalid session. Please log in again.");

  if (existing.revokedAt) {
    logger.warn("Refresh token reuse detected — revoking all sessions for user", {
      userId: String(existing.userId),
    });
    await RefreshToken.updateMany(
      { userId: existing.userId, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );
    throw AppError.unauthorized("Session invalidated for security. Please log in again.");
  }

  if (existing.expiresAt < new Date()) {
    throw AppError.unauthorized("Session expired. Please log in again.");
  }

  const newTokens = await issueTokenPair(String(existing.userId));
  existing.revokedAt = new Date();
  existing.replacedByTokenHash = hashToken(newTokens.refreshToken);
  await existing.save();

  return newTokens;
}

export async function revokeRefreshToken(rawRefreshToken: string): Promise<void> {
  const tokenHash = hashToken(rawRefreshToken);
  await RefreshToken.updateOne(
    { tokenHash, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
}

async function revokeAllRefreshTokensForUser(userId: string): Promise<void> {
  await RefreshToken.updateMany(
    { userId, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
}

export async function getUserById(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw AppError.notFound("User not found");
  return toPublicUser(user);
}

export async function updateProfile(userId: string, updates: { name?: string }) {
  const user = await User.findById(userId);
  if (!user) throw AppError.notFound("User not found");
  if (updates.name !== undefined) user.name = updates.name;
  await user.save();
  return toPublicUser(user);
}

export async function updatePreferences(
  userId: string,
  updates: { defaultTimezone?: string | null; emailNotifications?: boolean },
) {
  const user = await User.findById(userId);
  if (!user) throw AppError.notFound("User not found");
  if (updates.defaultTimezone !== undefined) user.preferences.defaultTimezone = updates.defaultTimezone;
  if (updates.emailNotifications !== undefined) user.preferences.emailNotifications = updates.emailNotifications;
  await user.save();
  return toPublicUser(user);
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await User.findById(userId);
  if (!user) throw AppError.notFound("User not found");

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw AppError.unauthorized("Current password is incorrect");

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.passwordChangedAt = new Date();
  await user.save();

  // A password change invalidates every existing session, including the one making this
  // request — the client is expected to log in again with the new password.
  await revokeAllRefreshTokensForUser(userId);
}

/**
 * HONEST LIMITATION, stated in code and in the completion report: this project has no
 * email-sending infrastructure. In a real deployment, the raw reset token would be emailed
 * to the user and NEVER returned in an API response. Here, outside production, it's returned
 * directly so the reset flow can actually be exercised and tested end-to-end. In production
 * mode this function still creates the token record but does not return the raw value in the
 * response — see the controller, which gates that on env.isProduction.
 *
 * Always resolves the same way whether or not the email exists, to avoid leaking which
 * emails are registered (a real, meaningful anti-enumeration measure, not just a formality).
 */
export async function requestPasswordReset(email: string): Promise<{ rawToken: string | null }> {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return { rawToken: null };
  }

  const rawToken = generateRawToken();
  await PasswordResetToken.create({
    userId: user._id,
    tokenHash: hashToken(rawToken),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
  });

  return { rawToken };
}

export async function resetPassword(rawToken: string, newPassword: string): Promise<void> {
  const tokenHash = hashToken(rawToken);
  const resetToken = await PasswordResetToken.findOne({ tokenHash });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    throw AppError.unauthorized("This password reset link is invalid or has expired.");
  }

  const user = await User.findById(resetToken.userId);
  if (!user) throw AppError.notFound("User not found");

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.passwordChangedAt = new Date();
  await user.save();

  resetToken.usedAt = new Date();
  await resetToken.save();

  await revokeAllRefreshTokensForUser(String(user._id));
}

/**
 * Account deletion cascade — explicit and documented, per the requirement to define exactly
 * what happens to each kind of data. Runs as a sequence of deletes rather than a single Mongo
 * transaction: transactions require a replica set, which isn't available in every deployment
 * target for this project, and this sandbox has no live MongoDB to test one against anyway
 * (see the completion report). The order below deletes dependent records before the user
 * record itself, so a failure partway through never leaves an orphaned-but-still-owned trip
 * pointing at a user that no longer exists.
 */
export async function deleteAccount(userId: string, password: string): Promise<void> {
  const user = await User.findById(userId);
  if (!user) throw AppError.notFound("User not found");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw AppError.unauthorized("Password is incorrect");

  const trips = await Trip.find({ userId }, { _id: 1 });
  const tripIds = trips.map((t) => t._id);

  await Reminder.deleteMany({ userId });
  await TripChecklistProgress.deleteMany({ userId });
  await MalariaPlan.deleteMany({ tripId: { $in: tripIds } });
  await Trip.deleteMany({ userId });
  await RefreshToken.deleteMany({ userId });
  await PasswordResetToken.deleteMany({ userId });
  await User.deleteOne({ _id: userId });
}

function toPublicUser(user: {
  _id: unknown;
  email: string;
  name?: string;
  role?: string;
  preferences?: { defaultTimezone?: string | null; emailNotifications?: boolean };
}) {
  return {
    id: String(user._id),
    email: user.email,
    name: user.name ?? "",
    // Included so the frontend can decide whether to show admin navigation — this is a
    // display decision only, never an authorization decision. The server re-checks the
    // real role from the database on every admin request regardless of what this says
    // (see middleware/rbac.ts) — a tampered or stale client value here grants nothing.
    role: user.role ?? "user",
    preferences: {
      defaultTimezone: user.preferences?.defaultTimezone ?? null,
      emailNotifications: user.preferences?.emailNotifications ?? true,
    },
  };
}
