import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import * as authService from "../services/authService";
import { AppError } from "../utils/AppError";
import { env } from "../config/env";

const REFRESH_COOKIE_NAME = "tropikit_refresh_token";

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.isProduction,
  // "Lax" allows the cookie on top-level navigation (e.g. following a password-reset link
  // from an email) while still blocking it on cross-site requests initiated by other sites —
  // "Strict" would break that flow, "None" would need every deployment to be HTTPS-everywhere
  // even in development, which this project doesn't assume.
  sameSite: "lax" as const,
  path: "/api/v1/auth",
};

function setRefreshCookie(res: Response, token: string, expiresAt: Date) {
  res.cookie(REFRESH_COOKIE_NAME, token, { ...REFRESH_COOKIE_OPTIONS, expires: expiresAt });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, REFRESH_COOKIE_OPTIONS);
}

function requireUserId(req: Request): string {
  if (!req.user) throw AppError.unauthorized();
  return req.user.userId;
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.registerUser(req.body);
  setRefreshCookie(res, result.refreshToken, result.refreshTokenExpiresAt);
  sendSuccess(res, { accessToken: result.accessToken, user: result.user }, "Account created", 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.loginUser(req.body);
  setRefreshCookie(res, result.refreshToken, result.refreshTokenExpiresAt);
  sendSuccess(res, { accessToken: result.accessToken, user: result.user }, "Logged in");
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!rawRefreshToken) throw AppError.unauthorized("No active session");

  const tokens = await authService.refreshAccessToken(rawRefreshToken);
  setRefreshCookie(res, tokens.refreshToken, tokens.refreshTokenExpiresAt);
  sendSuccess(res, { accessToken: tokens.accessToken });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
  if (rawRefreshToken) {
    await authService.revokeRefreshToken(rawRefreshToken);
  }
  clearRefreshCookie(res);
  sendSuccess(res, null, "Logged out");
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getUserById(requireUserId(req));
  sendSuccess(res, user);
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.updateProfile(requireUserId(req), req.body);
  sendSuccess(res, user, "Profile updated");
});

export const updatePreferences = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.updatePreferences(requireUserId(req), req.body);
  sendSuccess(res, user, "Preferences updated");
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  await authService.changePassword(userId, req.body.currentPassword, req.body.newPassword);
  // Password change revokes every session including this one — clear the cookie here too so
  // the browser doesn't keep sending a refresh token the server has already invalidated.
  clearRefreshCookie(res);
  sendSuccess(res, null, "Password changed. Please log in again.");
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { rawToken } = await authService.requestPasswordReset(req.body.email);
  // Always the same response whether or not the email exists — see authService for why.
  const data: { resetToken?: string } = {};
  // The raw token is only ever included in a non-production response, purely so this flow
  // can be tested end-to-end without real email infrastructure. In production this must be
  // emailed instead — see the completion report for this honestly-stated limitation.
  if (!env.isProduction && rawToken) {
    data.resetToken = rawToken;
  }
  sendSuccess(res, data, "If an account exists for that email, a reset link has been sent.");
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.resetPassword(req.body.token, req.body.newPassword);
  sendSuccess(res, null, "Password reset. Please log in with your new password.");
});

export const deleteAccount = asyncHandler(async (req: Request, res: Response) => {
  const userId = requireUserId(req);
  await authService.deleteAccount(userId, req.body.password);
  const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
  if (rawRefreshToken) {
    await authService.revokeRefreshToken(rawRefreshToken).catch(() => {
      // The account (and its refresh tokens) are already deleted by this point — a failure
      // here just means there's nothing left to revoke, not a real error.
    });
  }
  clearRefreshCookie(res);
  sendSuccess(res, null, "Account deleted");
});
