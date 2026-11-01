import { createHmac, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import { env } from "../config/env.js";

export const SESSION_COOKIE = "solo_session";
const SESSION_TTL_SEC = 60 * 60 * 24 * 30; // 30 days

type SessionPayload = {
  hunter_id: number;
  exp: number;
};

function b64url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf.toString("base64url");
}

function sign(payload: SessionPayload): string {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64url(JSON.stringify(payload));
  const sig = createHmac("sha256", env.SESSION_SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${sig}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  if (!header || !body || !sig) return null;

  const expected = createHmac("sha256", env.SESSION_SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");

  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (!payload.hunter_id || !payload.exp) return null;
    if (payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function createSessionToken(hunter_id: number): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SEC;
  return sign({ hunter_id, exp });
}

export function setSessionCookie(res: Response, hunter_id: number): void {
  const token = createSessionToken(hunter_id);
  const secure = env.NODE_ENV === "production";
  const same_site = secure ? "None" : "Lax";
  const max_age = SESSION_TTL_SEC;

  res.setHeader(
    "Set-Cookie",
    [
      `${SESSION_COOKIE}=${token}`,
      "Path=/",
      "HttpOnly",
      `Max-Age=${max_age}`,
      `SameSite=${same_site}`,
      ...(secure ? ["Secure"] : []),
    ].join("; "),
  );
}

export function clearSessionCookie(res: Response): void {
  const secure = env.NODE_ENV === "production";
  const same_site = secure ? "None" : "Lax";
  res.setHeader(
    "Set-Cookie",
    [
      `${SESSION_COOKIE}=`,
      "Path=/",
      "HttpOnly",
      "Max-Age=0",
      `SameSite=${same_site}`,
      ...(secure ? ["Secure"] : []),
    ].join("; "),
  );
}

export function readCookie(req: Request, name: string): string | null {
  const raw = req.headers.cookie;
  if (!raw) return null;
  for (const part of raw.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    if (key !== name) continue;
    return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return null;
}
