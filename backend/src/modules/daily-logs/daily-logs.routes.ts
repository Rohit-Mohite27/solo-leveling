import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { requireSelfHunterParam, requireSession } from "../../middleware/session.js";
import {
  getTodayLog,
  listRecentLogs,
  upsertTodayItem,
  submitToday,
} from "./daily-logs.controller.js";

export const dailyLogsRouter = Router();

dailyLogsRouter.use(requireSession);
dailyLogsRouter.get(
  "/hunter/:hunterId/today",
  requireSelfHunterParam("hunterId"),
  asyncHandler(getTodayLog),
);
dailyLogsRouter.get(
  "/hunter/:hunterId",
  requireSelfHunterParam("hunterId"),
  asyncHandler(listRecentLogs),
);
dailyLogsRouter.patch(
  "/hunter/:hunterId/today/items/:questId",
  requireSelfHunterParam("hunterId"),
  asyncHandler(upsertTodayItem),
);
dailyLogsRouter.post(
  "/hunter/:hunterId/today/submit",
  requireSelfHunterParam("hunterId"),
  asyncHandler(submitToday),
);
