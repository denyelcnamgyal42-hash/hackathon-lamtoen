import type { Role } from "@lamton/shared";
import type { NextFunction, Request, Response } from "express";
import { loadConfig } from "../config.js";
import { HttpError } from "../lib/errors.js";
import { hashToken } from "../lib/tokens.js";
import { Session, SESSION_COOKIE, SESSION_TTL_MS } from "../models/Session.js";
import { toPublicUser, User } from "../models/User.js";
import type { AuthContext } from "../types/auth.js";

export function sessionCookieOptions() {
  return {
    httpOnly: true as const,
    secure: loadConfig().cookieSecure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_MS,
  };
}

export function clearSessionCookie(res: Response): void {
  const { maxAge: _maxAge, ...options } = sessionCookieOptions();
  res.clearCookie(SESSION_COOKIE, options);
}

export function readSessionCookie(req: Request): string | undefined {
  const value: unknown = req.cookies?.[SESSION_COOKIE];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export async function attachSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = readSessionCookie(req);
    if (!token) {
      next();
      return;
    }

    const session = await Session.findOne({ tokenHash: hashToken(token) });
    if (!session || session.expiresAt.getTime() <= Date.now()) {
      if (session) await session.deleteOne();
      clearSessionCookie(res);
      next();
      return;
    }

    const user = await User.findById(session.userId);
    if (!user || user.accountState !== "active") {
      await session.deleteOne();
      clearSessionCookie(res);
      next();
      return;
    }

    req.auth = {
      user: toPublicUser(user),
      csrfToken: session.csrfToken,
    };
    next();
  } catch (error) {
    next(error);
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.auth) {
    next(new HttpError(401, "UNAUTHENTICATED", "Authentication required."));
    return;
  }
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.auth) {
      next(new HttpError(401, "UNAUTHENTICATED", "Authentication required."));
      return;
    }
    if (!roles.includes(req.auth.user.role)) {
      next(new HttpError(403, "FORBIDDEN", "You do not have permission to access this resource."));
      return;
    }
    next();
  };
}

export function getAuth(req: Request): AuthContext {
  if (!req.auth) {
    throw new HttpError(401, "UNAUTHENTICATED", "Authentication required.");
  }
  return req.auth;
}

/** Object-level guard: the signed-in user may read their own record, and an admin may read any record. */
export function assertSelfOrAdmin(actor: { id: string; role: Role }, ownerId: string): void {
  if (actor.role === "admin") return;
  if (actor.id === ownerId) return;
  throw new HttpError(403, "FORBIDDEN", "You do not have access to this record.");
}
