import { Router } from "express";
import { requireSelfHunterParam, requireSession } from "../../middleware/session.js";
import { getHunter } from "./hunters.controller.js";

export const huntersRouter = Router();

huntersRouter.use(requireSession);
huntersRouter.get("/:id", requireSelfHunterParam("id"), getHunter);
