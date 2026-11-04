/**
 * Solo Leveling Exercise Library — first-party curated catalog.
 *
 * Source: written for this app (PPL + System daily staples). Not imported from
 * wger / ExerciseDB / other APIs (no extra dependency, we control Rank roles).
 *
 * rankRole:
 * - core      → gym mains (Bench, Squat…) — Rank SP via working sets
 * - support   → System staples (push-ups, run, steps…) — Rank SP via volume rates
 * - accessory → isolation / fluff — may be logged, 0 Rank SP
 */

export type RankRole = "core" | "support" | "accessory";
export type SplitTag = "push" | "pull" | "legs" | "home" | "cardio" | "habit";
export type LibraryKind = "count" | "distance" | "steps" | "yesno";
export type ScoreAs =
  | "working_sets"
  | "push_ups"
  | "sit_ups"
  | "squats"
  | "run_km"
  | "steps"
  | "no_fap"
  | "none";

export type LibraryExercise = {
  id: string;
  name: string;
  rankRole: RankRole;
  splitTags: SplitTag[];
  /** Quest kind when added from the board */
  kind: LibraryKind;
  unit: string;
  defaultTarget: number;
  accent: string;
  scoreAs: ScoreAs;
  /** Lowercase aliases / substrings for matching free-text goal names */
  aliases: string[];
};

