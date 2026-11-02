import type { NextFunction, Request, Response } from "express";
import {
  ADMIN_COOKIE,
  readBearerToken,
  readCookie,
  verifyAdminToken,
} from "../lib/session.js";

declare global {
  namespace Express {
    interface Request {
      is_admin?: boolean;
    }
  }
}

/** Attach is_admin from Bearer or solo_admin cookie. */
export function attachAdmin(req: Request, _res: Response, next: NextFunction): void {
  const token = readBearerToken(req) ?? readCookie(req, ADMIN_COOKIE);
  if (token && verifyAdminToken(token)) {
    req.is_admin = true;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.is_admin) {
    res.status(401).json({
      success: false,
      code: "UNAUTHORIZED",
      message: "Admin sign-in required",
    });
    return;
  }
  next();
}
