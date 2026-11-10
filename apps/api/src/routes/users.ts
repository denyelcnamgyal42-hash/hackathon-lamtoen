import { Router } from "express";
import mongoose from "mongoose";
import { HttpError } from "../lib/errors.js";
import { asyncHandler } from "../lib/asyncHandler.js";
import { assertSelfOrAdmin, getAuth, requireAuth } from "../middleware/auth.js";
import { toPublicUser, User } from "../models/User.js";

export const usersRouter = Router();

usersRouter.get(
  "/:userId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = routeId(req.params.userId);
    const auth = getAuth(req);
    if (!mongoose.isValidObjectId(userId)) {
      throw new HttpError(400, "INVALID_ID", "User id is invalid.");
    }
    assertSelfOrAdmin(auth.user, userId);
    const user = await User.findById(userId);
    if (!user) {
      throw new HttpError(404, "NOT_FOUND", "User not found.");
    }
    res.json({ user: toPublicUser(user) });
  }),
);

function routeId(value: string | string[] | undefined): string {
  const id = Array.isArray(value) ? value[0] : value;
  if (!id) {
    throw new HttpError(400, "INVALID_ID", "User id is missing.");
  }
  return id;
}
