"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ApiError,
  fetchHunterRecord,
  type HunterRecord,
} from "@/lib/api";
import { DEMO_TESTING, firstName } from "@/lib/demo-data";
import { buildDemoHunterRecord, buildDemoLeaderboard } from "@/lib/demo-leaderboard";
import { gradeFromStreak, gradeLabel, gradeRequirement } from "@/lib/hunter-rank";
import { useHunter } from "@/lib/hunter-store";

function statusLabel(status: string): string {
  if (status === "complete") return "All clear";
  if (status === "partial") return "Partial";
  if (status === "failed") return "Failed";
  return "Empty";
}

function taskHasProgress(t: {
  kind: string | null;
  value: string;
  cleared: boolean;
}): boolean {
  if (t.cleared) return true;
  if (t.kind === "yesno") return t.value === "1";
  const n = Number(t.value);
  return Number.isFinite(n) && n > 0;
}

function formatTaskValue(t: {
  kind: string | null;
  unit: string | null;
  value: string;
  cleared: boolean;
}): string {
  if (t.kind === "yesno") return t.cleared || t.value === "1" ? "Held" : "Broken";
  const n = Number(t.value);
  const unit = t.unit ? ` ${t.unit}` : "";
  if (Number.isFinite(n)) return `${n.toLocaleString("en-US")}${unit}`;
  return `${t.value}${unit}`;
}

/** Prefer today if they logged anything; otherwise the newest day with progress. */
function pickLatestReport(data: HunterRecord, todayKey: string) {
  const days = data.recentDays;
  if (days.length === 0) return null;
  const today = days.find((d) => d.dateKey === todayKey);
  if (today && today.tasks.some(taskHasProgress)) {
    return { day: today, label: "Today’s report" };
  }
  const withWork = days.find((d) => d.tasks.some(taskHasProgress));
  if (withWork) {
    return {
      day: withWork,
      label:
        withWork.dateKey === todayKey ? "Today’s report" : "Latest report (not today)",
    };
  }
  return { day: days[0], label: "Latest report" };
}

