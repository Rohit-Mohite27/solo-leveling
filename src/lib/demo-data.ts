export type QuestKind = "count" | "distance" | "duration" | "yesno" | "steps";

export type Quest = {
  id: string;
  name: string;
  kind: QuestKind;
  target: number;
  unit: string;
  /** Soft accent for goal card icon chip */
  accent: string;
};

export type AllyFaction = "hunter" | "shadow";

export type Ally = {
  id: string;
  name: string;
  /** First-cycle unlock level. Later levels loop the roster. */
  unlockLevel: number;
  title: string;
  line: string;
  accent: string;
  /** Hunter ally vs Shadow Army soldier */
  faction: AllyFaction;
  /** Optional local portrait under /public/characters */
  image?: string;
  /**
   * Extra scale in the level-up art panel (object-contain).
   * Use when the asset has empty margins and looks too small.
   */
  artScale?: number;
};

export type DayStatus = "complete" | "partial" | "failed" | "empty";

export type DayRecord = {
  dateKey: string;
  status: DayStatus;
  questClears: Record<string, boolean>;
};

export const STARTER_QUESTS: Quest[] = [
  { id: "q1", name: "Push-ups", kind: "count", target: 50, unit: "reps", accent: "#7c6cf0" },
  { id: "q2", name: "Sit-ups", kind: "count", target: 50, unit: "reps", accent: "#5b9cf5" },
  { id: "q3", name: "Run", kind: "distance", target: 3, unit: "km", accent: "#f0a05a" },
  // Yes/No only — tap Done when you held the line today (no count)
  { id: "q4", name: "No Fap", kind: "yesno", target: 1, unit: "done", accent: "#e85a7a" },
  // Optional steps bar — does not count toward streak / day clear
  { id: "q5", name: "Steps", kind: "steps", target: 10000, unit: "steps", accent: "#5ec4a8" },
];

/** Rename legacy Gym → No Fap; ensure default Steps bar is present. */
export function migrateStarterQuests(quests: Quest[]): Quest[] {
  const next = quests.map((q) => {
    if (q.id === "q4" || q.name === "Gym Session") {
      return {
        ...q,
        id: q.id || "q4",
        name: "No Fap",
        kind: "yesno" as const,
        target: 1,
        unit: "done",
        accent: q.accent === "#5ec4a8" ? "#e85a7a" : q.accent,
      };
    }
    return q;
  });
  const hasSteps = next.some((q) => q.kind === "steps" || q.unit === "steps" || q.id === "q5");
  if (!hasSteps) {
    const steps = STARTER_QUESTS.find((q) => q.id === "q5");
    if (steps) next.push(steps);
  }
  return next;
}

/** Default steps goal when adding from Quest Board */
export const DEFAULT_STEPS_TARGET = 10000;

