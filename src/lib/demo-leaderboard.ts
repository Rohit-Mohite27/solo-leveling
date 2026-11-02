import type { HunterRecord, LeaderboardEntry } from "@/lib/api";
import type { DayRecord, Quest } from "@/lib/demo-data";
import { shiftDateKey } from "@/lib/demo-data";
import type { WorkoutVolume } from "@/lib/guild-points";

/** Demo workout volumes — drives System Points inside each guild. */
export const DEMO_VOLUMES: Record<number, WorkoutVolume> = {
  // Two S-Rank hunters — volume decides the single guild winner
  [-10]: {
    pushUps: 160,
    sitUps: 150,
    squats: 155,
    runKm: 12,
    steps: 16000,
    noFap: true,
  },
  [-11]: {
    pushUps: 90,
    sitUps: 80,
    squats: 70,
    runKm: 8,
    steps: 9000,
    noFap: true,
  },
  // Jazz — A-Rank, near System daily
  [-2]: {
    pushUps: 110,
    sitUps: 100,
    squats: 100,
    runKm: 10,
    steps: 12500,
    noFap: true,
  },
  // Cha — B-Rank
  [-3]: {
    pushUps: 85,
    sitUps: 80,
    squats: 75,
    runKm: 8,
    steps: 10500,
    noFap: true,
  },
  // Yoo — D-Rank
  [-4]: {
    pushUps: 40,
    sitUps: 35,
    squats: 30,
    runKm: 3,
    steps: 6000,
    noFap: false,
  },
  // UOS — E-Rank
  [-5]: {
    pushUps: 10,
    sitUps: 10,
    squats: 0,
    runKm: 1,
    steps: 3000,
    noFap: false,
  },
};

export function demoVolumeFor(id: number): WorkoutVolume | undefined {
  return DEMO_VOLUMES[id];
}

/** Local-only board so demo mode never calls the API. */
export function buildDemoLeaderboard(input: {
  name: string;
  level: number;
  xp: number;
  streak: number;
}): LeaderboardEntry[] {
  const you: LeaderboardEntry = {
    rank: 1,
    id: 0,
    name: input.name || "Hunter",
    level: input.level,
    xp: input.xp,
    streak: input.streak,
  };

  // Fixed streaks so demo guilds show real grade splits (S / A / B / E).
  const rivals: LeaderboardEntry[] = [
    {
      rank: 0,
      id: -10,
      name: "Beru",
      level: Math.max(1, input.level + 4),
      xp: 400,
      streak: 36, // S-Rank — high volume → guild winner
    },
    {
      rank: 0,
      id: -11,
      name: "Igris",
      level: Math.max(1, input.level + 3),
      xp: 280,
      streak: 31, // S-Rank — same guild, fewer reps → #2
    },
    {
      rank: 0,
      id: -2,
      name: "Jazz",
      level: Math.max(1, input.level + 2),
      xp: 120,
      streak: 22, // A-Rank Guild
    },
    {
      rank: 0,
      id: -3,
      name: "Cha Hae-in",
      level: Math.max(1, input.level),
      xp: 80,
      streak: 15, // B-Rank Guild
    },
    {
      rank: 0,
      id: -4,
      name: "Yoo Jinho",
      level: Math.max(1, input.level - 1),
      xp: 20,
      streak: 5, // D-Rank Guild
    },
    {
      rank: 0,
      id: -5,
      name: "UOS",
      level: Math.max(1, input.level - 2),
      xp: 10,
      streak: 1, // E-Rank Guild
    },
  ];

  return [you, ...rivals]
    .sort((a, b) => b.streak - a.streak || b.level - a.level || b.xp - a.xp)
    .map((row, i) => ({ ...row, rank: i + 1 }));
}

