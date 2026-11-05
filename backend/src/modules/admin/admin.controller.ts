import type { Request, Response } from "express";
import { z } from "zod";
import { parseId } from "../../lib/params.js";
import { clearAdminCookie, setAdminCookie } from "../../lib/session.js";
import * as adminService from "./admin.service.js";
import { AdminError } from "./admin.service.js";

function handleAdminError(err: unknown, res: Response): boolean {
  if (err instanceof AdminError) {
    res.status(err.status).json({
      success: false,
      code: err.code,
      message: err.message,
    });
    return true;
  }
  return false;
}

const login_body = z.object({
  password: z.string().min(1).max(200),
});

export async function login(req: Request, res: Response) {
  try {
    const body = login_body.parse(req.body ?? {});
    adminService.assertAdminPassword(body.password);
    const token = setAdminCookie(res);
    res.json({ success: true, data: { ok: true, sessionToken: token } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ success: false, code: "BAD_REQUEST", message: "Password required" });
      return;
    }
    if (handleAdminError(err, res)) return;
    throw err;
  }
}

export async function logout(_req: Request, res: Response) {
  clearAdminCookie(res);
  res.json({ success: true, data: { ok: true } });
}

export async function me(req: Request, res: Response) {
  res.json({ success: true, data: { admin: Boolean(req.is_admin) } });
}

export async function overview(_req: Request, res: Response) {
  const data = await adminService.getOverview();
  res.json({ success: true, data });
}

export async function listHunters(req: Request, res: Response) {
  const q = typeof req.query.q === "string" ? req.query.q : undefined;
  const data = await adminService.listHunters(q);
  res.json({ success: true, data });
}

export async function getHunter(req: Request, res: Response) {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      res.status(400).json({ success: false, code: "INVALID_ID", message: "Invalid hunter id" });
      return;
    }
    const data = await adminService.getHunterDetail(id);
    res.json({ success: true, data });
  } catch (err) {
    if (handleAdminError(err, res)) return;
    throw err;
  }
}

export async function getHunterDay(req: Request, res: Response) {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      res.status(400).json({ success: false, code: "INVALID_ID", message: "Invalid hunter id" });
      return;
    }
    const date_key = typeof req.params.dateKey === "string" ? req.params.dateKey : "";
    const data = await adminService.getHunterDay(id, date_key);
    res.json({ success: true, data });
  } catch (err) {
    if (handleAdminError(err, res)) return;
    throw err;
  }
}

export async function resetHunter(req: Request, res: Response) {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      res.status(400).json({ success: false, code: "INVALID_ID", message: "Invalid hunter id" });
      return;
    }
    const data = await adminService.resetHunter(id);
    res.json({ success: true, data });
  } catch (err) {
    if (handleAdminError(err, res)) return;
    throw err;
  }
}

export async function deleteHunter(req: Request, res: Response) {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      res.status(400).json({ success: false, code: "INVALID_ID", message: "Invalid hunter id" });
      return;
    }
    const data = await adminService.deleteHunter(id);
    res.json({ success: true, data });
  } catch (err) {
    if (handleAdminError(err, res)) return;
    throw err;
  }
}

const reset_dates_body = z.object({
  dateKeys: z.array(z.string().min(1).max(16)).min(1).max(60),
});

export async function resetHunterDates(req: Request, res: Response) {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      res.status(400).json({ success: false, code: "INVALID_ID", message: "Invalid hunter id" });
      return;
    }
    const body = reset_dates_body.parse(req.body ?? {});
    const data = await adminService.resetHunterDates(id, body.dateKeys);
    res.json({ success: true, data });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        code: "BAD_REQUEST",
        message: "Provide dateKeys: string[] (YYYY-MM-DD)",
      });
      return;
    }
    if (handleAdminError(err, res)) return;
    throw err;
  }
}

export async function health(_req: Request, res: Response) {
  const data = await adminService.adminHealth();
  res.json({ success: true, data });
}

/** One-shot: rebuild all hunters' streaks from No Fap hold history. */
export async function recalcNoFapStreaks(_req: Request, res: Response) {
  const data = await adminService.recalcAllNoFapStreaks();
  res.json({ success: true, data });
}
