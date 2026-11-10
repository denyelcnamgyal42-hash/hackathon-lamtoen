import { Router } from "express";
import { checkDb } from "../db.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const healthRouter = Router();

healthRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const database = await checkDb();
    res.status(database === "ok" ? 200 : 503).json({
      status: database === "ok" ? "ok" : "degraded",
      application: "ok",
      database,
      timestamp: new Date().toISOString(),
    });
  }),
);
