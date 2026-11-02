import { eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { otp_challenges } from "../../db/schema.js";

export async function upsertOtpChallenge(input: {
  identifier: string;
  code_hash: string;
  expires_at: Date;
}) {
  const existing = await findOtpChallenge(input.identifier);
  if (existing) {
    await db
      .update(otp_challenges)
      .set({
        code_hash: input.code_hash,
        expires_at: input.expires_at,
        attempts: 0,
      })
      .where(eq(otp_challenges.identifier, input.identifier));
    return;
  }

  await db.insert(otp_challenges).values({
    identifier: input.identifier,
    code_hash: input.code_hash,
    expires_at: input.expires_at,
    attempts: 0,
  });
}

export async function findOtpChallenge(identifier: string) {
  const rows = await db
    .select()
    .from(otp_challenges)
    .where(eq(otp_challenges.identifier, identifier))
    .limit(1);
  return rows[0] ?? null;
}

export async function bumpOtpAttempts(identifier: string, attempts: number) {
  await db
    .update(otp_challenges)
    .set({ attempts })
    .where(eq(otp_challenges.identifier, identifier));
}

export async function deleteOtpChallenge(identifier: string) {
  await db.delete(otp_challenges).where(eq(otp_challenges.identifier, identifier));
}
