import {
  generateOtpCode,
  hashOtp,
  normalizeEmail,
  otpMatches,
  sendOtpEmail,
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
  { name: "Gym Session", kind: "yesno" as const, target: "1", unit: "done", accent: "#5ec4a8", sort_order: 3 },
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

export async function requestOtp(raw_email: string) {
  const email = normalizeEmail(raw_email);
  if (!email) {
    throw new AuthError("INVALID_EMAIL", "Enter a valid email address");
  }

  const code = generateOtpCode();
  const code_hash = hashOtp(email, code);
  const expires_at = new Date(Date.now() + OTP_TTL_MS);

  await authRepository.upsertOtpChallenge({
    identifier: email,
    code_hash,
    expires_at,
  });

  try {
    await sendOtpEmail(email, code);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Email send failed";
    throw new AuthError("OTP_SEND_FAILED", message, 502);
  }

  return { email, expires_in_sec: Math.floor(OTP_TTL_MS / 1000) };
}

export async function verifyOtp(input: { email: string; otp: string; name: string }) {
  const email = normalizeEmail(input.email);
  if (!email) {
    throw new AuthError("INVALID_EMAIL", "Enter a valid email address");
  }

  const name = input.name.trim();
  if (!name || name.length > 120) {
    throw new AuthError("INVALID_NAME", "Name is required (max 120 characters)");
  }

  const otp = input.otp.trim();
  if (!/^\d{4,8}$/.test(otp)) {
    throw new AuthError("INVALID_OTP", "Enter the OTP from your email");
  }

  const challenge = await authRepository.findOtpChallenge(email);
  if (!challenge) {
    throw new AuthError("OTP_NOT_FOUND", "Request a new OTP first", 404);
  }

  if (challenge.expires_at.getTime() < Date.now()) {
    await authRepository.deleteOtpChallenge(email);
    throw new AuthError("OTP_EXPIRED", "OTP expired — request a new one", 410);
  }

  if (challenge.attempts >= MAX_ATTEMPTS) {
    await authRepository.deleteOtpChallenge(email);
    throw new AuthError("OTP_LOCKED", "Too many attempts — request a new OTP", 429);
  }

  if (!otpMatches(email, otp, challenge.code_hash)) {
    await authRepository.bumpOtpAttempts(email, challenge.attempts + 1);
    throw new AuthError("OTP_INVALID", "Incorrect OTP", 401);
  }

  await authRepository.deleteOtpChallenge(email);

  let hunter = await huntersRepository.findHunterByEmail(email);
  let created = false;

  if (!hunter) {
    hunter = await huntersRepository.insertHunter({ name, email });
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
