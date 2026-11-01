import type { Request, Response } from "express";
import { getHealthStatus } from "./health.service.js";

export async function getHealth(_req: Request, res: Response) {
  const data = await getHealthStatus();
  const status = data.database === "up" ? 200 : 503;
  res.status(status).json({
    success: data.database === "up",
    data,
  });
}
