"use client";

import Image from "next/image";
import { useState } from "react";
import {
  allyAscension,
  allyPower,
  ascensionLabel,
  personalizeLine,
  type Ally,
} from "@/lib/demo-data";
import { ALLY_BOOST_COST, ALLY_BOOST_POWER } from "@/lib/rewards";

type Props = {
  ally: Ally;
  hunterName: string;
  hunterLevel: number;
  boostRank: number;
  essence: number;
  onBoost: (allyId: string) => { ok: boolean; message: string };
  onClose: () => void;
};

/** Full-height scrollable sheet so boost + close stay above the bottom nav. */
export function AllyDetailSheet({
  ally,
  hunterName,
  hunterLevel,
  boostRank,
  essence,
  onBoost,
  onClose,
}: Props) {
  const line = personalizeLine(ally.line, hunterName);
  const art = ally.image || "/characters/ally-jinho.png";
  const ascension = allyAscension(hunterLevel, ally);
  const base = allyPower(ally, ascension);
  const power = base + boostRank * ALLY_BOOST_POWER;
  const [flash, setFlash] = useState<string | null>(null);

  function handleBoost() {
    const result = onBoost(ally.id);
    setFlash(result.message);
    window.setTimeout(() => setFlash(null), 2200);
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-[#1a1538]/55 p-3 backdrop-blur-sm sm:items-center sm:p-6"
      style={{
        paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
        paddingTop: "max(0.75rem, env(safe-area-inset-top))",
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ally-sheet-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[min(92dvh,720px)] w-full max-w-md animate-level-rise flex-col overflow-hidden rounded-[1.5rem] bg-white shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="relative h-40 w-full shrink-0 sm:h-48"
          style={{
            background: `linear-gradient(165deg, ${ally.accent}66 0%, #efe8ff 55%, #fff6ec 100%)`,
          }}
        >
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
            style={{ background: ally.accent, opacity: 0.45 }}
            aria-hidden
          />
          <Image
            src={art}
            alt={ally.name}
            fill
            unoptimized
            className="object-contain object-center p-2"
            sizes="400px"
          />
          <span className="absolute left-3 top-3 rounded-full bg-[#1e1a3a]/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-system-gold">
            {ally.faction === "shadow" ? "Shadow" : "Ally"}
          </span>
          {boostRank > 0 && (
            <span className="absolute right-3 top-3 rounded-full bg-[#f6d860] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#2a2458] shadow-pill animate-stamp-in">
              Boost ×{boostRank}
            </span>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 pt-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-system-gold">
            System archive
          </p>
          <h2
            id="ally-sheet-title"
            className="mt-1 font-display text-2xl font-semibold text-ink-900"
          >
            {ally.name}
          </h2>
          <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-700/40">
            {ally.title}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-lilac-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-lilac-700">
              {ascensionLabel(ascension)}
            </span>
            <span className="rounded-full bg-sand-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-ink-700/55">
              Power {power.toLocaleString()}
            </span>
          </div>
          <p className="mt-3 font-body text-[15px] font-semibold leading-relaxed text-ink-800">
            “{line}”
          </p>
          <p className="mt-2 text-xs font-semibold text-ink-700/40">
            First recruited at Level {ally.unlockLevel}
            {ascension > 1 ? " · stronger each loop" : ""}
          </p>

          <div className="mt-4 rounded-[1.15rem] bg-gradient-to-br from-[#1e1a3a] to-[#2a2458] px-4 py-3 text-white">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#f6d860]">
                  Boost {ally.faction === "shadow" ? "shadow" : "ally"}
                </p>
                <p className="mt-1 text-xs font-semibold text-white/60">
                  +{ALLY_BOOST_POWER} power · {ALLY_BOOST_COST} Essence
                </p>
              </div>
              <p className="text-xs font-bold text-white/50">{essence} banked</p>
            </div>
            <button
              type="button"
              onClick={handleBoost}
              disabled={essence < ALLY_BOOST_COST}
              className="mt-3 min-h-11 w-full rounded-2xl bg-[#f6d860] text-sm font-bold uppercase tracking-[0.14em] text-[#2a2458] shadow-pill transition hover:brightness-105 disabled:opacity-40"
            >
              Spend {ALLY_BOOST_COST} Essence
            </button>
            {flash && (
              <p
                className="mt-2 text-center text-xs font-bold text-[#f6d860] animate-stamp-in"
                role="status"
              >
                {flash}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-3 mb-2 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-lilac-500 text-sm font-bold uppercase tracking-[0.16em] text-white shadow-pill"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
