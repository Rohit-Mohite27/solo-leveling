/**
 * System Points — fair within-guild ranking from workout effort.
 *
 * Scoring goes through the first-party exercise library:
 * - core / support → Rank SP
 * - accessory → 0 Rank SP (still loggable)
 * - each calendar day clamped to DAILY_SP_CAP
 */

import {
  resolveExercise,
  type LibraryExercise,
  type ScoreAs,
} from "@/lib/exercise-library";

export type WorkoutVolume = {
  pushUps: number;
  sitUps: number;
  squats: number;
  runKm: number;
  steps: number;
  noFap: boolean;
  /** Gym core working sets (library scoreAs working_sets) */
  workingSets?: number;
};

/** Shared home + gym Rank ceiling per calendar day */
export const DAILY_SP_CAP = 200;
export const SP_PER_WORKING_SET = 8;

export const SYSTEM_POINT_RATES = {
  pushUpsPer10: 10,
  sitUpsPer10: 10,
  squatsPer10: 10,
  runPerKm: 25,
  stepsPer1000: 5,
  noFapClear: 50,
  workingSet: SP_PER_WORKING_SET,
} as const;

export const EMPTY_VOLUME: WorkoutVolume = {
  pushUps: 0,
  sitUps: 0,
  squats: 0,
  runKm: 0,
  steps: 0,
  noFap: false,
  workingSets: 0,
};

export type TaskLike = {
  name: string;
  kind?: string | null;
  unit?: string | null;
  value: string | number;
  cleared?: boolean;
};

function spForScoreAs(scoreAs: ScoreAs, value: number, cleared: boolean): number {
  const n = Math.max(0, value);
  switch (scoreAs) {
    case "working_sets":
      return Math.floor(n) * SYSTEM_POINT_RATES.workingSet;
    case "push_ups":
      return Math.floor(n / 10) * SYSTEM_POINT_RATES.pushUpsPer10;
    case "sit_ups":
      return Math.floor(n / 10) * SYSTEM_POINT_RATES.sitUpsPer10;
    case "squats":
      return Math.floor(n / 10) * SYSTEM_POINT_RATES.squatsPer10;
    case "run_km":
      return n * SYSTEM_POINT_RATES.runPerKm;
    case "steps":
      return Math.floor(n / 1000) * SYSTEM_POINT_RATES.stepsPer1000;
    case "no_fap":
      return cleared || n >= 1 ? SYSTEM_POINT_RATES.noFapClear : 0;
    case "none":
    default:
      return 0;
  }
}

/** Uncapped SP for one task using library knowledge. */
export function spForTask(task: TaskLike): {
  sp: number;
  exercise: LibraryExercise | null;
  counted: boolean;
} {
  const raw = typeof task.value === "number" ? task.value : Number(task.value);
  const value = Number.isFinite(raw) ? raw : 0;
  const cleared = Boolean(task.cleared);
  const ex = resolveExercise(task.name);

  if (ex) {
    if (ex.rankRole === "accessory") {
      return { sp: 0, exercise: ex, counted: false };
    }
    return {
      sp: spForScoreAs(ex.scoreAs, value, cleared),
      exercise: ex,
      counted: ex.scoreAs !== "none",
    };
  }

  // Unknown custom goal — heuristic support only (no accessory false-positives)
  const name = task.name.toLowerCase();
  if (task.kind === "steps" || task.unit === "steps" || name.includes("step")) {
    return { sp: spForScoreAs("steps", value, cleared), exercise: null, counted: true };
  }
  if (task.kind === "distance" || task.unit === "km") {
    return { sp: spForScoreAs("run_km", value, cleared), exercise: null, counted: true };
  }
  if (name.includes("sit") || name.includes("crunch")) {
    return { sp: spForScoreAs("sit_ups", value, cleared), exercise: null, counted: true };
  }
  if (name === "push-ups" || name === "push ups" || name === "pushups") {
    return { sp: spForScoreAs("push_ups", value, cleared), exercise: null, counted: true };
  }
  if (name.includes("fap")) {
    return { sp: spForScoreAs("no_fap", value, cleared), exercise: null, counted: true };
  }
  // Unknown isolation / custom → 0 Rank SP
  return { sp: 0, exercise: null, counted: false };
}

/** Raw (uncapped) SP for a single day's task list. */
export function scoreTasksUncapped(tasks: TaskLike[]): number {
  let total = 0;
  for (const t of tasks) total += spForTask(t).sp;
  return Math.round(total);
}

/** One day toward Rank — never exceeds DAILY_SP_CAP. */
export function scoreDayCapped(tasks: TaskLike[]): number {
  return Math.min(DAILY_SP_CAP, scoreTasksUncapped(tasks));
}

/** Sum of per-day capped scores (week / season). */
export function scoreDaysCapped(days: TaskLike[][]): number {
  return days.reduce((sum, day) => sum + scoreDayCapped(day), 0);
}

