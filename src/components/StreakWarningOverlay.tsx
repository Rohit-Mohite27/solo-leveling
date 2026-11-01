"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { DEMO_TESTING } from "@/lib/demo-data";
import { useHunter } from "@/lib/hunter-store";

/** Milliseconds until next midnight Asia/Kolkata */
function msUntilNextIstMidnight(now = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const h = get("hour");
  const m = get("minute");
  const s = get("second");
  const elapsed = ((h * 60 + m) * 60 + s) * 1000;
  const dayMs = 24 * 60 * 60 * 1000;
  return dayMs - elapsed;
}

export function StreakWarningOverlay() {
  const hunter = useHunter();
  const [open, setOpen] = useState(false);
  const [forced, setForced] = useState(false);

  const missing = useMemo(
    () =>
      hunter.quests.filter(
        (q) => q.kind !== "steps" && q.unit !== "steps" && !hunter.today.logs[q.id]?.cleared,
      ),
    [hunter.quests, hunter.today.logs],
  );
  const incomplete = hunter.entered && missing.length > 0;

  useEffect(() => {
    function onForce() {
      setForced(true);
      setOpen(true);
    }
    window.addEventListener("solo-leveling:test-midnight", onForce);
    (
      window as Window & { __soloTestMidnight?: () => void }
    ).__soloTestMidnight = onForce;
    return () => {
      window.removeEventListener("solo-leveling:test-midnight", onForce);
      delete (window as Window & { __soloTestMidnight?: () => void }).__soloTestMidnight;
    };
  }, []);

  useEffect(() => {
    if (!hunter.hydrated || !hunter.entered) return;

    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    function arm() {
      const wait = msUntilNextIstMidnight();
      timeoutId = setTimeout(() => {
        setOpen(true);
        arm();
      }, Math.max(1000, wait));
    }

    arm();
    const intervalId = setInterval(() => {
      const wait = msUntilNextIstMidnight();
      if (wait < 35_000) setOpen(true);
    }, 30_000);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [hunter.hydrated, hunter.entered]);

  const shouldShow = open && (forced || incomplete) && !hunter.pendingAlly;

  if (!shouldShow) return null;

  const missingNames = missing.map((q) => q.name);
  const missingLabel =
    missingNames.length === 0
      ? "your remaining quests"
      : missingNames.length === 1
        ? missingNames[0]
        : missingNames.length === 2
          ? `${missingNames[0]} and ${missingNames[1]}`
          : `${missingNames.slice(0, -1).join(", ")}, and ${missingNames[missingNames.length - 1]}`;

  function keepGoing() {
    setOpen(false);
    setForced(false);
  }

  function acceptLoss() {
    hunter.breakStreakForTest();
    setOpen(false);
    setForced(false);
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1e1a3a]/60 p-3 backdrop-blur-md sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="streak-warning-title"
    >
      <div className="relative flex w-full max-w-3xl animate-level-rise flex-col overflow-hidden rounded-[1.75rem] bg-white shadow-soft md:h-[min(540px,84vh)] md:flex-row">
        <div className="relative flex h-[280px] w-full shrink-0 items-center justify-center overflow-hidden md:h-auto md:w-[44%]">
          <div
            className="absolute inset-0 bg-gradient-to-b from-[#241e4a] via-[#17132f] to-[#0c0a18]"
            aria-hidden
          />
          <div className="absolute inset-4 z-[1] md:inset-5">
            <Image
              src="/characters/jinwoo-hero.png"
              alt="Sung Jinwoo"
              fill
              priority
              unoptimized
              sizes="(max-width: 768px) 100vw, 400px"
              className="object-contain object-center"
            />
          </div>
        </div>

        <div className="relative flex flex-1 flex-col justify-center px-6 py-7 md:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-system-danger">
            Midnight Warning
          </p>
          <h2
            id="streak-warning-title"
            className="mt-3 font-display text-[1.7rem] font-semibold leading-tight text-ink-900 md:text-3xl"
          >
            {hunter.name || "Rohit"}, you&apos;re missing{" "}
            {missing.length === 1 ? "this one task" : `${missing.length} tasks`}
          </h2>
          <p className="mt-3 font-body text-base font-semibold leading-relaxed text-ink-700/75">
            {missing.length > 0 ? (
              <>
                Still open: <span className="text-lilac-600">{missingLabel}</span>. Are you sure
                you want to lose this streak?
              </>
            ) : (
              <>Are you sure you want to lose this streak?</>
            )}
          </p>
          <p className="mt-2 text-sm font-semibold text-ink-700/45">
            Current streak: {hunter.streak} day{hunter.streak === 1 ? "" : "s"}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={keepGoing}
              className="min-h-11 flex-1 rounded-2xl bg-lilac-500 text-sm font-bold uppercase tracking-[0.14em] text-white shadow-pill transition hover:bg-lilac-600"
            >
              Keep fighting
            </button>
            <button
              type="button"
              onClick={acceptLoss}
              className="min-h-11 flex-1 rounded-2xl bg-white text-sm font-bold uppercase tracking-[0.14em] text-system-danger ring-1 ring-system-danger/30 transition hover:bg-system-danger/5"
            >
              Lose streak
            </button>
          </div>

          {DEMO_TESTING && forced && (
            <p className="mt-4 text-xs font-semibold text-lilac-400">
              Test mode — this was forced without waiting for 12:00 AM IST.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function forceMidnightWarning() {
  window.dispatchEvent(new Event("solo-leveling:test-midnight"));
}
