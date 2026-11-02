import {
  generateOtpCode,
  hashOtp,
  normalizePhone,
  otpMatches,
  sendOtpSms,
} from "../../lib/otp.js";
import * as huntersRepository from "../hunters/hunters.repository.js";
import * as questsRepository from "../quests/quests.repository.js";
import * as authRepository from "./auth.repository.js";

const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const STARTER_QUESTS = [
  { name: "Push-ups", kind: "count" as const, target: "50", unit: "reps", accent: "#7c6cf0", sort_order: 0 },
  { name: "Sit-ups", kind: "count" as const, target: "50", unit: "reps", accent: "#5b9cf5", sort_order: 1 },
  { name: "Run", kind: "distance" as const, target: "3", unit: "km", accent: "#f0a05a", sort_order: 2 },
  { name: "No Fap", kind: "yesno" as const, target: "1", unit: "done", accent: "#e85a7a", sort_order: 3 },
  { name: "Steps", kind: "steps" as const, target: "10000", unit: "steps", accent: "#5ec4a8", sort_order: 4 },
];

export class AuthError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export async function requestOtp(raw_phone: string) {
  const phone = normalizePhone(raw_phone);
  if (!phone) {
    throw new AuthError("INVALID_PHONE", "Enter a valid 10-digit Indian mobile number");
  }

  const code = generateOtpCode();
  const code_hash = hashOtp(phone, code);
  const expires_at = new Date(Date.now() + OTP_TTL_MS);

  await authRepository.upsertOtpChallenge({
    identifier: phone,
    code_hash,
    expires_at,
  });

  try {
    await sendOtpSms(phone, code);
  } catch (err) {
    const message = err instanceof Error ? err.message : "SMS send failed";
    throw new AuthError("OTP_SEND_FAILED", message, 502);
  }

  return { phone, expires_in_sec: Math.floor(OTP_TTL_MS / 1000) };
}

export async function verifyOtp(input: { phone: string; otp: string; name: string }) {
  const phone = normalizePhone(input.phone);
  if (!phone) {
    throw new AuthError("INVALID_PHONE", "Enter a valid 10-digit Indian mobile number");
  }

  const name = input.name.trim();
  if (!name || name.length > 120) {
    throw new AuthError("INVALID_NAME", "Name is required (max 120 characters)");
  }

  const otp = input.otp.trim();
  if (!/^\d{4,8}$/.test(otp)) {
    throw new AuthError("INVALID_OTP", "Enter the OTP from your SMS");
  }

  const challenge = await authRepository.findOtpChallenge(phone);
  if (!challenge) {
    throw new AuthError("OTP_NOT_FOUND", "Request a new OTP first", 404);
  }

  if (challenge.expires_at.getTime() < Date.now()) {
    await authRepository.deleteOtpChallenge(phone);
    throw new AuthError("OTP_EXPIRED", "OTP expired — request a new one", 410);
  }

  if (challenge.attempts >= MAX_ATTEMPTS) {
    await authRepository.deleteOtpChallenge(phone);
    throw new AuthError("OTP_LOCKED", "Too many attempts — request a new OTP", 429);
  }

  if (!otpMatches(phone, otp, challenge.code_hash)) {
    await authRepository.bumpOtpAttempts(phone, challenge.attempts + 1);
    throw new AuthError("OTP_INVALID", "Incorrect OTP", 401);
  }

  await authRepository.deleteOtpChallenge(phone);

  let hunter = await huntersRepository.findHunterByPhone(phone);
  let created = false;

  if (!hunter) {
    hunter = await huntersRepository.insertHunter({ name, phone });
    if (!hunter) throw new AuthError("CREATE_FAILED", "Could not create hunter", 500);
    created = true;
    for (const q of STARTER_QUESTS) {
      await questsRepository.insertQuest({
        hunter_id: hunter.id,
        name: q.name,
        kind: q.kind,
        target: q.target,
        unit: q.unit,
        accent: q.accent,
        sort_order: q.sort_order,
      });
    }
  } else if (hunter.name !== name) {
    hunter = await huntersRepository.updateHunterName(hunter.id, name);
  }

  return { hunter, created };
}

export async function getMe(hunter_id: number) {
  return huntersRepository.findHunterById(hunter_id);
}
