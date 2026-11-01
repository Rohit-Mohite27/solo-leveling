import type { Request, Response } from "express";
import { z } from "zod";
import { parseId } from "../../lib/params.js";
import * as questsRepository from "./quests.repository.js";
import * as questsService from "./quests.service.js";

const create_body = z.object({
  name: z.string().trim().min(1).max(120),
  kind: z.enum(["count", "distance", "duration", "yesno", "steps"]),
  target: z.coerce.number().positive(),
  unit: z.string().trim().min(1).max(32),
  accent: z.string().trim().max(16).optional(),
});

export async function listQuestsByHunter(req: Request, res: Response) {
  const hunter_id = parseId(req.params.hunterId);
  if (hunter_id === null) {
    res.status(400).json({ success: false, code: "INVALID_ID", message: "Invalid hunter id" });
    return;
  }
  const data = await questsService.listQuestsForHunter(hunter_id);
  res.json({ success: true, data });
}

export async function createQuest(req: Request, res: Response) {
  const hunter_id = parseId(req.params.hunterId);
  if (hunter_id === null) {
    res.status(400).json({ success: false, code: "INVALID_ID", message: "Invalid hunter id" });
    return;
  }
  const body = create_body.parse(req.body ?? {});
  const data = await questsService.addQuest(hunter_id, body);
  res.status(201).json({ success: true, data });
}

export async function removeQuest(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(400).json({ success: false, code: "INVALID_ID", message: "Invalid quest id" });
    return;
  }
  const quest = await questsRepository.findQuestById(id);
  if (!quest || quest.hunter_id !== req.hunter_id) {
    res.status(403).json({
      success: false,
      code: "FORBIDDEN",
      message: "Cannot modify another hunter's quest",
    });
    return;
  }
  await questsService.deleteQuest(id);
  res.json({ success: true, data: { id } });
}
