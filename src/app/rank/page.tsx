"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ApiError,
  fetchLeaderboard,
  type LeaderboardEntry,
} from "@/lib/api";
import { DEMO_TESTING, firstName } from "@/lib/demo-data";
import { buildDemoLeaderboard } from "@/lib/demo-leaderboard";
import { guildInfo, toGuildMember, type GuildMember } from "@/lib/guild";
import { POINT_RATE_ROWS } from "@/lib/guild-points";
import {
  gradeFromStreak,
  gradeLabel,
  gradeRequirement,
  podiumFrame,
  type HunterGrade,
} from "@/lib/hunter-rank";
import { useHunter } from "@/lib/hunter-store";

const SP_MODAL_KEY = "solo-leveling-sp-modal-at";
const SP_MODAL_COOLDOWN_MS = 2 * 60 * 1000;

function CrownMark() {
  return (
    <svg width="28" height="20" viewBox="0 0 28 20" fill="none" aria-hidden>
      <path
        d="M3 16.5h22L21.2 6.2l-4.2 4.8L14 2.5l-3 8.5-4.2-4.8L3 16.5z"
        fill="#f6d860"
        stroke="#fff6c8"
        strokeWidth="1"
      />
      <circle cx="14" cy="15" r="1.4" fill="#fff6c8" />
    </svg>
  );
}

