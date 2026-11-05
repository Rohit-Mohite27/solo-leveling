import * as dailyLogsRepository from "./daily-logs.repository.js";
import * as huntersRepository from "../hunters/hunters.repository.js";
import * as questsRepository from "../quests/quests.repository.js";

/** IST calendar day YYYY-MM-DD */
export function todayKeyIst(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function xpForLevel(level: number): number {
  return 100 + (level - 1) * 40;
}

/** Streak quest — held keeps/grows streak; broken resets to 0. */
export function isNoFapQuest(quest: { name: string; kind: string }): boolean {
  const n = quest.name.trim().toLowerCase().replace(/[-_]/g, " ");
  return (
    quest.kind === "yesno" &&
    (n.includes("no fap") || n.includes("nofap") || n === "gym session")
  );
}

export function shiftDateKey(date_key: string, delta_days: number): string {
  const parts = date_key.split("-").map(Number);
  const y = parts[0] ?? 1970;
  const m = parts[1] ?? 1;
  const d = parts[2] ?? 1;
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + delta_days);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/**
 * Count consecutive IST days ending at `as_of` where No Fap was held.
 * A missed submit day or a day with No Fap not cleared breaks the chain.
 * If `as_of` itself is not submitted yet, counting starts from the previous day.
 */
export function countNoFapStreak(input: {
  as_of: string;
  /** date_key → whether No Fap was held that submitted day (omit = no submit) */
  held_by_date: Map<string, boolean>;
}): number {
  let cursor = input.as_of;
  if (!input.held_by_date.has(cursor)) {
    cursor = shiftDateKey(cursor, -1);
  }

  let streak = 0;
  for (;;) {
    if (!input.held_by_date.has(cursor)) break;
    if (!input.held_by_date.get(cursor)) break;
    streak += 1;
    cursor = shiftDateKey(cursor, -1);
  }
  return streak;
}

export async function getOrCreateToday(hunter_id: number) {
  const date_key = todayKeyIst();
  const log = await dailyLogsRepository.getOrCreateDailyLog(hunter_id, date_key);
  const items = await dailyLogsRepository.listItemsForLog(log.id);
  return { log, items, date_key };
}

export async function listRecent(hunter_id: number, limit = 30) {
  return dailyLogsRepository.listRecentLogs(hunter_id, limit);
}

export async function upsertItem(
  hunter_id: number,
  quest_id: number,
  input: { value: number; cleared: boolean },
) {
  const date_key = todayKeyIst();
  return dailyLogsRepository.upsertLogItem(hunter_id, date_key, quest_id, {
    value: String(input.value),
    cleared: input.cleared,
  });
}

/**
 * Submit day: compute status, XP, streak.
 * Steps are optional for day-clear XP. Streak follows No Fap held only.
 */
export async function submitToday(hunter_id: number) {
  const hunter = await huntersRepository.findHunterById(hunter_id);
  if (!hunter) throw new Error("Hunter not found");

  const date_key = todayKeyIst();
  const pack = await questsRepository.findQuestsByHunterId(hunter_id);
  const log = await dailyLogsRepository.getOrCreateDailyLog(hunter_id, date_key);

  if (log.submitted) {
    return { hunter, log, leveled: false, already_submitted: true };
  }

  const items = await dailyLogsRepository.listItemsForLog(log.id);
  const item_by_quest = new Map(items.map((i) => [i.quest_id, i]));

  const core = pack.filter((q) => q.kind !== "steps");
  const cleared_core = core.filter((q) => item_by_quest.get(q.id)?.cleared).length;

  // Block empty submits — at least one cleared core task (No Fap counts)
  if (core.length === 0 || cleared_core === 0) {
    const err = new Error(
      "Clear at least one task before submitting (e.g. a workout goal or No Fap).",
    ) as Error & { code?: string };
    err.code = "NO_PROGRESS";
    throw err;
  }

  const status =
    cleared_core === core.length
      ? "complete"
      : "partial";

  const all_clear = status === "complete";
  const no_fap = pack.find(isNoFapQuest);
  const no_fap_held = no_fap
    ? Boolean(item_by_quest.get(no_fap.id)?.cleared)
    : false;

  let xp_gain = cleared_core * 25;
  // Streak = consecutive No Fap holds (not full day clear)
  const next_streak = no_fap_held ? hunter.streak + 1 : 0;
  if (all_clear) {
    xp_gain += 40;
    if (next_streak > 1) xp_gain += Math.min(50, next_streak * 5);
  } else if (no_fap_held && next_streak > 1) {
    // Partial day still earns streak bonus when the hold continues
    xp_gain += Math.min(50, next_streak * 5);
  }

  let level = hunter.level;
  let xp = hunter.xp + xp_gain;
  while (xp >= xpForLevel(level)) {
    xp -= xpForLevel(level);
    level += 1;
  }

  await dailyLogsRepository.markSubmitted(log.id, status);
  const updated = await huntersRepository.updateHunterProgress(hunter_id, {
    level,
    xp,
    streak: next_streak,
  });

  return {
    hunter: updated,
    status,
    xp_gain,
    leveled: level > hunter.level,
    already_submitted: false,
    no_fap_held,
  };
}

/** Rebuild held_by_date map for a hunter from submitted logs (for admin recalc). */
export async function buildNoFapHeldMap(hunter_id: number): Promise<Map<string, boolean>> {
  const pack = await questsRepository.findQuestsByHunterId(hunter_id);
  const no_fap_ids = new Set(pack.filter(isNoFapQuest).map((q) => q.id));
  const held = new Map<string, boolean>();
  if (no_fap_ids.size === 0) return held;

  const logs = await dailyLogsRepository.listRecentLogs(hunter_id, 400);
  for (const log of logs) {
    if (!log.submitted) continue;
    const items = await dailyLogsRepository.listItemsForLog(log.id);
    const ok = items.some((i) => no_fap_ids.has(i.quest_id) && i.cleared);
    held.set(log.date_key, ok);
  }
  return held;
}

export async function recalcHunterNoFapStreak(hunter_id: number) {
  const hunter = await huntersRepository.findHunterById(hunter_id);
  if (!hunter) throw new Error("Hunter not found");
  const held_by_date = await buildNoFapHeldMap(hunter_id);
  const streak = countNoFapStreak({ as_of: todayKeyIst(), held_by_date });
  const updated = await huntersRepository.updateHunterProgress(hunter_id, {
    level: hunter.level,
    xp: hunter.xp,
    streak,
  });
  return { hunter: updated, previous_streak: hunter.streak, streak };
}
