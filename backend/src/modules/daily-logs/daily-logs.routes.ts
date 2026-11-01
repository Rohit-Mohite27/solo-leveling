import { Router } from "express";
import { requireSelfHunterParam, requireSession } from "../../middleware/session.js";
import {
  getTodayLog,
  listRecentLogs,
  upsertTodayItem,
  submitToday,
} from "./daily-logs.controller.js";

export const dailyLogsRouter = Router();

dailyLogsRouter.use(requireSession);
dailyLogsRouter.get("/hunter/:hunterId/today", requireSelfHunterParam("hunterId"), getTodayLog);
dailyLogsRouter.get("/hunter/:hunterId", requireSelfHunterParam("hunterId"), listRecentLogs);
dailyLogsRouter.patch(
  "/hunter/:hunterId/today/items/:questId",
  requireSelfHunterParam("hunterId"),
  upsertTodayItem,
);
dailyLogsRouter.post(
  "/hunter/:hunterId/today/submit",
  requireSelfHunterParam("hunterId"),
  submitToday,
);
