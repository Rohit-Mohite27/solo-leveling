import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "../../db/client.js";
import { daily_log_items, daily_logs, hunters, quests } from "../../db/schema.js";

export async function listByStreak(limit = 50) {
  return db
    .select({
      id: hunters.id,
      name: hunters.name,
      level: hunters.level,
      xp: hunters.xp,
      streak: hunters.streak,
    })
    .from(hunters)
    .orderBy(desc(hunters.streak), desc(hunters.level), desc(hunters.xp), asc(hunters.id))
    .limit(limit);
}

export async function findPublicHunter(id: number) {
  const rows = await db
    .select({
      id: hunters.id,
      name: hunters.name,
      level: hunters.level,
      xp: hunters.xp,
      streak: hunters.streak,
    })
    .from(hunters)
    .where(eq(hunters.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function listActiveQuests(hunter_id: number) {
  return db
    .select({
      id: quests.id,
      name: quests.name,
      kind: quests.kind,
      target: quests.target,
      unit: quests.unit,
      accent: quests.accent,
    })
    .from(quests)
    .where(and(eq(quests.hunter_id, hunter_id), eq(quests.is_active, true)))
    .orderBy(asc(quests.sort_order), asc(quests.id));
}

export async function listRecentLogs(hunter_id: number, limit = 14) {
  return db
    .select()
    .from(daily_logs)
    .where(eq(daily_logs.hunter_id, hunter_id))
    .orderBy(desc(daily_logs.date_key))
    .limit(limit);
}

export async function listItemsForLogs(log_ids: number[]) {
  if (log_ids.length === 0) return [];
  return db
    .select({
      id: daily_log_items.id,
      daily_log_id: daily_log_items.daily_log_id,
      quest_id: daily_log_items.quest_id,
      value: daily_log_items.value,
      cleared: daily_log_items.cleared,
      quest_name: quests.name,
      quest_kind: quests.kind,
      quest_unit: quests.unit,
    })
    .from(daily_log_items)
    .leftJoin(quests, eq(quests.id, daily_log_items.quest_id))
    .where(inArray(daily_log_items.daily_log_id, log_ids));
}
