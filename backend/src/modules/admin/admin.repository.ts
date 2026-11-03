import { and, asc, count, desc, eq, gte, inArray, like, or, sql } from "drizzle-orm";
import { db } from "../../db/client.js";
import {
  ally_unlocks,
  daily_log_items,
  daily_logs,
  hunters,
  otp_challenges,
  quests,
} from "../../db/schema.js";

export async function countHunters() {
  const rows = await db.select({ value: count() }).from(hunters);
  return Number(rows[0]?.value ?? 0);
}

export async function countSubmittedOnDate(date_key: string) {
  const rows = await db
    .select({ value: count() })
    .from(daily_logs)
    .where(and(eq(daily_logs.date_key, date_key), eq(daily_logs.submitted, true)));
  return Number(rows[0]?.value ?? 0);
}

/** Distinct hunters with any daily log on/after date_key. */
export async function countActiveSince(date_key: string) {
  const rows = await db
    .select({ value: sql<number>`count(distinct ${daily_logs.hunter_id})` })
    .from(daily_logs)
    .where(gte(daily_logs.date_key, date_key));
  return Number(rows[0]?.value ?? 0);
}

export async function countOtpsSince(since: Date) {
  const rows = await db
    .select({ value: count() })
    .from(otp_challenges)
    .where(gte(otp_challenges.created_at, since));
  return Number(rows[0]?.value ?? 0);
}

export async function listHunters(search?: string) {
  const q = search?.trim();
  if (q) {
    const pattern = `%${q}%`;
    return db
      .select()
      .from(hunters)
      .where(
        or(
          like(hunters.name, pattern),
          like(hunters.phone, pattern),
          like(hunters.email, pattern),
        ),
      )
      .orderBy(desc(hunters.id))
      .limit(200);
  }
  return db.select().from(hunters).orderBy(desc(hunters.id)).limit(200);
}

export async function findHunter(id: number) {
  const rows = await db.select().from(hunters).where(eq(hunters.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listQuests(hunter_id: number) {
  return db
    .select()
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

export async function findLogByDate(hunter_id: number, date_key: string) {
  const rows = await db
    .select()
    .from(daily_logs)
    .where(and(eq(daily_logs.hunter_id, hunter_id), eq(daily_logs.date_key, date_key)))
    .limit(1);
  return rows[0] ?? null;
}

export async function listItemsForLog(daily_log_id: number) {
  return db
    .select({
      id: daily_log_items.id,
      quest_id: daily_log_items.quest_id,
      value: daily_log_items.value,
      cleared: daily_log_items.cleared,
      quest_name: quests.name,
      quest_kind: quests.kind,
      quest_unit: quests.unit,
      quest_target: quests.target,
      quest_active: quests.is_active,
    })
    .from(daily_log_items)
    .leftJoin(quests, eq(quests.id, daily_log_items.quest_id))
    .where(eq(daily_log_items.daily_log_id, daily_log_id));
}

export async function resetHunterProgress(hunter_id: number) {
  const logs = await db.select().from(daily_logs).where(eq(daily_logs.hunter_id, hunter_id));
  for (const log of logs) {
    await db.delete(daily_log_items).where(eq(daily_log_items.daily_log_id, log.id));
  }
  await db.delete(daily_logs).where(eq(daily_logs.hunter_id, hunter_id));
  await db.delete(ally_unlocks).where(eq(ally_unlocks.hunter_id, hunter_id));
  await db.delete(quests).where(eq(quests.hunter_id, hunter_id));
  await db.update(hunters).set({ level: 1, xp: 0, streak: 0 }).where(eq(hunters.id, hunter_id));
}

/** Delete one or more calendar days of logs for a hunter (XP/level/streak unchanged). */
export async function deleteHunterLogsByDates(hunter_id: number, date_keys: string[]) {
  const keys = [...new Set(date_keys.map((k) => k.trim()).filter(Boolean))];
  if (keys.length === 0) return { deleted: 0 as const, dateKeys: [] as string[] };

  const logs = await db
    .select()
    .from(daily_logs)
    .where(and(eq(daily_logs.hunter_id, hunter_id), inArray(daily_logs.date_key, keys)));

  for (const log of logs) {
    await db.delete(daily_log_items).where(eq(daily_log_items.daily_log_id, log.id));
  }
  if (logs.length > 0) {
    await db
      .delete(daily_logs)
      .where(and(eq(daily_logs.hunter_id, hunter_id), inArray(daily_logs.date_key, keys)));
  }

  return {
    deleted: logs.length,
    dateKeys: logs.map((l) => l.date_key),
  };
}

/** Wipe related rows then delete the hunter account. */
export async function deleteHunter(hunter_id: number) {
  const hunter = await findHunter(hunter_id);
  if (!hunter) return false;

  const logs = await db.select().from(daily_logs).where(eq(daily_logs.hunter_id, hunter_id));
  for (const log of logs) {
    await db.delete(daily_log_items).where(eq(daily_log_items.daily_log_id, log.id));
  }
  await db.delete(daily_logs).where(eq(daily_logs.hunter_id, hunter_id));
  await db.delete(ally_unlocks).where(eq(ally_unlocks.hunter_id, hunter_id));
  await db.delete(quests).where(eq(quests.hunter_id, hunter_id));

  // OTP rows are keyed by identifier, not hunter_id
  const identifiers = [hunter.email, hunter.phone].filter(
    (v): v is string => typeof v === "string" && v.length > 0,
  );
  for (const identifier of identifiers) {
    await db.delete(otp_challenges).where(eq(otp_challenges.identifier, identifier));
  }

  await db.delete(hunters).where(eq(hunters.id, hunter_id));
  return true;
}

export async function insertStarterQuests(hunter_id: number) {
  const starters = [
    { name: "Push-ups", kind: "count" as const, target: "50", unit: "reps", accent: "#7c6cf0", sort_order: 0 },
    { name: "Sit-ups", kind: "count" as const, target: "50", unit: "reps", accent: "#5b9cf5", sort_order: 1 },
    { name: "Run", kind: "distance" as const, target: "3", unit: "km", accent: "#f0a05a", sort_order: 2 },
    { name: "No Fap", kind: "yesno" as const, target: "1", unit: "done", accent: "#e85a7a", sort_order: 3 },
    { name: "Steps", kind: "steps" as const, target: "10000", unit: "steps", accent: "#5ec4a8", sort_order: 4 },
  ];
  for (const q of starters) {
    await db.insert(quests).values({
      hunter_id,
      name: q.name,
      kind: q.kind,
      target: q.target,
      unit: q.unit,
      accent: q.accent,
      sort_order: q.sort_order,
      is_active: true,
    });
  }
}