export const EXERCISE_LIBRARY: LibraryExercise[] = [
  // —— Push cores ——
  {
    id: "bench_press",
    name: "Bench press",
    rankRole: "core",
    splitTags: ["push"],
    kind: "count",
    unit: "sets",
    defaultTarget: 3,
    accent: "#7c6cf0",
    scoreAs: "working_sets",
    aliases: ["bench press", "bench", "barbell bench", "db bench", "dumbbell bench"],
  },
  {
    id: "ohp",
    name: "Overhead press",
    rankRole: "core",
    splitTags: ["push"],
    kind: "count",
    unit: "sets",
    defaultTarget: 3,
    accent: "#5b9cf5",
    scoreAs: "working_sets",
    aliases: ["overhead press", "ohp", "shoulder press", "military press"],
  },
  {
    id: "incline_press",
    name: "Incline press",
    rankRole: "core",
    splitTags: ["push"],
    kind: "count",
    unit: "sets",
    defaultTarget: 3,
    accent: "#f0a05a",
    scoreAs: "working_sets",
    aliases: [
      "incline press",
      "incline bench",
      "incline db",
      "incline dumbbell",
      "incline dumbells",
      "incline dumbbells",
    ],
  },
  // —— Pull cores ——
  {
    id: "barbell_row",
    name: "Barbell row",
    rankRole: "core",
    splitTags: ["pull"],
    kind: "count",
    unit: "sets",
    defaultTarget: 3,
    accent: "#7c6cf0",
    scoreAs: "working_sets",
    aliases: ["barbell row", "bent over row", "pendlay row"],
  },
  {
    id: "pull_up",
    name: "Pull-ups",
    rankRole: "core",
    splitTags: ["pull"],
    kind: "count",
    unit: "sets",
    defaultTarget: 3,
    accent: "#5b9cf5",
    scoreAs: "working_sets",
    aliases: ["pull-up", "pull up", "pullups", "chin up", "chin-up"],
  },
  {
    id: "lat_pulldown",
    name: "Lat pulldown",
    rankRole: "core",
    splitTags: ["pull"],
    kind: "count",
    unit: "sets",
    defaultTarget: 3,
    accent: "#5ec4a8",
    scoreAs: "working_sets",
    aliases: ["lat pulldown", "pulldown", "lat pull"],
  },
  // —— Legs cores ——
  {
    id: "squat",
    name: "Back squat",
    rankRole: "core",
    splitTags: ["legs"],
    kind: "count",
    unit: "sets",
    defaultTarget: 3,
    accent: "#7c6cf0",
    scoreAs: "working_sets",
    aliases: ["back squat", "barbell squat", "squat"],
  },
  {
    id: "rdl",
    name: "Romanian deadlift",
    rankRole: "core",
    splitTags: ["legs", "pull"],
    kind: "count",
    unit: "sets",
    defaultTarget: 3,
    accent: "#f0a05a",
    scoreAs: "working_sets",
    aliases: ["romanian deadlift", "rdl", "stiff leg deadlift"],
  },
  {
    id: "leg_press",
    name: "Leg press",
    rankRole: "core",
    splitTags: ["legs"],
    kind: "count",
    unit: "sets",
    defaultTarget: 3,
    accent: "#5b9cf5",
    scoreAs: "working_sets",
    aliases: ["leg press"],
  },
  {
    id: "deadlift",
    name: "Deadlift",
    rankRole: "core",
    splitTags: ["legs", "pull"],
    kind: "count",
    unit: "sets",
    defaultTarget: 3,
    accent: "#e85a7a",
    scoreAs: "working_sets",
    aliases: ["deadlift", "conventional deadlift", "sumo deadlift"],
  },
  // —— Support (home + gym can both use) ——
  {
    id: "push_ups",
    name: "Push-ups",
    rankRole: "support",
    splitTags: ["home", "push"],
    kind: "count",
    unit: "reps",
    defaultTarget: 50,
    accent: "#7c6cf0",
    scoreAs: "push_ups",
    aliases: ["push-ups", "push ups", "pushups", "push-up"],
  },
  {
    id: "sit_ups",
    name: "Sit-ups",
    rankRole: "support",
    splitTags: ["home"],
    kind: "count",
    unit: "reps",
    defaultTarget: 50,
    accent: "#5b9cf5",
    scoreAs: "sit_ups",
    aliases: ["sit-ups", "sit ups", "situps", "crunch"],
  },
  {
    id: "bodyweight_squats",
    name: "Bodyweight squats",
    rankRole: "support",
    splitTags: ["home", "legs"],
    kind: "count",
    unit: "reps",
    defaultTarget: 50,
    accent: "#f0a05a",
    scoreAs: "squats",
    aliases: ["bodyweight squat", "air squat", "bw squat"],
  },
  {
    id: "run",
    name: "Run",
    rankRole: "support",
    splitTags: ["home", "cardio"],
    kind: "distance",
    unit: "km",
    defaultTarget: 3,
    accent: "#f0a05a",
    scoreAs: "run_km",
    aliases: ["run", "running", "jog", "jogging"],
  },
  {
    id: "steps",
    name: "Steps",
    rankRole: "support",
    splitTags: ["home", "cardio"],
    kind: "steps",
    unit: "steps",
    defaultTarget: 10000,
    accent: "#5ec4a8",
    scoreAs: "steps",
    aliases: ["steps", "step count", "walk"],
  },
  {
    id: "no_fap",
    name: "No Fap",
    rankRole: "support",
    splitTags: ["habit", "home"],
    kind: "yesno",
    unit: "done",
    defaultTarget: 1,
    accent: "#e85a7a",
    scoreAs: "no_fap",
    aliases: ["no fap", "nofap", "no-fap"],
  },
  // —— Accessories (log OK, 0 Rank SP) ——
  {
    id: "cable_fly",
    name: "Cable fly",
    rankRole: "accessory",
    splitTags: ["push"],
    kind: "count",
    unit: "sets",
    defaultTarget: 3,
    accent: "#d48ab8",
    scoreAs: "none",
    aliases: ["cable fly", "flye", "flyes", "chest fly", "pec deck"],
  },
  {
    id: "tricep_pushdown",
    name: "Tricep pushdown",
    rankRole: "accessory",
    splitTags: ["push"],
    kind: "count",
    unit: "sets",
    defaultTarget: 3,
    accent: "#d48ab8",
    scoreAs: "none",
    aliases: ["tricep pushdown", "pushdown", "triceps extension", "skull crusher"],
  },
  {
    id: "lateral_raise",
    name: "Lateral raise",
    rankRole: "accessory",
    splitTags: ["push"],
    kind: "count",
    unit: "sets",
    defaultTarget: 3,
    accent: "#d48ab8",
    scoreAs: "none",
    aliases: ["lateral raise", "side raise", "laterals"],
  },
  {
    id: "bicep_curl",
    name: "Bicep curl",
    rankRole: "accessory",
    splitTags: ["pull"],
    kind: "count",
    unit: "sets",
    defaultTarget: 3,
    accent: "#d48ab8",
    scoreAs: "none",
    aliases: ["bicep curl", "curl", "hammer curl"],
  },
  {
    id: "face_pull",
    name: "Face pull",
    rankRole: "accessory",
    splitTags: ["pull"],
    kind: "count",
    unit: "sets",
    defaultTarget: 3,
    accent: "#d48ab8",
    scoreAs: "none",
    aliases: ["face pull", "facepull"],
  },
  {
    id: "leg_extension",
    name: "Leg extension",
    rankRole: "accessory",
    splitTags: ["legs"],
    kind: "count",
    unit: "sets",
    defaultTarget: 3,
    accent: "#d48ab8",
    scoreAs: "none",
    aliases: ["leg extension", "leg ext"],
  },
  {
    id: "leg_curl",
    name: "Leg curl",
    rankRole: "accessory",
    splitTags: ["legs"],
    kind: "count",
    unit: "sets",
    defaultTarget: 3,
    accent: "#d48ab8",
    scoreAs: "none",
    aliases: ["leg curl", "hamstring curl"],
  },
  {
    id: "calf_raise",
    name: "Calf raise",
    rankRole: "accessory",
    splitTags: ["legs"],
    kind: "count",
    unit: "sets",
    defaultTarget: 3,
    accent: "#d48ab8",
    scoreAs: "none",
    aliases: ["calf raise", "calves"],
  },
  {
    id: "abs",
    name: "Abs",
    rankRole: "accessory",
    splitTags: ["push", "pull", "legs", "home"],
    kind: "count",
    unit: "sets",
    defaultTarget: 3,
    accent: "#d48ab8",
    scoreAs: "none",
    aliases: ["abs", "ab workout", "plank", "core work", "hanging leg raise"],
  },
];

/** Prefer longer alias matches so "tricep pushdown" ≠ push-ups. */
export function resolveExercise(rawName: string): LibraryExercise | null {
  const name = rawName.trim().toLowerCase();
  if (!name) return null;

  let best: { ex: LibraryExercise; len: number } | null = null;
  for (const ex of EXERCISE_LIBRARY) {
    for (const alias of ex.aliases) {
      const a = alias.toLowerCase();
      if (name === a || name.includes(a)) {
        if (!best || a.length > best.len) best = { ex, len: a.length };
      }
    }
  }
  return best?.ex ?? null;
}

export function exercisesForSplit(split: SplitTag): LibraryExercise[] {
  return EXERCISE_LIBRARY.filter((e) => e.splitTags.includes(split));
}

export function rankRoleLabel(role: RankRole): string {
  if (role === "core") return "Counts for Rank";
  if (role === "support") return "Counts for Rank";
  return "Diary only · 0 Rank SP";
}

export const LIBRARY_SOURCE_NOTE =
  "System library curated inside Solo Leveling (PPL mains + home staples). Not a third-party exercise API.";
