import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { requireSelfHunterParam, requireSession } from "../../middleware/session.js";
import { listQuestsByHunter, createQuest, removeQuest } from "./quests.controller.js";

export const questsRouter = Router();

questsRouter.use(requireSession);
questsRouter.get(
  "/hunter/:hunterId",
  requireSelfHunterParam("hunterId"),
  asyncHandler(listQuestsByHunter),
);
questsRouter.post(
  "/hunter/:hunterId",
  requireSelfHunterParam("hunterId"),
  asyncHandler(createQuest),
);
questsRouter.delete("/:id", asyncHandler(removeQuest));
