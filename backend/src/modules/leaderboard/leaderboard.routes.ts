import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { requireSession } from "../../middleware/session.js";
import { getBoard, getRecord } from "./leaderboard.controller.js";

export const leaderboardRouter = Router();

leaderboardRouter.use(requireSession);
leaderboardRouter.get("/", asyncHandler(getBoard));
leaderboardRouter.get("/:hunterId", asyncHandler(getRecord));
