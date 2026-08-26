import type { NextFunction, Request, Response } from "express";
import { User, type UserRole } from "../models/User";
import { AppError } from "../utils/AppError";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userRole?: UserRole;
    }
  }
}

/**
 * Deliberately re-checks the user's role against the database on every admin request rather
 * than trusting a role claim embedded in the JWT. Access tokens live for 15 minutes (see
 * authService.ts) — if a role were baked into the token, a demoted admin would keep admin
 * access for up to 15 minutes after being demoted. A fresh lookup costs one extra query but
 * closes that window entirely, which matters more here than anywhere else in this app.
 *
 * Must run after requireAuth (needs req.user.userId already populated).
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(AppError.unauthorized());

    const user = await User.findById(req.user.userId).select("role").lean();
    if (!user) return next(AppError.unauthorized("Account no longer exists"));

    if (!allowedRoles.includes(user.role as UserRole)) {
      return next(AppError.forbidden("You do not have permission to access this resource"));
    }

    req.userRole = user.role as UserRole;
    next();
  };
}

/** Convenience: any of the three staff roles (not "user"). */
export const requireStaff = requireRole("admin", "content-editor", "reviewer");
export const requireAdmin = requireRole("admin");
