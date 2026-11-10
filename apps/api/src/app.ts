import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { loadConfig } from "./config.js";
import { attachSession } from "./middleware/auth.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { apiLimiter, csrfProtection } from "./middleware/security.js";
import { adminRouter } from "./routes/admin.js";
import { authRouter } from "./routes/auth.js";
import { founderRouter } from "./routes/founder.js";
import { healthRouter } from "./routes/health.js";
import { usersRouter } from "./routes/users.js";

export function createApp() {
  const config = loadConfig();
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use((_req, res, next) => {
    res.set("X-Robots-Tag", "noindex");
    res.set("Cache-Control", "no-store");
    next();
  });
  app.use(
    cors({
      origin: config.webOrigin,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", "X-CSRF-Token"],
    }),
  );
  app.use(express.json({ limit: "16kb" }));
  app.use(cookieParser());
  app.use("/api", apiLimiter);
  app.use(attachSession);
  app.use(csrfProtection);

  app.get("/", (_req, res) => {
    res.json({ name: "Lamton API", health: "/api/health" });
  });
  app.use("/api/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/founder", founderRouter);
  app.use("/api/admin", adminRouter);

  app.use((_req, res) => {
    res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: "Route not found.",
      },
    });
  });
  app.use(errorHandler);

  return app;
}
