import cors from "cors";
import express from "express";
import { isAllowedCorsOrigin } from "./config/env.js";
import { attachSession } from "./middleware/session.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { huntersRouter } from "./modules/hunters/hunters.routes.js";
import { questsRouter } from "./modules/quests/quests.routes.js";
import { dailyLogsRouter } from "./modules/daily-logs/daily-logs.routes.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);

  app.use(
    cors({
      origin(origin, callback) {
        if (isAllowedCorsOrigin(origin)) {
          callback(null, true);
          return;
        }
        console.warn(`[cors] blocked origin: ${origin ?? "(none)"}`);
        // false = deny without throwing (throwing became a browser "network error")
        callback(null, false);
      },
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(attachSession);

  app.get("/", (_req, res) => {
    res.json({
      success: true,
      data: { name: "solo-leveling-api", version: "0.1.0" },
    });
  });

  app.use("/api/v1/health", healthRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/hunters", huntersRouter);
  app.use("/api/v1/quests", questsRouter);
  app.use("/api/v1/daily-logs", dailyLogsRouter);

  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error(err);
      // body-parser JSON failures
      if (
        typeof err === "object" &&
        err !== null &&
        "status" in err &&
        (err as { status?: number }).status === 400
      ) {
        res.status(400).json({
          success: false,
          code: "BAD_REQUEST",
          message: "Invalid JSON body",
        });
        return;
      }
      res.status(500).json({
        success: false,
        code: "INTERNAL_ERROR",
        message: "Unexpected server error",
      });
    },
  );

  return app;
}
