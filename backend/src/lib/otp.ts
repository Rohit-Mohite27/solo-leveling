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

export function normalizeEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) return null;
  return email;
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

/** E.164 for India: +91XXXXXXXXXX */
export function toE164India(phone10: string): string {
  return `+${env.SMS_COUNTRY_CODE}${phone10}`;
}

/**
 * Send OTP SMS via TextBee (your Android phone + SIM).
 * Docs: POST /gateway/send-sms with x-api-key
 */
export async function sendOtpSmsTextbee(phone10: string, code: string): Promise<void> {
  const base = env.TEXTBEE_BASE_URL.replace(/\/$/, "");
  const url = `${base}/gateway/send-sms`;
  const recipient = toE164India(phone10);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.TEXTBEE_API_KEY,
    },
    body: JSON.stringify({
      deviceId: env.TEXTBEE_DEVICE_ID,
      recipients: [recipient],
      message: `Your Solo Leveling login code is ${code}. Valid for 5 minutes.`,
    }),
  });

  const text = await res.text().catch(() => "");
  if (!res.ok) {
    throw new Error(`TextBee send failed (${res.status}): ${text.slice(0, 240)}`);
  }

  try {
    const json = JSON.parse(text) as { data?: { success?: boolean; message?: string } };
    if (json.data && json.data.success === false) {
      throw new Error(json.data.message ?? "TextBee rejected send");
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("TextBee")) throw err;
    // non-JSON success body is fine
  }
}

export async function sendOtpSms(phone10: string, code: string): Promise<void> {
  if (env.OTP_MODE === "static") {
    console.log(`[otp:static] phone=${phone10} code=${code}`);
    return;
  }
  if (env.OTP_MODE === "textbee") {
    await sendOtpSmsTextbee(phone10, code);
    return;
  }
  throw new Error(`SMS OTP not configured for OTP_MODE=${env.OTP_MODE}`);
}
