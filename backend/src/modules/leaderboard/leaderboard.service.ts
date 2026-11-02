import * as leaderboardRepository from "./leaderboard.repository.js";

export class LeaderboardError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 404,
  ) {
    super(message);
  }
}

export async function getLeaderboard() {
  const rows = await leaderboardRepository.listByStreak(50);
  return rows.map((h, index) => ({
    rank: index + 1,
    id: h.id,
    name: h.name,
    level: h.level,
    xp: h.xp,
    streak: h.streak,
  }));
}

export async function getHunterRecord(hunter_id: number) {
  const hunter = await leaderboardRepository.findPublicHunter(hunter_id);
  if (!hunter) {
    throw new LeaderboardError("NOT_FOUND", "Hunter not found on the board");
  }

  const board = await leaderboardRepository.listByStreak(200);
  const rank_index = board.findIndex((h) => h.id === hunter_id);
  const rank = rank_index >= 0 ? rank_index + 1 : null;

  const [quests, logs] = await Promise.all([
    leaderboardRepository.listActiveQuests(hunter_id),
    leaderboardRepository.listRecentLogs(hunter_id, 14),
  ]);

  const items = await leaderboardRepository.listItemsForLogs(logs.map((l) => l.id));
  const items_by_log = new Map<number, typeof items>();
  for (const item of items) {
    const list = items_by_log.get(item.daily_log_id) ?? [];
    list.push(item);
    items_by_log.set(item.daily_log_id, list);
  }

  return {
    hunter: {
      id: hunter.id,
      name: hunter.name,
      level: hunter.level,
      xp: hunter.xp,
      streak: hunter.streak,
      rank,
    },
    quests: quests.map((q) => ({
      id: q.id,
      name: q.name,
      kind: q.kind,
      target: q.target,
      unit: q.unit,
      accent: q.accent,
    })),
    recentDays: logs.map((log) => {
      const day_items = items_by_log.get(log.id) ?? [];
      return {
        dateKey: log.date_key,
        status: log.status,
        submitted: log.submitted,
        tasks: day_items.map((i) => ({
          questId: i.quest_id,
          name: i.quest_name ?? `Quest #${i.quest_id}`,
          kind: i.quest_kind,
          unit: i.quest_unit,
          value: i.value,
          cleared: i.cleared,
        })),
      };
    }),
  };
}
