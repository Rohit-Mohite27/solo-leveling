import type { Request, Response } from "express";
import { parseId } from "../../lib/params.js";
import * as leaderboardService from "./leaderboard.service.js";
import { LeaderboardError } from "./leaderboard.service.js";

export async function getBoard(_req: Request, res: Response) {
  const data = await leaderboardService.getLeaderboard();
  res.json({ success: true, data });
}

export async function getRecord(req: Request, res: Response) {
  try {
    const id = parseId(req.params.hunterId);
    if (id === null) {
      res.status(400).json({ success: false, code: "INVALID_ID", message: "Invalid hunter id" });
      return;
    }
    const data = await leaderboardService.getHunterRecord(id);
    res.json({ success: true, data });
  } catch (err) {
    if (err instanceof LeaderboardError) {
      res.status(err.status).json({
        success: false,
        code: err.code,
        message: err.message,
      });
      return;
    }
    throw err;
  }
}