export default function RankHunterPage() {
  const hunter = useHunter();
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const [data, setData] = useState<HunterRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hunter.hydrated && !hunter.entered) {
      router.replace("/");
    }
  }, [hunter.hydrated, hunter.entered, router]);

  useEffect(() => {
    if (!hunter.hydrated || !hunter.entered || !Number.isFinite(id)) return;
    let cancelled = false;
    setError(null);

    if (DEMO_TESTING) {
      const board = buildDemoLeaderboard({
        name: hunter.name,
        level: hunter.level,
        xp: hunter.xp,
        streak: hunter.streak,
      });
      const entry = board.find((r) => r.id === id);
      if (!entry) {
        setError("Hunter not found on the board");
        return;
      }
      const todayClears: Record<string, boolean> = {};
      for (const q of hunter.quests) {
        todayClears[q.id] = Boolean(hunter.today.logs[q.id]?.cleared);
      }
      setData(
        buildDemoHunterRecord({
          id: entry.id,
          name: entry.name,
          level: entry.level,
          xp: entry.xp,
          streak: entry.streak,
          quests: hunter.quests,
          history: hunter.history,
          todayClears,
          todayKey: hunter.today.dateKey,
        }),
      );
      return;
    }

    fetchHunterRecord(id)
      .then((record) => {
        if (!cancelled) setData(record);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Could not open hunter record");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [
    hunter.hydrated,
    hunter.entered,
    id,
    hunter.name,
    hunter.level,
    hunter.xp,
    hunter.streak,
    hunter.quests,
    hunter.history,
    hunter.today.logs,
    hunter.today.dateKey,
  ]);

  const latest = useMemo(
    () => (data ? pickLatestReport(data, hunter.today.dateKey) : null),
    [data, hunter.today.dateKey],
  );
  const grade = data ? gradeFromStreak(data.hunter.streak) : null;

  if (!hunter.hydrated || !hunter.entered) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-lilac-400">
        Opening dossier…
      </div>
    );
  }

  return (
    <section className="mx-auto w-full max-w-lg px-4 pb-8 pt-2 sm:px-5">
      <Link
        href="/rank"
        className="text-xs font-bold uppercase tracking-wide text-lilac-500 hover:text-lilac-600"
      >
        ← Guilds
      </Link>

      {error && (
        <p className="mt-4 text-sm font-semibold text-system-danger" role="alert">
          {error}
        </p>
      )}

      {!data && !error && (
        <p className="mt-8 text-center text-lilac-400">Reading System logs…</p>
      )}

      {data && grade && (
        <>
          <div className="relative mt-4 overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#17132f] via-[#2a2458] to-[#5b4bb8] px-5 py-6 text-white shadow-soft animate-fade-up">
            <div
              className="pointer-events-none absolute -right-8 top-0 h-36 w-36 rounded-full bg-[#f6d860]/15 blur-2xl"
              aria-hidden
            />
            <p className="relative text-[10px] font-bold uppercase tracking-[0.22em] text-[#f6d860]">
              Hunter dossier
            </p>
            <h1 className="relative mt-2 font-display text-3xl font-semibold">
              {firstName(data.hunter.name)}
            </h1>
            <p className="relative mt-2 text-sm font-semibold text-white/70">
              {data.hunter.rank != null ? `Board #${data.hunter.rank}` : "Unranked"} ·{" "}
              {gradeLabel(grade)} · Level {data.hunter.level}
            </p>
            <p className="relative mt-1 text-xs font-semibold text-white/50">
              {gradeRequirement(grade)}
            </p>
            <div className="relative mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold ring-1 ring-white/15">
                🔥 {data.hunter.streak} day streak
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold ring-1 ring-white/15">
                {data.hunter.xp} XP
              </span>
              <Link
                href={`/rank/guild/${grade}`}
                className="rounded-full bg-[#f6d860]/15 px-3 py-1.5 text-xs font-bold text-[#f6d860] ring-1 ring-[#f6d860]/35"
              >
                {gradeLabel(grade)} Guild
              </Link>
            </div>
          </div>

          <h2 className="mt-8 text-[11px] font-bold uppercase tracking-[0.18em] text-lilac-400">
            {latest?.label ?? "Latest report"}
          </h2>
          <p className="mt-1 text-xs font-semibold text-ink-700/50">
            What they logged — push-ups, run, and every cleared task.
          </p>

          {!latest && (
            <p className="mt-3 soft-card rounded-[1.2rem] px-4 py-5 text-center text-sm font-semibold text-ink-700/50">
              No workout report yet.
            </p>
          )}

          {latest && (
            <div className="soft-card mt-3 rounded-[1.35rem] p-4 animate-fade-up">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg text-ink-900">{latest.day.dateKey}</p>
                  <p className="text-xs font-semibold text-ink-700/45">
                    {statusLabel(latest.day.status)}
                    {latest.day.submitted ? " · submitted" : " · in progress"}
                  </p>
                </div>
              </div>
              <ul className="mt-3 space-y-2">
                {latest.day.tasks.length === 0 && (
                  <li className="text-xs font-semibold text-ink-700/40">No tasks logged.</li>
                )}
                {latest.day.tasks.map((t) => (
                  <li
                    key={`${latest.day.dateKey}-${t.questId}`}
                    className="flex items-center justify-between gap-3 rounded-xl bg-lilac-50/70 px-3 py-2.5"
                  >
                    <span className="font-display text-base text-ink-900">{t.name}</span>
                    <span
                      className={`text-sm font-bold ${
                        t.cleared ? "text-system-clear" : "text-lilac-600"
                      }`}
                    >
                      {formatTaskValue(t)}
                      {t.cleared ? " ✓" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <h2 className="mt-8 text-[11px] font-bold uppercase tracking-[0.18em] text-lilac-400">
            Earlier days
          </h2>
          <ul className="mt-3 space-y-3">
            {data.recentDays
              .filter((d) => !latest || d.dateKey !== latest.day.dateKey)
              .map((day) => (
                <li key={day.dateKey} className="soft-card rounded-[1.35rem] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-lg text-ink-900">{day.dateKey}</p>
                      <p className="text-xs font-semibold text-ink-700/45">
                        {statusLabel(day.status)}
                        {day.submitted ? " · submitted" : " · not submitted"}
                      </p>
                    </div>
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    {day.tasks.length === 0 && (
                      <li className="text-xs font-semibold text-ink-700/40">No tasks logged.</li>
                    )}
                    {day.tasks.map((t) => (
                      <li
                        key={`${day.dateKey}-${t.questId}`}
                        className="flex items-center justify-between gap-2 text-sm font-semibold"
                      >
                        <span className="text-ink-800">{t.name}</span>
                        <span className={t.cleared ? "text-system-clear" : "text-ink-700/40"}>
                          {formatTaskValue(t)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            {data.recentDays.filter((d) => !latest || d.dateKey !== latest.day.dateKey).length ===
              0 && (
              <li className="text-sm font-semibold text-ink-700/45">No earlier logs.</li>
            )}
          </ul>
        </>
      )}
    </section>
  );
}