export function buildDemoHunterRecord(input: {
  id: number;
  name: string;
  level: number;
  xp: number;
  streak: number;
  quests: Quest[];
  history: DayRecord[];
  todayClears: Record<string, boolean>;
  todayKey: string;
}): HunterRecord {
  const board = buildDemoLeaderboard(input);
  const rank = board.find((r) => r.id === input.id)?.rank ?? board.find((r) => r.name === input.name)?.rank ?? null;

  const recentFromHistory = input.history.slice(0, 7).map((h) => ({
    dateKey: h.dateKey,
    status: h.status,
    submitted: true,
    tasks: input.quests.map((q) => ({
      questId: Number(q.id.replace(/\D/g, "")) || 0,
      name: q.name,
      kind: q.kind,
      unit: q.unit,
      value: h.questClears[q.id] ? String(q.target) : "0",
      cleared: Boolean(h.questClears[q.id]),
    })),
  }));

  const todayRow = {
    dateKey: input.todayKey,
    status: "partial" as const,
    submitted: false,
    tasks: input.quests.map((q) => ({
      questId: Number(q.id.replace(/\D/g, "")) || 0,
      name: q.name,
      kind: q.kind,
      unit: q.unit,
      value: input.todayClears[q.id] ? String(q.target) : "0",
      cleared: Boolean(input.todayClears[q.id]),
    })),
  };

  // Fake rival dossiers — use DEMO_VOLUMES so reports show real push-up / run numbers
  if (input.id < 0) {
    const vol = DEMO_VOLUMES[input.id];
    const questPack = [
      {
        id: 1,
        name: "Push-ups",
        kind: "count",
        target: "100",
        unit: "reps",
        accent: "#7c6cf0",
      },
      {
        id: 2,
        name: "Sit-ups",
        kind: "count",
        target: "100",
        unit: "reps",
        accent: "#5b9cf5",
      },
      {
        id: 3,
        name: "Squats",
        kind: "count",
        target: "100",
        unit: "reps",
        accent: "#9b8cff",
      },
      {
        id: 4,
        name: "Run",
        kind: "distance",
        target: "10",
        unit: "km",
        accent: "#f0a05a",
      },
      {
        id: 5,
        name: "No Fap",
        kind: "yesno",
        target: "1",
        unit: "done",
        accent: "#e85a7a",
      },
      {
        id: 6,
        name: "Steps",
        kind: "steps",
        target: "10000",
        unit: "steps",
        accent: "#5ec4a8",
      },
    ];

    const todayTasks = [
      {
        questId: 1,
        name: "Push-ups",
        kind: "count",
        unit: "reps",
        value: String(vol?.pushUps ?? 0),
        cleared: (vol?.pushUps ?? 0) >= 50,
      },
      {
        questId: 2,
        name: "Sit-ups",
        kind: "count",
        unit: "reps",
        value: String(vol?.sitUps ?? 0),
        cleared: (vol?.sitUps ?? 0) >= 50,
      },
      {
        questId: 3,
        name: "Squats",
        kind: "count",
        unit: "reps",
        value: String(vol?.squats ?? 0),
        cleared: (vol?.squats ?? 0) >= 50,
      },
      {
        questId: 4,
        name: "Run",
        kind: "distance",
        unit: "km",
        value: String(vol?.runKm ?? 0),
        cleared: (vol?.runKm ?? 0) >= 3,
      },
      {
        questId: 5,
        name: "No Fap",
        kind: "yesno",
        unit: "done",
        value: vol?.noFap ? "1" : "0",
        cleared: Boolean(vol?.noFap),
      },
      {
        questId: 6,
        name: "Steps",
        kind: "steps",
        unit: "steps",
        value: String(vol?.steps ?? 0),
        cleared: (vol?.steps ?? 0) >= 8000,
      },
    ];

    const allClear = todayTasks.every((t) => t.cleared);
    // Low-volume rivals "didn't update today" — show yesterday instead
    const usedToday = (vol?.pushUps ?? 0) >= 40;
    const reportDay = usedToday
      ? {
          dateKey: input.todayKey,
          status: (allClear ? "complete" : "partial") as "complete" | "partial",
          submitted: true,
          tasks: todayTasks,
        }
      : {
          dateKey: shiftDateKey(input.todayKey, -1),
          status: "partial" as const,
          submitted: true,
          tasks: todayTasks,
        };

    return {
      hunter: {
        id: input.id,
        name: input.name,
        level: input.level,
        xp: input.xp,
        streak: input.streak,
        rank,
      },
      quests: questPack,
      recentDays: [reportDay],
    };
  }

  return {
    hunter: {
      id: input.id,
      name: input.name,
      level: input.level,
      xp: input.xp,
      streak: input.streak,
      rank,
    },
    quests: input.quests.map((q) => ({
      id: Number(q.id.replace(/\D/g, "")) || 0,
      name: q.name,
      kind: q.kind,
      target: String(q.target),
      unit: q.unit,
      accent: q.accent,
    })),
    recentDays: [todayRow, ...recentFromHistory],
  };
}
