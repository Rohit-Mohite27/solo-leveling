import type { Request, Response } from "express";
import { parseId } from "../../lib/params.js";
import * as huntersService from "./hunters.service.js";

export async function getHunter(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(400).json({
      success: false,
      code: "INVALID_ID",
      message: "Hunter id must be a number",
    });
    return;
  }
  const data = await huntersService.getHunterById(id);
  if (!data) {
    res.status(404).json({
      success: false,
      code: "NOT_FOUND",
      message: "Hunter not found",
    });
    return;
  }
  res.json({ success: true, data });
}
