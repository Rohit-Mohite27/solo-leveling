import type { Request, Response } from "express";
import { z } from "zod";
import { parseId } from "../../lib/params.js";
import * as questsRepository from "./quests.repository.js";
import * as questsService from "./quests.service.js";

const create_body = z
  .object({
    name: z.string().trim().min(1).max(120),
    kind: z.enum(["count", "distance", "duration", "yesno", "steps"]),
    target: z.coerce.number().positive(),
    unit: z.string().trim().min(1).max(32),
    accent: z.string().trim().max(16).optional(),
  })
  .superRefine((body, ctx) => {
    const t = body.target;
    if (body.kind === "yesno" && t !== 1) {
      ctx.addIssue({ code: "custom", message: "Yes/No goals use target 1", path: ["target"] });
    }
    if (body.kind === "distance" && t > 1000) {
      ctx.addIssue({ code: "custom", message: "Distance max is 1000 km", path: ["target"] });
    }
    if (body.kind === "duration" && (t < 1 || t > 24 * 60 || !Number.isInteger(t))) {
      ctx.addIssue({
        code: "custom",
        message: "Duration must be whole minutes (1–1440)",
        path: ["target"],
      });
    }
    if (body.kind === "steps" && (t < 1 || t > 500_000 || !Number.isInteger(t))) {
      ctx.addIssue({
        code: "custom",
        message: "Steps target must be a whole number from 1 to 500000",
        path: ["target"],
      });
    }
    if (body.kind === "count" && (t < 1 || t > 100_000 || !Number.isInteger(t))) {
      ctx.addIssue({
        code: "custom",
        message: "Count must be a whole number from 1 to 100000",
        path: ["target"],
      });
    }
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
  if (quest.kind === "steps" || quest.unit === "steps") {
    res.status(400).json({
      success: false,
      code: "STEPS_LOCKED",
      message: "The steps bar cannot be removed",
    });
    return;
  }
  await questsService.deleteQuest(id);
  res.json({ success: true, data: { id } });
}
