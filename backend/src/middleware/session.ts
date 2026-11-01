import type { NextFunction, Request, Response } from "express";
import { readCookie, SESSION_COOKIE, verifySessionToken } from "../lib/session.js";
import { parseId } from "../lib/params.js";

declare global {
  namespace Express {
    interface Request {
      hunter_id?: number;
    }
  }
}

/** Attach hunter_id from solo_session cookie when present. */
export function attachSession(req: Request, _res: Response, next: NextFunction): void {
  const token = readCookie(req, SESSION_COOKIE);
  if (token) {
    const payload = verifySessionToken(token);
    if (payload) req.hunter_id = payload.hunter_id;
  }
  next();
}

/** Require a valid session. */
export function requireSession(req: Request, res: Response, next: NextFunction): void {
  if (!req.hunter_id) {
    res.status(401).json({
      success: false,
      code: "UNAUTHORIZED",
      message: "Sign in required",
    });
    return;
  }
  next();
}

/** Ensure :hunterId (or :id for hunters) matches the session hunter. */
export function requireSelfHunterParam(param_name = "hunterId") {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.hunter_id) {
      res.status(401).json({
        success: false,
        code: "UNAUTHORIZED",
        message: "Sign in required",
      });
      return;
    }
    const raw = req.params[param_name];
    const id = parseId(raw);
    if (id === null || id !== req.hunter_id) {
      res.status(403).json({
        success: false,
        code: "FORBIDDEN",
        message: "Cannot access another hunter",
      });
      return;
    }
    next();
  };
}