/** Mixed hunters + Shadow Army (anime-ish recruit order). Loops after Bellion. */
export const ALLIES: Ally[] = [
  {
    id: "jinho",
    name: "Yoo Jinho",
    unlockLevel: 2,
    title: "Loyal Ally",
    line: "Hyung-nim {name}! Your growth is unreal — I’m with you all the way.",
    accent: "#5b9cf5",
    faction: "hunter",
    image: "/characters/ally-jinho.png",
  },
  {
    id: "igris",
    name: "Igris",
    unlockLevel: 3,
    title: "Blood-Red Commander",
    line: "My liege {name}. Your command is absolute.",
    accent: "#e85a7a",
    faction: "shadow",
    image: "/characters/igris.jpg",
  },
  {
    id: "cha",
    name: "Cha Hae-in",
    unlockLevel: 4,
    title: "S-Rank Hunter",
    line: "Your presence feels… different. Keep climbing, {name}.",
    accent: "#d48ab8",
    faction: "hunter",
    image: "/characters/ally-cha.png",
  },
  {
    id: "iron",
    name: "Iron",
    unlockLevel: 5,
    title: "Shadow Soldier",
    line: "Iron reporting, my liege {name}. Point me at the enemy.",
    accent: "#7a8499",
    faction: "shadow",
    image: "/characters/ally-iron.jpg",
  },
  {
    id: "jinah",
    name: "Sung Jinah",
    unlockLevel: 6,
    title: "Little Sister",
    line: "Oppa {name}… you’re really becoming someone incredible.",
    accent: "#ff9ec8",
    faction: "hunter",
    image: "/characters/ally-jinah.png",
  },
  {
    id: "tank",
    name: "Tank",
    unlockLevel: 7,
    title: "Shadow Bear",
    line: "Rrrh… Tank stands with you, {name}.",
    accent: "#6b8cae",
    faction: "shadow",
    image: "/characters/ally-tank.jpg",
  },
  {
    id: "jinchul",
    name: "Woo Jinchul",
    unlockLevel: 8,
    title: "Association",
    line: "The Association is watching, {name}. Don’t waste that power.",
    accent: "#6aa8ff",
    faction: "hunter",
    image: "/characters/jinchul.png",
  },
  {
    id: "tusk",
    name: "Tusk",
    unlockLevel: 9,
    title: "High Orc Mage",
    line: "Magic answers your will alone, Sovereign {name}.",
    accent: "#9b6cff",
    faction: "shadow",
    image: "/characters/ally-tusk.jpg",
  },
  {
    id: "choi",
    name: "Choi Jong-in",
    unlockLevel: 10,
    title: "The Ultimate Soldier",
    line: "A flame that never falters. Impressive, {name}.",
    accent: "#f0a05a",
    faction: "hunter",
    image: "/characters/ally-choi.png",
  },
  {
    id: "baek",
    name: "Baek Yoonho",
    unlockLevel: 11,
    title: "White Tiger",
    line: "That hunger… keep it sharp, {name}.",
    accent: "#8a90a8",
    faction: "hunter",
    image: "/characters/ally-baek.png",
  },
  {
    id: "beru",
    name: "Beru",
    unlockLevel: 12,
    title: "Ant King",
    line: "My King {name}… your enemies will kneel.",
    accent: "#5ec4a8",
    faction: "shadow",
    image: "/characters/beru.jpg",
  },
  {
    id: "gunhee",
    name: "Go Gunhee",
    unlockLevel: 13,
    title: "Association President",
    line: "The future of hunters rests on shoulders like yours, {name}.",
    accent: "#c9a227",
    faction: "hunter",
    image: "/characters/ally-gunhee.png",
  },
  {
    id: "kaisel",
    name: "Kaisel",
    unlockLevel: 14,
    title: "Shadow Dragon",
    line: "The skies belong to you now, {name}.",
    accent: "#5b9cf5",
    faction: "shadow",
    image: "/characters/ally-kaisel.jpg",
  },
  {
    id: "andre",
    name: "Thomas Andre",
    unlockLevel: 15,
    title: "Goliath",
    line: "Hah! Show me that shadow army next time, {name}!",
    accent: "#9b6cff",
    faction: "hunter",
    image: "/characters/ally-andre.png",
  },
  {
    id: "bellion",
    name: "Bellion",
    unlockLevel: 16,
    title: "Grand-Marshal",
    line: "The Shadow Army awaits your command, my liege {name}.",
    accent: "#c9a227",
    faction: "shadow",
    image: "/characters/ally-bellion.jpg",
  },
];

/** First ally greeting fires at this hunter level (Yoo Jinho). */
export const FIRST_ALLY_LEVEL = 2;

export function xpForLevel(level: number): number {
  return 100 + (level - 1) * 40;
}

function maxAllyUnlockLevel(): number {
  return Math.max(...ALLIES.map((a) => a.unlockLevel));
}

/**
 * Ally greeting for a hunter level.
 * First cycle uses each ally’s unlockLevel; after the last, the roster loops.
 */
export function allyForLevel(level: number): Ally | undefined {
  if (level < FIRST_ALLY_LEVEL || ALLIES.length === 0) return undefined;

  const exact = ALLIES.find((a) => a.unlockLevel === level);
  if (exact) return exact;

  const maxUnlock = maxAllyUnlockLevel();
  if (level <= maxUnlock) return undefined;

  const offset = level - maxUnlock - 1;
  return ALLIES[offset % ALLIES.length];
}

export function nextAlly(level: number): Ally | undefined {
  const horizon = maxAllyUnlockLevel() + ALLIES.length;
  for (let l = level + 1; l <= horizon; l += 1) {
    const ally = allyForLevel(l);
    if (ally) return ally;
  }
  return undefined;
}

