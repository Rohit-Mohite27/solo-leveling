import { and, desc, eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { daily_log_items, daily_logs } from "../../db/schema.js";

export async function listRecentLogs(hunter_id: number, limit = 30) {
  return db
    .select()
    .from(daily_logs)
    .where(eq(daily_logs.hunter_id, hunter_id))
    .orderBy(desc(daily_logs.date_key))
    .limit(limit);
}

export async function getOrCreateDailyLog(hunter_id: number, date_key: string) {
  const existing = await db
    .select()
    .from(daily_logs)
    .where(and(eq(daily_logs.hunter_id, hunter_id), eq(daily_logs.date_key, date_key)))
    .limit(1);

  if (existing[0]) return existing[0];

  const inserted = await db
    .insert(daily_logs)
    .values({
      hunter_id,
      date_key,
      status: "empty",
      submitted: false,
    })
    .$returningId();

  const id = inserted[0]?.id;
  if (!id) throw new Error("Failed to create daily log");

  const rows = await db.select().from(daily_logs).where(eq(daily_logs.id, id)).limit(1);
  const row = rows[0];
  if (!row) throw new Error("Daily log missing after insert");
  return row;
}

export async function listItemsForLog(daily_log_id: number) {
  return db.select().from(daily_log_items).where(eq(daily_log_items.daily_log_id, daily_log_id));
}

export async function upsertLogItem(
  hunter_id: number,
  date_key: string,
  quest_id: number,
  input: { value: string; cleared: boolean },
) {
  const log = await getOrCreateDailyLog(hunter_id, date_key);
  const existing = await db
    .select()
    .from(daily_log_items)
    .where(
      and(eq(daily_log_items.daily_log_id, log.id), eq(daily_log_items.quest_id, quest_id)),
    )
    .limit(1);

  if (existing[0]) {
    await db
      .update(daily_log_items)
      .set({ value: input.value, cleared: input.cleared })
      .where(eq(daily_log_items.id, existing[0].id));
    const rows = await db
      .select()
      .from(daily_log_items)
      .where(eq(daily_log_items.id, existing[0].id))
      .limit(1);
    return rows[0] ?? null;
  }

  const inserted = await db
    .insert(daily_log_items)
    .values({
      daily_log_id: log.id,
      quest_id,
      value: input.value,
      cleared: input.cleared,
    })
    .$returningId();
  const id = inserted[0]?.id;
  if (!id) throw new Error("Failed to create log item");
  const rows = await db.select().from(daily_log_items).where(eq(daily_log_items.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function markSubmitted(
  daily_log_id: number,
  status: "complete" | "partial" | "failed" | "empty",
) {
  await db
    .update(daily_logs)
    .set({ submitted: true, status })
    .where(eq(daily_logs.id, daily_log_id));
}
