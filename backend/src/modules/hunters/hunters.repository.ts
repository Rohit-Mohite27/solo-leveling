import { eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { hunters } from "../../db/schema.js";

export async function findHunterById(id: number) {
  const rows = await db.select().from(hunters).where(eq(hunters.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function findHunterByPhone(phone: string) {
  const rows = await db.select().from(hunters).where(eq(hunters.phone, phone)).limit(1);
  return rows[0] ?? null;
}

export async function findHunterByEmail(email: string) {
  const rows = await db.select().from(hunters).where(eq(hunters.email, email)).limit(1);
  return rows[0] ?? null;
}

export async function insertHunter(input: { name: string; phone: string }) {
  const result = await db
    .insert(hunters)
    .values({ name: input.name, phone: input.phone, email: null })
    .$returningId();
  const id = result[0]?.id;
  if (!id) throw new Error("Failed to create hunter");
  return findHunterById(id);
}

export async function updateHunterName(id: number, name: string) {
  await db.update(hunters).set({ name }).where(eq(hunters.id, id));
  return findHunterById(id);
}

export async function updateHunterProgress(
  id: number,
  input: { level: number; xp: number; streak: number },
) {
  await db
    .update(hunters)
    .set({
      level: input.level,
      xp: input.xp,
      streak: input.streak,
    })
    .where(eq(hunters.id, id));
  return findHunterById(id);
}
