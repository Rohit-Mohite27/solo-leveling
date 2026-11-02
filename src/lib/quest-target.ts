import type { QuestKind } from "@/lib/demo-data";

/**
 * Parse a typed target string into a valid number for the quest kind.
 * Returns null while empty / invalid so the input can stay blank while typing.
 */
export function parseQuestTarget(kind: QuestKind, raw: string): number | null {
  if (kind === "yesno") return 1;

  const trimmed = raw.trim();
  if (trimmed === "") return null;

  const n = Number(trimmed);
  if (!Number.isFinite(n) || n <= 0) return null;

  if (kind === "distance") {
    // km — allow one decimal place (e.g. 3.5)
    if (n > 1000) return null;
    return Math.round(n * 10) / 10;
  }

  const whole = Math.floor(n);
  if (whole < 1) return null;

  if (kind === "steps") {
    if (whole > 500_000) return null;
    return whole;
  }

  if (kind === "duration") {
    // minutes
    if (whole > 24 * 60) return null;
    return whole;
  }

  // count (reps)
  if (whole > 100_000) return null;
  return whole;
}

export function questTargetHint(kind: QuestKind): string {
  switch (kind) {
    case "steps":
      return "Any steps goal (e.g. 200, 500, 10000)";
    case "distance":
      return "Kilometers (e.g. 1, 3.5)";
    case "duration":
      return "Minutes (e.g. 30, 45)";
    case "count":
      return "Reps / count (e.g. 20, 50)";
    case "yesno":
      return "No target — mark done on Home";
    default:
      return "";
  }
}

export function defaultTargetForKind(kind: QuestKind): string {
  switch (kind) {
    case "steps":
      return "10000";
    case "distance":
      return "3";
    case "duration":
      return "30";
    case "yesno":
      return "1";
    case "count":
    default:
      return "10";
  }
}
