import { Router } from "express";
import { requireSelfHunterParam, requireSession } from "../../middleware/session.js";
import { listQuestsByHunter, createQuest, removeQuest } from "./quests.controller.js";

export const questsRouter = Router();

questsRouter.use(requireSession);
questsRouter.get("/hunter/:hunterId", requireSelfHunterParam("hunterId"), listQuestsByHunter);
questsRouter.post("/hunter/:hunterId", requireSelfHunterParam("hunterId"), createQuest);
questsRouter.delete("/:id", removeQuest);
