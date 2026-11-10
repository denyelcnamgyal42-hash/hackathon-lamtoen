import type { AdminSummary } from "@lamton/shared";
import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { User } from "../models/User.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole("admin"));

adminRouter.get(
  "/summary",
  asyncHandler(async (_req, res) => {
    const [founders, mentors, admins, suspended] = await Promise.all([
      User.countDocuments({ role: "founder" }),
      User.countDocuments({ role: "mentor" }),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ accountState: "suspended" }),
    ]);
    const summary: AdminSummary = {
      counts: { founders, mentors, admins, suspended },
    };
    res.json(summary);
  }),
);