export function scoreVolume(v: WorkoutVolume): number {
  const push = Math.floor(Math.max(0, v.pushUps) / 10) * SYSTEM_POINT_RATES.pushUpsPer10;
  const sit = Math.floor(Math.max(0, v.sitUps) / 10) * SYSTEM_POINT_RATES.sitUpsPer10;
  const squat = Math.floor(Math.max(0, v.squats) / 10) * SYSTEM_POINT_RATES.squatsPer10;
  const run = Math.max(0, v.runKm) * SYSTEM_POINT_RATES.runPerKm;
  const steps = Math.floor(Math.max(0, v.steps) / 1000) * SYSTEM_POINT_RATES.stepsPer1000;
  const noFap = v.noFap ? SYSTEM_POINT_RATES.noFapClear : 0;
  const sets =
    Math.floor(Math.max(0, v.workingSets ?? 0)) * SYSTEM_POINT_RATES.workingSet;
  return Math.round(push + sit + squat + run + steps + noFap + sets);
}

/**
 * Map tasks into volume buckets — accessories skipped via library.
 * Prefer scoreDayCapped / scoreDaysCapped for Rank totals (daily cap).
 */
export function volumeFromTasks(tasks: TaskLike[]): WorkoutVolume {
  const out: WorkoutVolume = { ...EMPTY_VOLUME };
  for (const t of tasks) {
    const { exercise, counted } = spForTask(t);
    if (!counted) continue;
    const raw = typeof t.value === "number" ? t.value : Number(t.value);
    const n = Number.isFinite(raw) ? raw : 0;
    const scoreAs = exercise?.scoreAs;

    if (scoreAs === "working_sets") out.workingSets = (out.workingSets ?? 0) + n;
    else if (scoreAs === "push_ups") out.pushUps += n;
    else if (scoreAs === "sit_ups") out.sitUps += n;
    else if (scoreAs === "squats") out.squats += n;
    else if (scoreAs === "run_km") out.runKm += n;
    else if (scoreAs === "steps") out.steps += n;
    else if (scoreAs === "no_fap") out.noFap = out.noFap || n >= 1 || Boolean(t.cleared);
    else {
      // Heuristic fallback already handled inside spForTask counted path
      const name = t.name.toLowerCase();
      if (t.kind === "steps" || t.unit === "steps") out.steps += n;
      else if (t.kind === "distance" || t.unit === "km") out.runKm += n;
      else if (name.includes("sit")) out.sitUps += n;
      else if (name.includes("push")) out.pushUps += n;
      else if (name.includes("fap")) out.noFap = true;
    }
  }
  return out;
}

export function mergeVolumes(a: WorkoutVolume, b: WorkoutVolume): WorkoutVolume {
  return {
    pushUps: a.pushUps + b.pushUps,
    sitUps: a.sitUps + b.sitUps,
    squats: a.squats + b.squats,
    runKm: a.runKm + b.runKm,
    steps: a.steps + b.steps,
    noFap: a.noFap || b.noFap,
    workingSets: (a.workingSets ?? 0) + (b.workingSets ?? 0),
  };
}

/** Cap a merged multi-day volume score is wrong for Rank — use scoreDaysCapped.
 *  Kept for demo rival volumes that are already “week-ish” blobs. */
export function scoreVolumeCappedAsDays(v: WorkoutVolume, dayCount = 7): number {
  const raw = scoreVolume(v);
  return Math.min(dayCount * DAILY_SP_CAP, raw);
}

/** Full rates — guild detail / docs */
export const POINT_RATE_ROWS: { label: string; rate: string }[] = [
  { label: "Gym core set", rate: `${SP_PER_WORKING_SET} SP / working set` },
  { label: "Push-ups", rate: "10 SP / 10 reps" },
  { label: "Sit-ups", rate: "10 SP / 10 reps" },
  { label: "Squats (bodyweight)", rate: "10 SP / 10 reps" },
  { label: "Run", rate: "25 SP / km" },
  { label: "Steps", rate: "5 SP / 1,000" },
  { label: "No Fap", rate: "50 SP when held" },
  { label: "Accessories (flyes, curls…)", rate: "0 Rank SP · diary OK" },
  { label: "Daily Rank cap", rate: `${DAILY_SP_CAP} SP / day (home + gym)` },
];

/** Compact rates for Rank gate modal — fits one phone screen with CTA visible */
export const POINT_RATE_MODAL_ROWS: { label: string; rate: string }[] = [
  { label: "Gym core set", rate: `${SP_PER_WORKING_SET} SP / set` },
  { label: "Push / sit / squat", rate: "10 SP / 10 reps" },
  { label: "Run", rate: "25 SP / km" },
  { label: "Steps", rate: "5 SP / 1k" },
  { label: "No Fap", rate: "50 SP held" },
  { label: "Daily cap (all)", rate: `${DAILY_SP_CAP} SP / day` },
];
