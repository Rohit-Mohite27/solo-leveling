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
 * Steps quests are optional — excluded from all-clear / streak like the client.
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

  const status =
    core.length === 0
      ? "empty"
      : cleared_core === 0
        ? "failed"
        : cleared_core === core.length
          ? "complete"
          : "partial";

  const all_clear = status === "complete";
  // Do not accept a partial / empty day — member must finish assigned core tasks first.
  if (!all_clear) {
    const err = new Error("Complete all assigned tasks before submitting the day");
    (err as Error & { code?: string }).code = "TASKS_INCOMPLETE";
    throw err;
  }

  let xp_gain = cleared_core * 25;
  xp_gain += 40;
  const next_streak = hunter.streak + 1;
  if (next_streak > 1) xp_gain += Math.min(50, next_streak * 5);

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
  };
}
