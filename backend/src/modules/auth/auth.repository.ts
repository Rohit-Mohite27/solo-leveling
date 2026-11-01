import { eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { otp_challenges } from "../../db/schema.js";

export async function upsertOtpChallenge(input: {
  phone: string;
  code_hash: string;
  expires_at: Date;
}) {
  const existing = await findOtpChallenge(input.phone);
  if (existing) {
    await db
      .update(otp_challenges)
      .set({
        code_hash: input.code_hash,
        expires_at: input.expires_at,
        attempts: 0,
      })
      .where(eq(otp_challenges.phone, input.phone));
    return;
  }

  await db.insert(otp_challenges).values({
    phone: input.phone,
    code_hash: input.code_hash,
    expires_at: input.expires_at,
    attempts: 0,
  });
}

export async function findOtpChallenge(phone: string) {
  const rows = await db
    .select()
    .from(otp_challenges)
    .where(eq(otp_challenges.phone, phone))
    .limit(1);
  return rows[0] ?? null;
}

export async function bumpOtpAttempts(phone: string, attempts: number) {
  await db
    .update(otp_challenges)
    .set({ attempts })
    .where(eq(otp_challenges.phone, phone));
}

export async function deleteOtpChallenge(phone: string) {
  await db.delete(otp_challenges).where(eq(otp_challenges.phone, phone));
}
