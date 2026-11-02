import type { HunterGrade } from "@/lib/hunter-rank";
import { gradeFromStreak, gradeLabel, gradeRequirement } from "@/lib/hunter-rank";
import type { WorkoutVolume } from "@/lib/guild-points";
import { scoreVolume } from "@/lib/guild-points";

export type GuildWorkout = {
  name: string;
  /** Numeric goal used for motivation + point estimates */
  goal: number;
  unit: string;
  /** Display string e.g. "100 reps" */
  target: string;
  /** Short System-style note */
  note?: string;
};

export type GuildInfo = {
  grade: HunterGrade;
  title: string;
  tagline: string;
  heroName: string;
  heroImage: string;
  requirement: string;
  /** Source line for the training plan */
  questSource: string;
  workouts: GuildWorkout[];
};

/** Showcase guilds on the Rank home (S / A / B). */
export const SHOWCASE_GUILDS: HunterGrade[] = ["S", "A", "B"];

function w(name: string, goal: number, unit: string, note?: string): GuildWorkout {
  const target =
    unit === "reps"
      ? `${goal} reps`
      : unit === "km"
        ? `${goal} km`
        : unit === "steps"
          ? goal.toLocaleString("en-US")
          : unit === "done"
            ? "Hold the line"
            : String(goal);
  return { name, goal, unit, target, note };
}

/**
 * Guild training gates — scaled from the anime System daily quest
 * “The Preparation To Become Powerful”:
 * 100 Push-Ups · 100 Sit-Ups · 100 Squats · 10 km Run
 * A-Rank = exact System quest. Higher = harder. Lower = training wheels.
 */
export function guildInfo(grade: HunterGrade): GuildInfo {
  const requirement = gradeRequirement(grade);
  switch (grade) {
    case "S":
      return {
        grade,
        title: "S-Rank Guild",
        tagline: "Beyond the System — Monarch’s training gate.",
        heroName: "Sung Jinwoo",
        heroImage: "/characters/rank/s-jinwoo.png",
        requirement,
        questSource: "System daily ×1.5 — Monarch overload",
        workouts: [
          w("Push-ups", 150, "reps", "Goal"),
          w("Sit-ups", 150, "reps", "Goal"),
          w("Squats", 150, "reps", "Goal"),
          w("Run", 12, "km", "Goal"),
          w("No Fap", 1, "done", "Daily hold"),
          w("Steps", 15000, "steps", "Optional grind"),
        ],
      };
    case "A":
      return {
        grade,
        title: "A-Rank Guild",
        tagline: "The System’s own daily quest — no shortcuts.",
        heroName: "Cha Hae-in",
        heroImage: "/characters/rank/a-cha.png",
        requirement,
        questSource: "“The Preparation To Become Powerful” (anime System)",
        workouts: [
          w("Push-ups", 100, "reps", "System goal"),
          w("Sit-ups", 100, "reps", "System goal"),
          w("Squats", 100, "reps", "System goal"),
          w("Run", 10, "km", "System goal"),
          w("No Fap", 1, "done", "Daily hold"),
          w("Steps", 12000, "steps", "Optional grind"),
        ],
      };
    case "B":
      return {
        grade,
        title: "B-Rank Guild",
        tagline: "Climbing toward the System’s full gate.",
        heroName: "Choi Jong-in",
        heroImage: "/characters/rank/b-choi.png",
        requirement,
        questSource: "System daily ×0.8 — gate training",
        workouts: [
          w("Push-ups", 80, "reps", "Goal"),
          w("Sit-ups", 80, "reps", "Goal"),
          w("Squats", 80, "reps", "Goal"),
          w("Run", 8, "km", "Goal"),
          w("No Fap", 1, "done", "Daily hold"),
          w("Steps", 10000, "steps", "Optional grind"),
        ],
      };
    case "C":
      return {
        grade,
        title: "C-Rank Guild",
        tagline: "Solid hunters building a real streak.",
        heroName: "Yoo Jinho",
        heroImage: "/characters/jinho.png",
        requirement,
        questSource: "System daily ×0.6",
        workouts: [
          w("Push-ups", 60, "reps", "Goal"),
          w("Sit-ups", 60, "reps", "Goal"),
          w("Squats", 60, "reps", "Goal"),
          w("Run", 6, "km", "Goal"),
          w("No Fap", 1, "done"),
        ],
      };
    case "D":
      return {
        grade,
        title: "D-Rank Guild",
        tagline: "First real gate clearers.",
        heroName: "Woo Jinchul",
        heroImage: "/characters/jinchul.png",
        requirement,
        questSource: "System daily ×0.4",
        workouts: [
          w("Push-ups", 40, "reps", "Goal"),
          w("Sit-ups", 40, "reps", "Goal"),
          w("Squats", 40, "reps", "Goal"),
          w("Run", 4, "km", "Goal"),
        ],
      };
    case "E":
    default:
      return {
        grade: "E",
        title: "E-Rank Guild",
        tagline: "Every legend starts here.",
        heroName: "Rookie Hunter",
        heroImage: "/characters/greeter.png",
        requirement,
        questSource: "System daily ×0.2 — rookies",
        workouts: [
          w("Push-ups", 20, "reps", "Goal"),
          w("Sit-ups", 20, "reps", "Goal"),
          w("Squats", 20, "reps", "Goal"),
          w("Run", 2, "km", "Goal"),
        ],
      };
  }
}

export function parseGuildGrade(raw: string | undefined): HunterGrade | null {
  const g = (raw ?? "").toUpperCase();
  if (g === "S" || g === "A" || g === "B" || g === "C" || g === "D" || g === "E") return g;
  return null;
}

export type GuildMember = {
  id: number;
  name: string;
  level: number;
  xp: number;
  streak: number;
  grade: HunterGrade;
  /** System Points from workout volume — decides the within-guild winner */
  systemPoints: number;
  volume?: WorkoutVolume;
};

export function membersForGrade(members: GuildMember[], grade: HunterGrade): GuildMember[] {
  return members
    .filter((m) => m.grade === grade)
    .sort(
      (a, b) =>
        b.systemPoints - a.systemPoints ||
        b.streak - a.streak ||
        b.level - a.level,
    );
}

export function toGuildMember(
  row: {
    id: number;
    name: string;
    level: number;
    xp: number;
    streak: number;
  },
  volume?: WorkoutVolume,
): GuildMember {
  const v = volume;
  return {
    ...row,
    grade: gradeFromStreak(row.streak),
    volume: v,
    systemPoints: v ? scoreVolume(v) : 0,
  };
}

export { gradeLabel };
