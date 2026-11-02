"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ApiError,
  fetchHunterRecord,
  fetchLeaderboard,
  type LeaderboardEntry,
} from "@/lib/api";
import { DEMO_TESTING, firstName } from "@/lib/demo-data";
import { buildDemoLeaderboard, demoVolumeFor } from "@/lib/demo-leaderboard";
import {
  guildInfo,
  membersForGrade,
  parseGuildGrade,
  toGuildMember,
  type GuildMember,
} from "@/lib/guild";
import {
  EMPTY_VOLUME,
  POINT_RATE_ROWS,
  mergeVolumes,
  scoreVolume,
  volumeFromTasks,
  type WorkoutVolume,
} from "@/lib/guild-points";
import { useHunter } from "@/lib/hunter-store";

function volumeFromLocalHunter(hunter: ReturnType<typeof useHunter>): WorkoutVolume {
  const todayTasks = hunter.quests.map((q) => {
    const log = hunter.today.logs[q.id];
    return {
      name: q.name,
      kind: q.kind,
      unit: q.unit,
      value: log?.value ?? 0,
      cleared: Boolean(log?.cleared),
    };
  });
  let vol = volumeFromTasks(todayTasks);
  for (const day of hunter.history.slice(0, 7)) {
    const tasks = hunter.quests.map((q) => ({
      name: q.name,
      kind: q.kind,
      unit: q.unit,
      value: day.questClears[q.id] ? q.target : 0,
      cleared: Boolean(day.questClears[q.id]),
    }));
    vol = mergeVolumes(vol, volumeFromTasks(tasks));
  }
  return vol;
}

