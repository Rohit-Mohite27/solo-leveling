import type { Request, Response } from "express";
import { z } from "zod";
import { clearSessionCookie, setSessionCookie } from "../../lib/session.js";
import * as authService from "./auth.service.js";
import { AuthError } from "./auth.service.js";

const phone_body = z.object({
  phone: z.string().min(8).max(20),
});

const verify_body = z.object({
  phone: z.string().min(8).max(20),
  otp: z.string().min(4).max(8),
  name: z.string().min(1).max(120),
});

function handleAuthError(err: unknown, res: Response): boolean {
  if (err instanceof AuthError) {
    res.status(err.status).json({
      success: false,
      code: err.code,
      message: err.message,
    });
    return true;
  }
  if (err instanceof z.ZodError) {
    res.status(400).json({
      success: false,
      code: "VALIDATION_ERROR",
      message: "Invalid request body",
      errors: err.flatten(),
    });
    return true;
  }
  return false;
}

export async function requestOtp(req: Request, res: Response) {
  try {
    const body = phone_body.parse(req.body ?? {});
    const data = await authService.requestOtp(body.phone);
    res.json({ success: true, data });
  } catch (err) {
    if (handleAuthError(err, res)) return;
    throw err;
  }
}

export async function verifyOtp(req: Request, res: Response) {
  try {
    const body = verify_body.parse(req.body ?? {});
    const data = await authService.verifyOtp(body);
    if (!data.hunter) {
      res.status(500).json({
        success: false,
        code: "CREATE_FAILED",
        message: "Hunter missing after verify",
      });
      return;
    }
    const session_token = setSessionCookie(res, data.hunter.id);
    res.json({
      success: true,
      data: {
        hunter: data.hunter,
        created: data.created,
        sessionToken: session_token,
      },
    });
  } catch (err) {
    if (handleAuthError(err, res)) return;
    throw err;
  }
}

export async function logout(_req: Request, res: Response) {
  clearSessionCookie(res);
  res.json({ success: true, data: { ok: true } });
}

export async function me(req: Request, res: Response) {
  if (!req.hunter_id) {
    res.status(401).json({
      success: false,
      code: "UNAUTHORIZED",
      message: "Sign in required",
    });
    return;
  }
  const hunter = await authService.getMe(req.hunter_id);
  if (!hunter) {
    clearSessionCookie(res);
    res.status(401).json({
      success: false,
      code: "UNAUTHORIZED",
      message: "Session hunter not found",
    });
    return;
  }
  res.json({ success: true, data: { hunter } });
}
