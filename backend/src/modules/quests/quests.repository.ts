import { and, asc, eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { daily_log_items, quests } from "../../db/schema.js";

export async function findQuestsByHunterId(hunter_id: number) {
  return db
    .select()
    .from(quests)
    .where(and(eq(quests.hunter_id, hunter_id), eq(quests.is_active, true)))
    .orderBy(asc(quests.sort_order), asc(quests.id));
}

/** Active + soft-deleted — needed when replaying historical day XP. */
export async function findAllQuestsByHunterId(hunter_id: number) {
  return db
    .select()
    .from(quests)
    .where(eq(quests.hunter_id, hunter_id))
    .orderBy(asc(quests.sort_order), asc(quests.id));
}

/** One-shot rename for hunters seeded with the old Gym Session starter. */
export async function renameGymSessionToNoFap(hunter_id: number) {
  await db
    .update(quests)
    .set({ name: "No Fap", kind: "yesno", target: "1", unit: "done", accent: "#e85a7a" })
    .where(and(eq(quests.hunter_id, hunter_id), eq(quests.name, "Gym Session"), eq(quests.is_active, true)));
}

/** Ensure the fixed Steps bar exists (reactivate soft-deleted or insert). */
export async function ensureStepsQuest(hunter_id: number) {
  const rows = await db
    .select()
    .from(quests)
    .where(and(eq(quests.hunter_id, hunter_id), eq(quests.kind, "steps")))
    .limit(1);
  const existing = rows[0];
  if (existing) {
    if (!existing.is_active) {
      await db.update(quests).set({ is_active: true }).where(eq(quests.id, existing.id));
    }
    return;
  }
  await db.insert(quests).values({
    hunter_id,
    name: "Steps",
    kind: "steps",
    target: "10000",
    unit: "steps",
    accent: "#5ec4a8",
    sort_order: 4,
    is_active: true,
  });
}

export async function insertQuest(values: {
  hunter_id: number;
  name: string;
  kind: "count" | "distance" | "duration" | "yesno" | "steps";
  target: string;
  unit: string;
  accent: string;
  sort_order?: number;
}) {
  const result = await db
    .insert(quests)
    .values({
      hunter_id: values.hunter_id,
      name: values.name,
      kind: values.kind,
      target: values.target,
      unit: values.unit,
      accent: values.accent,
      sort_order: values.sort_order ?? 0,
    })
    .$returningId();
  const id = result[0]?.id;
  if (!id) throw new Error("Failed to create quest");
  const rows = await db.select().from(quests).where(eq(quests.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function findQuestById(id: number) {
  const rows = await db.select().from(quests).where(eq(quests.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function softDeleteQuest(id: number) {
  // Drop log rows for this quest so removed goals don't keep showing as "completed"
  await db.delete(daily_log_items).where(eq(daily_log_items.quest_id, id));
  await db.update(quests).set({ is_active: false }).where(eq(quests.id, id));
}