/** Allies unlocked at least once (first cycle). After max unlock, everyone. */
export function unlockedAllies(level: number): Ally[] {
  if (level < FIRST_ALLY_LEVEL) return [];
  if (level >= maxAllyUnlockLevel()) return [...ALLIES];
  return ALLIES.filter((a) => a.unlockLevel <= level);
}

/**
 * Turning point: after Bellion, the roster loops from Jinho again.
 * Ascension 1 = first recruit. 2+ = each full-loop re-recruit (more power).
 */
export function allyAscension(level: number, ally: Ally): number {
  if (level < ally.unlockLevel) return 0;
  const n = ALLIES.length;
  const maxU = maxAllyUnlockLevel();
  if (level <= maxU) return 1;

  const index = ALLIES.findIndex((a) => a.id === ally.id);
  if (index < 0) return 1;
  const lastOffset = level - maxU - 1;
  let loops = 0;
  if (lastOffset >= index) {
    loops = Math.floor((lastOffset - index) / n) + 1;
  }
  return 1 + loops;
}

export function allyBasePower(ally: Ally): number {
  return 800 + ally.unlockLevel * 40;
}

/** Power grows +50% per awakening after the first recruit. */
export function allyPower(ally: Ally, ascension: number): number {
  const rank = Math.max(1, ascension);
  return Math.round(allyBasePower(ally) * (1 + (rank - 1) * 0.5));
}

export function ascensionLabel(ascension: number): string {
  if (ascension <= 0) return "Sealed";
  if (ascension === 1) return "Recruit";
  if (ascension === 2) return "Awakening I";
  if (ascension === 3) return "Awakening II";
  return `Awakening ${toRoman(ascension - 1)}`;
}

function toRoman(n: number): string {
  const map: [number, string][] = [
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let x = n;
  let out = "";
  for (const [v, s] of map) {
    while (x >= v) {
      out += s;
      x -= v;
    }
  }
  return out || "I";
}

/** Bonus hunter XP when an ally reappears on a new loop. */
export function ascensionXpBonus(ascension: number): number {
  if (ascension <= 1) return 0;
  return 40 * (ascension - 1);
}

export function alliesByFaction(
  faction: AllyFaction,
  level: number,
): { unlocked: Ally[]; locked: Ally[] } {
  const pool = ALLIES.filter((a) => a.faction === faction);
  const unlockedIds = new Set(unlockedAllies(level).map((a) => a.id));
  return {
    unlocked: pool.filter((a) => unlockedIds.has(a.id)),
    locked: pool.filter((a) => !unlockedIds.has(a.id)),
  };
}

export function armyStats(level: number): {
  unlocked: number;
  total: number;
  shadows: number;
  hunters: number;
  percent: number;
} {
  const unlocked = unlockedAllies(level);
  const shadows = unlocked.filter((a) => a.faction === "shadow").length;
  const hunters = unlocked.filter((a) => a.faction === "hunter").length;
  const total = ALLIES.length;
  return {
    unlocked: unlocked.length,
    total,
    shadows,
    hunters,
    percent: total === 0 ? 0 : Math.round((unlocked.length / total) * 100),
  };
}

/** Fill {name} in ally greeting lines with the hunter's name */
export function personalizeLine(line: string, hunterName: string): string {
  return line.replaceAll("{name}", hunterName || "Hunter");
}

/** Demo / testing: skip locking the day so you can re-clear endlessly */
export const DEMO_TESTING = false;

export function todayKey(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function shiftDateKey(key: string, deltaDays: number): string {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + deltaDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatDayLabel(key: string): { day: number; weekday: string; month: string } {
  const d = parseDateKey(key);
  return {
    day: d.getDate(),
    weekday: d.toLocaleString("en-US", { weekday: "short" }),
    month: d.toLocaleString("en-US", { month: "short" }),
  };
}

export function questTargetLabel(quest: Quest): string {
  if (quest.kind === "yesno") {
    if (/fap/i.test(quest.name)) return "Tap when you held today — no count";
    return "Tap Done — no count";
  }
  if (quest.kind === "steps") {
    return `${quest.target.toLocaleString()} ${quest.unit}`;
  }
  return `${quest.target} ${quest.unit}`;
}

export function isStepsQuest(quest: Quest): boolean {
  return quest.kind === "steps" || quest.unit === "steps";
}

/** Core daily quests that count for streak / day clear (steps are optional). */
export function coreQuests(quests: Quest[]): Quest[] {
  return quests.filter((q) => !isStepsQuest(q));
}
