import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { env } from "../config/env.js";

export function normalizeEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) return null;
  return email;
}

export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) return digits;
  if (digits.length === 12 && digits.startsWith("91") && /^91[6-9]\d{9}$/.test(digits)) {
    return digits.slice(2);
  }
  return null;
}

export function hashOtp(identifier: string, code: string): string {
  return createHash("sha256")
    .update(`${identifier}:${code}:${env.SESSION_SECRET}`)
    .digest("hex");
}

export function generateOtpCode(): string {
  if (env.OTP_MODE === "static") return env.STATIC_OTP;
  return String(randomInt(100000, 999999));
}

export function otpMatches(identifier: string, code: string, code_hash: string): boolean {
  const next = Buffer.from(hashOtp(identifier, code));
  const prev = Buffer.from(code_hash);
  if (next.length !== prev.length) return false;
  return timingSafeEqual(next, prev);
}

/** Send login OTP email via Resend HTTP API (no extra npm package). */
export async function sendOtpEmail(email: string, code: string): Promise<void> {
  if (env.OTP_MODE === "static") {
    console.log(`[otp:static] email=${email} code=${code}`);
    return;
  }

  if (env.OTP_MODE !== "resend") {
    throw new Error(`Email OTP not supported for OTP_MODE=${env.OTP_MODE}`);
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.OTP_FROM_EMAIL,
      to: [email],
      subject: "Your Solo Leveling login code",
      html: `
        <p>Hunter,</p>
        <p>Your Solo Leveling login code is:</p>
        <p style="font-size:24px;font-weight:700;letter-spacing:4px">${code}</p>
        <p>It expires in 5 minutes. If you did not request this, ignore this email.</p>
      `,
      text: `Your Solo Leveling login code is ${code}. It expires in 5 minutes.`,
    }),
  });

  const text = await res.text().catch(() => "");
  if (!res.ok) {
    throw new Error(`Resend failed (${res.status}): ${text.slice(0, 240)}`);
  }
}

/** Legacy MSG91 widget helpers (unused by email gate). */
type Msg91Json = {
  type?: string;
  message?: string | Record<string, unknown>;
  reqId?: string;
};

function msg91Headers(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    authkey: env.MSG91_AUTH_KEY,
  };
}

export async function sendMsg91WidgetOtp(phone: string): Promise<string> {
  const identifier = `${env.MSG91_COUNTRY_CODE}${phone}`;
  const res = await fetch("https://control.msg91.com/api/v5/widget/sendOtp", {
    method: "POST",
    headers: msg91Headers(),
    body: JSON.stringify({ widgetId: env.MSG91_WIDGET_ID, identifier }),
  });
  const text = await res.text().catch(() => "");
  let json: Msg91Json = {};
  try {
    json = JSON.parse(text) as Msg91Json;
  } catch {
    // ignore
  }
  if (!res.ok || json.type === "error") {
    const detail =
      typeof json.message === "string" ? json.message : text.slice(0, 200) || `HTTP ${res.status}`;
    throw new Error(`MSG91 send failed: ${detail}`);
  }
  const req_id =
    typeof json.reqId === "string"
      ? json.reqId
      : typeof json.message === "string"
        ? json.message
        : null;
  if (!req_id) throw new Error(`MSG91 send: no reqId (${text.slice(0, 200)})`);
  return req_id;
}

export async function verifyMsg91WidgetOtp(req_id: string, otp: string): Promise<void> {
  const res = await fetch("https://control.msg91.com/api/v5/widget/verifyOtp", {
    method: "POST",
    headers: msg91Headers(),
    body: JSON.stringify({
      widgetId: env.MSG91_WIDGET_ID,
      otp,
      reqId: req_id,
    }),
  });
  const text = await res.text().catch(() => "");
  let json: Msg91Json = {};
  try {
    json = JSON.parse(text) as Msg91Json;
  } catch {
    // ignore
  }
  if (!res.ok || json.type === "error") {
    const detail =
      typeof json.message === "string" ? json.message : text.slice(0, 200) || `HTTP ${res.status}`;
    throw new Error(detail);
  }
}
