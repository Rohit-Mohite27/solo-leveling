import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { env } from "../config/env.js";

export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) return digits;
  if (digits.length === 12 && digits.startsWith("91") && /^91[6-9]\d{9}$/.test(digits)) {
    return digits.slice(2);
  }
  return null;
}

export function hashOtp(phone: string, code: string): string {
  return createHash("sha256")
    .update(`${phone}:${code}:${env.SESSION_SECRET}`)
    .digest("hex");
}

export function generateOtpCode(): string {
  if (env.OTP_MODE === "static") return env.STATIC_OTP;
  return String(randomInt(100000, 999999));
}

export function otpMatches(phone: string, code: string, code_hash: string): boolean {
  const next = Buffer.from(hashOtp(phone, code));
  const prev = Buffer.from(code_hash);
  if (next.length !== prev.length) return false;
  return timingSafeEqual(next, prev);
}

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

function extractReqId(json: Msg91Json): string | null {
  if (typeof json.reqId === "string" && json.reqId) return json.reqId;
  if (typeof json.message === "string" && json.message) return json.message;
  return null;
}

/**
 * MSG91 OTP Widget — MSG91 generates & sends the SMS.
 * Returns reqId to store for verify.
 */
export async function sendMsg91WidgetOtp(phone: string): Promise<string> {
  const identifier = `${env.MSG91_COUNTRY_CODE}${phone}`;
  const res = await fetch("https://control.msg91.com/api/v5/widget/sendOtp", {
    method: "POST",
    headers: msg91Headers(),
    body: JSON.stringify({
      widgetId: env.MSG91_WIDGET_ID,
      identifier,
    }),
  });

  const text = await res.text().catch(() => "");
  let json: Msg91Json = {};
  try {
    json = JSON.parse(text) as Msg91Json;
  } catch {
    // non-JSON
  }

  // Widget API often returns HTTP 200 with type:"error"
  if (!res.ok || json.type === "error") {
    const detail =
      typeof json.message === "string" ? json.message : text.slice(0, 200) || `HTTP ${res.status}`;
    throw new Error(
      `MSG91 send failed: ${detail}. Check auth key, widget id, IP whitelist (disable IP security on authkey for Render), and KYC/demo mode.`,
    );
  }

  const req_id = extractReqId(json);
  if (!req_id) {
    throw new Error(`MSG91 send succeeded but no reqId in response: ${text.slice(0, 200)}`);
  }
  return req_id;
}

/** Verify OTP with MSG91 Widget using reqId from send. */
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
    // non-JSON
  }

  if (!res.ok || json.type === "error") {
    const detail =
      typeof json.message === "string" ? json.message : text.slice(0, 200) || `HTTP ${res.status}`;
    throw new Error(detail);
  }
}

/** Dev-only: log static OTP. */
export async function sendOtpSms(phone: string, code: string): Promise<void> {
  console.log(`[otp:static] phone=${phone} code=${code}`);
}
