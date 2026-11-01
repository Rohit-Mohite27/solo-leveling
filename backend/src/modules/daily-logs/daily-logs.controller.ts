import type { Request, Response } from "express";
import { z } from "zod";
import { parseId } from "../../lib/params.js";
import * as dailyLogsService from "./daily-logs.service.js";

const item_body = z.object({
  value: z.coerce.number().min(0),
  cleared: z.boolean(),
});

export async function getTodayLog(req: Request, res: Response) {
  const hunter_id = parseId(req.params.hunterId);
  if (hunter_id === null) {
    res.status(400).json({ success: false, code: "INVALID_ID", message: "Invalid hunter id" });
    return;
  }
  const data = await dailyLogsService.getOrCreateToday(hunter_id);
  res.json({ success: true, data });
}

export async function listRecentLogs(req: Request, res: Response) {
  const hunter_id = parseId(req.params.hunterId);
  if (hunter_id === null) {
    res.status(400).json({ success: false, code: "INVALID_ID", message: "Invalid hunter id" });
    return;
  }
  const data = await dailyLogsService.listRecent(hunter_id);
  res.json({ success: true, data });
}

export async function upsertTodayItem(req: Request, res: Response) {
  const hunter_id = parseId(req.params.hunterId);
  const quest_id = parseId(req.params.questId);
  if (hunter_id === null || quest_id === null) {
    res.status(400).json({ success: false, code: "INVALID_ID", message: "Invalid id" });
    return;
  }
  const body = item_body.parse(req.body ?? {});
  const data = await dailyLogsService.upsertItem(hunter_id, quest_id, body);
  res.json({ success: true, data });
}

export async function submitToday(req: Request, res: Response) {
  const hunter_id = parseId(req.params.hunterId);
  if (hunter_id === null) {
    res.status(400).json({ success: false, code: "INVALID_ID", message: "Invalid hunter id" });
    return;
  }
  const data = await dailyLogsService.submitToday(hunter_id);
  res.json({ success: true, data });
}