function GuildCard({
  grade,
  place,
  memberCount,
}: {
  grade: HunterGrade;
  place: 1 | 2 | 3;
  memberCount: number;
}) {
  const guild = guildInfo(grade);
  const frame = podiumFrame(place);
  const isS = grade === "S";

  return (
    <div className={`relative ${isS ? "pt-5" : "pt-2"}`}>
      {isS && (
        <div className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2 drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]">
          <CrownMark />
        </div>
      )}

      <Link
        href={`/rank/guild/${grade}`}
        className={`group flex flex-col overflow-hidden rounded-[1.35rem] bg-[#0c0a18] ring-[3px] transition hover:-translate-y-1 ${frame.ring} ${frame.glow}`}
      >
        {/* Portrait zone kept short so faces aren't cropped by a tall card */}
        <div className={`relative w-full overflow-hidden ${isS ? "h-[9.5rem]" : "h-[8.25rem]"}`}>
          <Image
            src={guild.heroImage}
            alt={guild.heroName}
            fill
            unoptimized
            sizes="(max-width: 640px) 33vw, 180px"
            className="object-cover transition duration-500 group-hover:scale-[1.04]"
            style={{
              // Short portrait box + top anchor keeps Jinwoo’s face in frame on mobile
              objectPosition: "center top",
            }}
          />
          <div className={`absolute inset-0 bg-gradient-to-t ${frame.wash}`} aria-hidden />
          <div
            className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#0c0a18] to-transparent"
            aria-hidden
          />
        </div>

        <div className="relative z-[1] px-1.5 pb-3 pt-2 text-center text-white sm:px-2">
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] ${frame.chip}`}
          >
            {gradeLabel(grade)} Guild
          </span>
          <p className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#f6d860] sm:text-[10px]">
            {guild.heroName}
          </p>
          <p
            className={`mt-0.5 font-display font-semibold leading-tight text-white ${
              isS ? "text-sm sm:text-[1.05rem]" : "text-xs sm:text-sm"
            }`}
          >
            {grade}-Rank Gate
          </p>
          <p className="mt-1 text-[10px] font-semibold text-white/70">
            {memberCount} member{memberCount === 1 ? "" : "s"}
          </p>
        </div>
      </Link>
    </div>
  );
}

function GradeRulesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  const rows: { grade: HunterGrade; note: string }[] = [
    { grade: "S", note: gradeRequirement("S") },
    { grade: "A", note: gradeRequirement("A") },
    { grade: "B", note: gradeRequirement("B") },
    { grade: "C", note: gradeRequirement("C") },
    { grade: "D", note: gradeRequirement("D") },
    { grade: "E", note: gradeRequirement("E") },
  ];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1e1a3a]/65 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="grade-rules-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm animate-level-rise rounded-[1.5rem] bg-white p-5 shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-lilac-400">
          System rules
        </p>
        <h2
          id="grade-rules-title"
          className="mt-2 font-display text-2xl font-semibold text-ink-900"
        >
          How guilds are earned
        </h2>
        <p className="mt-2 text-sm font-semibold text-ink-700/60">
          Streak decides your guild. Everyone starts in E-Rank. Clear more days to join higher
          gates — and follow that guild&apos;s workout plan.
        </p>
        <ul className="mt-4 space-y-2">
          {rows.map((r) => (
            <li
              key={r.grade}
              className="flex items-center justify-between rounded-xl bg-lilac-50/80 px-3 py-2 text-sm font-semibold"
            >
              <span className="font-bold text-lilac-600">{gradeLabel(r.grade)}</span>
              <span className="text-ink-700/50">{r.note}</span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 min-h-11 w-full rounded-2xl bg-lilac-500 text-sm font-bold uppercase tracking-[0.14em] text-white shadow-pill transition hover:bg-lilac-600"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

function SystemPointsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[#1e1a3a]/70 px-4 backdrop-blur-md"
      style={{
        paddingTop: "max(1rem, env(safe-area-inset-top))",
        // Clear mobile bottom tabs so the card sits in the real visual center
        paddingBottom: "max(5.5rem, calc(env(safe-area-inset-bottom) + 4.5rem))",
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sp-modal-title"
      onClick={onClose}
    >
      <div
        className="mx-auto flex max-h-full w-full max-w-sm flex-col overflow-hidden rounded-[1.5rem] bg-white shadow-soft animate-level-rise"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-y-auto overscroll-contain p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-lilac-400">
            System notice
          </p>
          <h2
            id="sp-modal-title"
            className="mt-2 font-display text-2xl font-semibold text-ink-900"
          >
            How System Points work
          </h2>
          <p className="mt-2 text-sm font-semibold text-ink-700/60">
            Streak gets you into a guild. Inside the guild, workout volume decides the single
            champion — more reps, more System Points.
          </p>
          <ul className="mt-4 space-y-2">
            {POINT_RATE_ROWS.map((r) => (
              <li
                key={r.label}
                className="flex items-center justify-between rounded-xl bg-lilac-50/80 px-3 py-2 text-sm font-semibold"
              >
                <span className="font-bold text-ink-900">{r.label}</span>
                <span className="text-lilac-600">{r.rate}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs font-semibold text-ink-700/45">
            Tap S / A / B to see that guild&apos;s training goals and ranked members.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-5 min-h-11 w-full rounded-2xl bg-lilac-500 text-sm font-bold uppercase tracking-[0.14em] text-white shadow-pill transition hover:bg-lilac-600"
          >
            Enter the Ranking Gate
          </button>
        </div>
      </div>
    </div>
  );
}

function shouldShowSpModal(): boolean {
  try {
    const raw = localStorage.getItem(SP_MODAL_KEY);
    if (!raw) return true;
    const last = Number(raw);
    if (!Number.isFinite(last)) return true;
    return Date.now() - last >= SP_MODAL_COOLDOWN_MS;
  } catch {
    return true;
  }
}

function markSpModalSeen() {
  try {
    localStorage.setItem(SP_MODAL_KEY, String(Date.now()));
  } catch {
    /* ignore private mode */
  }
}

export default function RankPage() {
  const hunter = useHunter();
  const router = useRouter();
  const [rows, setRows] = useState<LeaderboardEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [spModalOpen, setSpModalOpen] = useState(false);

  useEffect(() => {
    if (hunter.hydrated && !hunter.entered) {
      router.replace("/");
    }
  }, [hunter.hydrated, hunter.entered, router]);

  // Auto-show System Points explainer (cooldown: 2 minutes)
  useEffect(() => {
    if (!hunter.hydrated || !hunter.entered) return;
    if (shouldShowSpModal()) setSpModalOpen(true);
  }, [hunter.hydrated, hunter.entered]);

  function closeSpModal() {
    markSpModalSeen();
    setSpModalOpen(false);
  }

  useEffect(() => {
    if (!hunter.hydrated || !hunter.entered) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    if (DEMO_TESTING) {
      setRows(
        buildDemoLeaderboard({
          name: hunter.name,
          level: hunter.level,
          xp: hunter.xp,
          streak: hunter.streak,
        }),
      );
      setLoading(false);
      return;
    }

    fetchLeaderboard()
      .then((list) => {
        if (!cancelled) setRows(list);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Could not open the Ranking Gate");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    hunter.hydrated,
    hunter.entered,
    hunter.name,
    hunter.level,
    hunter.xp,
    hunter.streak,
  ]);

  const members: GuildMember[] = useMemo(
    () => rows.map((r) => toGuildMember(r)),
    [rows],
  );

  const myId = DEMO_TESTING ? 0 : hunter.hunterId;
  const myGrade = gradeFromStreak(hunter.streak);
  const myGuild = guildInfo(myGrade);

  if (!hunter.hydrated || !hunter.entered) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-lilac-400">
        Opening the Ranking Gate…
      </div>
    );
  }

  return (
    <section className="mx-auto w-full max-w-lg px-4 pb-8 pt-2 sm:px-5">
      <div className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#0c0a18] via-[#2a2458] to-[#5b4bb8] px-5 pb-5 pt-5 text-white shadow-soft animate-fade-up">
        <div
          className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-[#f6d860]/20 blur-3xl"
          aria-hidden
        />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#f6d860]">
              System Ranking
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold leading-tight">
              Hunter Guilds
            </h1>
            <p className="mt-2 max-w-[32ch] text-sm font-semibold text-white/65">
              Join a guild by streak. Tap S / A / B for goals, System Points, and the guild champion.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRulesOpen(true)}
            className="animate-rules-pop shrink-0 rounded-full bg-white/10 px-3.5 py-2 text-[10px] font-bold uppercase tracking-wide text-white ring-1 ring-white/30 backdrop-blur-sm transition hover:bg-white/15 active:scale-95"
          >
            Rules
          </button>
        </div>
        <div className="relative mt-4 flex flex-row flex-wrap items-center gap-2">
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-white/15 sm:px-3 sm:text-xs">
            <span aria-hidden>🔥</span>
            Streak decides the throne
          </span>
          <Link
            href={`/rank/guild/${myGrade}`}
            className="inline-flex min-w-0 max-w-full shrink items-center truncate rounded-full bg-[#f6d860]/15 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#f6d860] ring-1 ring-[#f6d860]/35 sm:px-3 sm:text-xs"
          >
            You · {myGuild.title}
          </Link>
        </div>
      </div>

      <SystemPointsModal open={spModalOpen} onClose={closeSpModal} />
      <GradeRulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />

      {error && (
        <p className="mt-4 text-sm font-semibold text-system-danger" role="alert">
          {error}
        </p>
      )}

      {loading && (
        <p className="mt-8 text-center text-lilac-400">Summoning guilds…</p>
      )}

      {!loading && (
        <div className="mt-5 grid grid-cols-3 items-end gap-2.5 animate-fade-up">
          <GuildCard
            grade="A"
            place={2}
            memberCount={members.filter((m) => m.grade === "A").length}
          />
          <GuildCard
            grade="S"
            place={1}
            memberCount={members.filter((m) => m.grade === "S").length}
          />
          <GuildCard
            grade="B"
            place={3}
            memberCount={members.filter((m) => m.grade === "B").length}
          />
        </div>
      )}

      <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.18em] text-lilac-400">
        All hunters
      </p>
      <p className="mt-1 text-xs font-semibold text-ink-700/45">
        Tap a name to open their workout report.
      </p>
      <ul className="mt-3 space-y-2">
        {members.map((m, i) => {
          const mine = m.id === myId;
          return (
            <li
              key={m.id}
              className="animate-fade-up"
              style={{ animationDelay: `${Math.min(i, 8) * 0.04}s` }}
            >
              <Link
                href={`/rank/${m.id}`}
                className={`soft-card flex items-center gap-3 rounded-[1.25rem] px-3 py-3 transition hover:-translate-y-0.5 hover:shadow-soft ${
                  mine ? "ring-2 ring-lilac-400/70" : ""
                }`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-lilac-100 font-display text-sm font-semibold text-lilac-600">
                  {gradeLabel(m.grade).replace("-Rank", "")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-base text-ink-900">
                    {firstName(m.name)}
                    {mine ? (
                      <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-lilac-500">
                        You
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs font-semibold text-ink-700/45">
                    {gradeLabel(m.grade)} Guild · Level {m.level}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-orange-600">🔥 {m.streak}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-700/35">
                    streak
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

    </section>
  );
}
