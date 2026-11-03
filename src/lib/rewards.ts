import type { Quest } from "@/lib/demo-data";

/** Spendable currency from grind — does NOT raise hunter level. */
export const ALLY_BOOST_COST = 50;
export const ALLY_BOOST_POWER = 125;
/** Extra grind charge fills this to spawn a System Cache chest. */
export const CACHE_CHARGE_MAX = 100;

export type RewardKind = "day_clear" | "extra_grind" | "partial_day";

export type PendingReward = {
  id: string;
  kind: RewardKind;
  title: string;
  xp: number;
  jinwooLine: string;
  createdAt: number;
  claimed: boolean;
};

export function jinwooLine(kind: RewardKind, xp: number): string {
  if (kind === "day_clear") {
    return `Good. Another day conquered. ${xp} Essence is yours — spend it to awaken your shadows.`;
  }
  if (kind === "extra_grind") {
    return `You pushed past the gate. ${xp} bonus Essence sealed. Open it when you're ready.`;
  }
  return `Incomplete gate… but the System still pays for work done. ${xp} Essence waiting.`;
}

type LogLike = { value: number; cleared: boolean };

/** Essence from cleared goals + over-goal grind (extras). */
export function computeRewardBreakdown(
  quests: Quest[],
  logs: Record<string, LogLike | undefined>,
): { clearedXp: number; extraXp: number; total: number } {
  let clearedXp = 0;
  let extraXp = 0;
  for (const q of quests) {
    if (q.kind === "steps") continue;
    const log = logs[q.id];
    if (!log) continue;
    if (q.kind === "yesno") {
      if (log.cleared || log.value >= 1) clearedXp += 25;
      continue;
    }
    if (log.cleared || log.value >= q.target) {
      clearedXp += 25;
      const over = Math.max(0, log.value - q.target);
      if (q.kind === "distance") {
        extraXp += Math.round(over * 15);
      } else {
        extraXp += Math.floor(over) * 2;
      }
    } else if (log.value > 0) {
      // Partial credit toward essence, not a clear
      const ratio = Math.min(1, log.value / Math.max(1, q.target));
      clearedXp += Math.floor(25 * ratio);
    }
  }
  return { clearedXp, extraXp, total: clearedXp + extraXp };
}

export function makeRewardId(): string {
  return `rw_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function buildReward(
  kind: RewardKind,
  xp: number,
  title?: string,
): PendingReward {
  const titles: Record<RewardKind, string> = {
    day_clear: "Daily Gate Clear",
    extra_grind: "Overload Cache",
    partial_day: "Partial Gate Payout",
  };
  return {
    id: makeRewardId(),
    kind,
    title: title ?? titles[kind],
    xp: Math.max(0, Math.floor(xp)),
    jinwooLine: jinwooLine(kind, Math.max(0, Math.floor(xp))),
    createdAt: Date.now(),
    claimed: false,
  };
}

/** Demo pack — unclaimed + claimed chests for testing the vault UI. */
export function makeDummyPendingRewards(): PendingReward[] {
  const claimed = buildReward("day_clear", 90, "Daily Gate Clear");
  return [
    buildReward("day_clear", 125, "Daily Gate Clear"),
    buildReward("extra_grind", 58, "Overload Cache"),
    buildReward("extra_grind", 42, "Overload Cache"),
    buildReward("partial_day", 35, "Partial Gate Payout"),
    { ...claimed, claimed: true },
  ];
}
