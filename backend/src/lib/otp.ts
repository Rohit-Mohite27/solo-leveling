import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { env } from "../config/env.js";

export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  // Accept 10-digit local or 91XXXXXXXXXX
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

/** Send OTP via MSG91 (or log in static mode). */
export async function sendOtpSms(phone: string, code: string): Promise<void> {
  if (env.OTP_MODE === "static") {
    console.log(`[otp:static] phone=${phone} code=${code}`);
    return;
  }

  const mobile = `${env.MSG91_COUNTRY_CODE}${phone}`;
  const url = "https://control.msg91.com/api/v5/otp";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authkey: env.MSG91_AUTH_KEY,
    },
    body: JSON.stringify({
      template_id: env.MSG91_TEMPLATE_ID,
      mobile,
      otp: code,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`MSG91 OTP send failed (${res.status}): ${text.slice(0, 200)}`);
  }
}