export default function GuildDetailPage() {
  const hunter = useHunter();
  const router = useRouter();
  const params = useParams();
  const grade = parseGuildGrade(
    typeof params.grade === "string" ? params.grade : Array.isArray(params.grade) ? params.grade[0] : "",
  );

  const [rows, setRows] = useState<LeaderboardEntry[]>([]);
  const [volumes, setVolumes] = useState<Record<number, WorkoutVolume>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hunter.hydrated && !hunter.entered) {
      router.replace("/");
    }
  }, [hunter.hydrated, hunter.entered, router]);

  useEffect(() => {
    if (!grade) {
      router.replace("/rank");
    }
  }, [grade, router]);

  // Board + rival volumes (once per guild open)
  useEffect(() => {
    if (!hunter.hydrated || !hunter.entered || !grade) return;
    let cancelled = false;

    if (DEMO_TESTING) {
      const board = buildDemoLeaderboard({
        name: hunter.name,
        level: hunter.level,
        xp: hunter.xp,
        streak: hunter.streak,
      });
      setRows(board);
      const next: Record<number, WorkoutVolume> = {};
      for (const row of board) {
        if (row.id === 0) continue;
        const v = demoVolumeFor(row.id);
        if (v) next[row.id] = v;
      }
      setVolumes(next);
      return;
    }

    fetchLeaderboard()
      .then(async (list) => {
        if (cancelled) return;
        setRows(list);
        const guildRows = list.filter((r) => toGuildMember(r).grade === grade);
        const slice = guildRows.slice(0, 12);
        const entries = await Promise.all(
          slice.map(async (r) => {
            try {
              const rec = await fetchHunterRecord(r.id);
              let vol = EMPTY_VOLUME;
              for (const day of rec.recentDays) {
                vol = mergeVolumes(vol, volumeFromTasks(day.tasks));
              }
              return [r.id, vol] as const;
            } catch {
              return [r.id, EMPTY_VOLUME] as const;
            }
          }),
        );
        if (cancelled) return;
        const map: Record<number, WorkoutVolume> = {};
        for (const [id, vol] of entries) map[id] = vol;
        setVolumes(map);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Could not load guild");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [
    hunter.hydrated,
    hunter.entered,
    grade,
    hunter.name,
    hunter.level,
    hunter.xp,
    hunter.streak,
  ]);

  // Keep the signed-in hunter’s System Points live from local logs
  useEffect(() => {
    if (!hunter.hydrated || !hunter.entered) return;
    const id = DEMO_TESTING ? 0 : hunter.hunterId;
    if (id == null) return;
    const mine = volumeFromLocalHunter(hunter);
    setVolumes((prev) => ({ ...prev, [id]: mine }));
  }, [
    hunter.hydrated,
    hunter.entered,
    hunter.hunterId,
    hunter.quests,
    hunter.today.logs,
    hunter.history,
  ]);

  const guild = grade ? guildInfo(grade) : null;
  const members: GuildMember[] = useMemo(() => {
    if (!grade) return [];
    return membersForGrade(
      rows.map((r) => toGuildMember(r, volumes[r.id])),
      grade,
    );
  }, [rows, grade, volumes]);

  const myId = DEMO_TESTING ? 0 : hunter.hunterId;
  const champion = members[0] ?? null;

  if (!hunter.hydrated || !hunter.entered || !guild || !grade) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-lilac-400">
        Opening the guild gate…
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

      <div className="relative mt-4 overflow-hidden rounded-[1.75rem] bg-[#0c0a18] shadow-soft ring-2 ring-lilac-300/40 animate-fade-up">
        <div className="relative h-48 w-full sm:h-56">
          <Image
            src={guild.heroImage}
            alt={guild.heroName}
            fill
            unoptimized
            className="object-cover"
            style={{
              objectPosition: grade === "S" ? "center 18%" : "center top",
            }}
            sizes="(max-width: 640px) 100vw, 512px"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a18] via-[#0c0a18]/55 to-transparent" />
        </div>
        <div className="relative px-5 pb-5 pt-2 text-white">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f6d860]">
            {guild.heroName}
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold">{guild.title}</h1>
          <p className="mt-2 text-sm font-semibold text-white/70">{guild.tagline}</p>
          <p className="mt-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-bold ring-1 ring-white/20">
            Enter with {guild.requirement}
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-4 text-sm font-semibold text-system-danger" role="alert">
          {error}
        </p>
      )}

      {champion && (
        <div className="mt-5 soft-card rounded-[1.35rem] px-4 py-4 animate-fade-up">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-lilac-400">
            Guild champion
          </p>
          <p className="mt-1 font-display text-xl text-ink-900">
            {firstName(champion.name)}
            {champion.id === myId ? (
              <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-lilac-500">
                You
              </span>
            ) : null}
          </p>
          <p className="mt-1 text-sm font-semibold text-ink-700/55">
            {champion.systemPoints.toLocaleString("en-US")} System Points · only one winner
          </p>
        </div>
      )}

      <h2 className="mt-8 text-[11px] font-bold uppercase tracking-[0.18em] text-lilac-400">
        Guild training goals
      </h2>
      <p className="mt-1 text-xs font-semibold text-ink-700/50">
        {guild.questSource}. Hit these goals — volume earns System Points.
      </p>
      <ul className="mt-3 space-y-2">
        {guild.workouts.map((w) => (
          <li
            key={w.name}
            className="soft-card flex items-center justify-between gap-3 rounded-[1.2rem] px-4 py-3"
          >
            <div className="min-w-0">
              <p className="font-display text-base text-ink-900">{w.name}</p>
              {w.note ? (
                <p className="text-[10px] font-bold uppercase tracking-wide text-lilac-400">
                  {w.note}
                </p>
              ) : null}
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-lilac-600">{w.target}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-700/35">
                your goal
              </p>
            </div>
          </li>
        ))}
      </ul>

      <details className="mt-4 rounded-[1.2rem] bg-lilac-50/70 px-4 py-3">
        <summary className="cursor-pointer text-xs font-bold uppercase tracking-wide text-lilac-600">
          How System Points work
        </summary>
        <ul className="mt-3 space-y-1.5">
          {POINT_RATE_ROWS.map((r) => (
            <li
              key={r.label}
              className="flex items-center justify-between text-sm font-semibold text-ink-700/70"
            >
              <span>{r.label}</span>
              <span className="text-lilac-600">{r.rate}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs font-semibold text-ink-700/45">
          More reps = more points. Same guild, one champion.
        </p>
      </details>

      <h2 className="mt-8 text-[11px] font-bold uppercase tracking-[0.18em] text-lilac-400">
        Featured members
      </h2>
      <p className="mt-1 text-xs font-semibold text-ink-700/50">
        Ranked by System Points from real workout volume — not just streak.
      </p>
      <ul className="mt-3 space-y-2">
        {members.length === 0 && (
          <li className="soft-card rounded-[1.2rem] px-4 py-5 text-center text-sm font-semibold text-ink-700/50">
            No hunters have earned {guild.title} yet. Keep your streak alive.
          </li>
        )}
        {members.map((m, i) => (
          <li key={m.id}>
            <Link
              href={`/rank/${m.id}`}
              className={`soft-card flex items-center gap-3 rounded-[1.2rem] px-4 py-3 transition hover:-translate-y-0.5 hover:shadow-soft ${
                m.id === myId ? "ring-2 ring-lilac-400/70" : ""
              } ${i === 0 ? "ring-2 ring-[#f6d860]/50" : ""}`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl font-display text-sm font-semibold ${
                  i === 0
                    ? "bg-[#f6d860]/25 text-[#8a6a18]"
                    : "bg-lilac-100 text-lilac-600"
                }`}
              >
                #{i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-base text-ink-900">
                  {firstName(m.name)}
                  {m.id === myId ? (
                    <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-lilac-500">
                      You
                    </span>
                  ) : null}
                  {i === 0 ? (
                    <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-[#8a6a18]">
                      Winner
                    </span>
                  ) : null}
                </p>
                <p className="text-xs font-semibold text-ink-700/45">
                  Level {m.level} · 🔥 {m.streak} streak · tap report
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-lilac-600">
                  {m.systemPoints.toLocaleString("en-US")}
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-700/35">
                  SP
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {members.some((m) => m.id === myId) && volumes[myId ?? -999] && (
        <p className="mt-4 text-center text-xs font-semibold text-ink-700/45">
          Your volume scores {scoreVolume(volumes[myId!]!).toLocaleString("en-US")} SP this week.
          Push the guild goals to take the throne.
        </p>
      )}
    </section>
  );
}
