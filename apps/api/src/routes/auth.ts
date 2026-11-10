import { loginRequestSchema, registerRequestSchema } from "@lamton/shared";
import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler.js";
import {
  clearSessionCookie,
  getAuth,
  readSessionCookie,
  requireAuth,
  sessionCookieOptions,
} from "../middleware/auth.js";
import { authLimiter, rejectPrivilegeFields } from "../middleware/security.js";
import { validateBody } from "../middleware/validate.js";
import { SESSION_COOKIE } from "../models/Session.js";
import { authenticate, createSession, registerFounder, revokeToken } from "../services/authService.js";

export const authRouter = Router();

authRouter.post(
  "/register",
  authLimiter,
  rejectPrivilegeFields,
  validateBody(registerRequestSchema),
  asyncHandler(async (req, res) => {
    const user = await registerFounder(req.body);
    const session = await createSession(user.id);
    res.cookie(SESSION_COOKIE, session.token, sessionCookieOptions());
    res.status(201).json({ user, csrfToken: session.csrfToken });
  }),
);

authRouter.post(
  "/login",
  authLimiter,
  validateBody(loginRequestSchema),
  asyncHandler(async (req, res) => {
    await revokeToken(readSessionCookie(req));
    const user = await authenticate(req.body);
    const session = await createSession(user.id);
    res.cookie(SESSION_COOKIE, session.token, sessionCookieOptions());
    res.status(200).json({ user, csrfToken: session.csrfToken });
  }),
);

authRouter.post(
  "/logout",
  requireAuth,
  asyncHandler(async (req, res) => {
    await revokeToken(readSessionCookie(req));
    clearSessionCookie(res);
    res.status(204).end();
  }),
);

authRouter.get("/me", requireAuth, (req, res) => {
  const auth = getAuth(req);
  res.set("Cache-Control", "no-store");
  res.json({ user: auth.user, csrfToken: auth.csrfToken });
});
