import type { FounderWorkspace } from "@lamton/shared";
import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler.js";
import { getAuth, requireAuth, requireRole } from "../middleware/auth.js";

export const founderRouter = Router();

founderRouter.use(requireAuth, requireRole("founder"));

founderRouter.get(
  "/workspace",
  asyncHandler(async (req, res) => {
    const auth = getAuth(req);
    const workspace: FounderWorkspace = {
      profile: auth.user,
      venture: null,
      mentorship: null,
      research: null,
    };
    res.json(workspace);
  }),
);
