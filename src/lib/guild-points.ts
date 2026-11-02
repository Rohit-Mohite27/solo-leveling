/**
 * System Points — fair within-guild ranking from workout volume.
 * Inspired by Solo Leveling’s daily quest rewards (stat points for work done).
 *
 * Base rates (every chunk earns the listed points):
 * - 10 push-ups → 10 SP
 * - 10 sit-ups → 10 SP
 * - 10 squats → 10 SP
 * - 1 km run → 25 SP
 * - 1,000 steps → 5 SP
 * - No Fap held → 50 SP
 */

export type WorkoutVolume = {
  pushUps: number;
  sitUps: number;
  squats: number;
  runKm: number;
  steps: number;
  noFap: boolean;
};

export const SYSTEM_POINT_RATES = {
  pushUpsPer10: 10,
  sitUpsPer10: 10,
  squatsPer10: 10,
  runPerKm: 25,
  stepsPer1000: 5,
  noFapClear: 50,
} as const;

export const EMPTY_VOLUME: WorkoutVolume = {
  pushUps: 0,
  sitUps: 0,
  squats: 0,
  runKm: 0,
  steps: 0,
  noFap: false,
};

export function scoreVolume(v: WorkoutVolume): number {
  const push = Math.floor(Math.max(0, v.pushUps) / 10) * SYSTEM_POINT_RATES.pushUpsPer10;
  const sit = Math.floor(Math.max(0, v.sitUps) / 10) * SYSTEM_POINT_RATES.sitUpsPer10;
  const squat = Math.floor(Math.max(0, v.squats) / 10) * SYSTEM_POINT_RATES.squatsPer10;
  const run = Math.max(0, v.runKm) * SYSTEM_POINT_RATES.runPerKm;
  const steps = Math.floor(Math.max(0, v.steps) / 1000) * SYSTEM_POINT_RATES.stepsPer1000;
  const noFap = v.noFap ? SYSTEM_POINT_RATES.noFapClear : 0;
  return Math.round(push + sit + squat + run + steps + noFap);
}

/** Map free-text quest names from logs into volume buckets. */
export function volumeFromTasks(
  tasks: Array<{ name: string; kind?: string | null; unit?: string | null; value: string | number; cleared?: boolean }>,
): WorkoutVolume {
  const out: WorkoutVolume = { ...EMPTY_VOLUME };
  for (const t of tasks) {
    const name = t.name.toLowerCase();
    const raw = typeof t.value === "number" ? t.value : Number(t.value);
    const n = Number.isFinite(raw) ? raw : 0;
    if (name.includes("push")) out.pushUps += n;
    else if (name.includes("sit")) out.sitUps += n;
    else if (name.includes("squat")) out.squats += n;
    else if (name.includes("run") || t.unit === "km" || t.kind === "distance") out.runKm += n;
    else if (name.includes("step") || t.kind === "steps" || t.unit === "steps") out.steps += n;
    else if (name.includes("fap") || name.includes("no fap")) out.noFap = out.noFap || n >= 1 || Boolean(t.cleared);
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
  };
}

export const POINT_RATE_ROWS: { label: string; rate: string }[] = [
  { label: "Push-ups", rate: "10 SP / 10 reps" },
  { label: "Sit-ups", rate: "10 SP / 10 reps" },
  { label: "Squats", rate: "10 SP / 10 reps" },
  { label: "Run", rate: "25 SP / km" },
  { label: "Steps", rate: "5 SP / 1,000" },
  { label: "No Fap", rate: "50 SP when held" },
];
