import { privilegeFieldPresent } from "@lamton/shared";
import type { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { loadConfig } from "../config.js";
import { HttpError } from "../lib/errors.js";
import { tokensMatch } from "../lib/tokens.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const CSRF_EXEMPT = new Set(["POST /api/auth/register", "POST /api/auth/login"]);

function rateLimitBody(message: string) {
  return {
    error: {
      code: "RATE_LIMITED",
      message,
    },
  };
}

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
  message: rateLimitBody("Too many requests. Wait a few minutes and try again."),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
  message: rateLimitBody("Too many sign-in attempts. Wait a few minutes and try again."),
});

export function rejectPrivilegeFields(req: Request, _res: Response, next: NextFunction): void {
  if (privilegeFieldPresent(req.body)) {
    next(
      new HttpError(
        400,
        "PRIVILEGE_FIELD",
        "Role and account state are assigned by the server and cannot be sent by the client.",
      ),
    );
    return;
  }
  next();
}

export function csrfProtection(req: Request, _res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  const path = req.path.length > 1 ? req.path.replace(/\/$/, "") : req.path;
  const origin = req.get("origin");
  if (origin && origin !== loadConfig().webOrigin) {
    next(new HttpError(403, "CSRF_ORIGIN", "This action was sent from a site Lamton does not allow."));
    return;
  }

  if (CSRF_EXEMPT.has(`${req.method} ${path}`)) {
    next();
    return;
  }

  if (!req.auth) {
    next(new HttpError(401, "UNAUTHENTICATED", "Authentication required."));
    return;
  }

  const header = req.get("x-csrf-token");
  if (!header || !tokensMatch(header, req.auth.csrfToken)) {
    next(new HttpError(403, "CSRF_INVALID", "The security token for this action is missing or invalid."));
    return;
  }

  next();
}
