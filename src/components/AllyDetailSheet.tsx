"use client";

import Image from "next/image";
import {
  allyAscension,
  allyPower,
  ascensionLabel,
  personalizeLine,
  type Ally,
} from "@/lib/demo-data";

type Props = {
  ally: Ally;
  hunterName: string;
  hunterLevel: number;
  onClose: () => void;
};

/** Soft premium sheet — replay an ally / shadow greeting from the Army roster. */
export function AllyDetailSheet({
  ally,
  hunterName,
  hunterLevel,
  onClose,
}: Props) {
  const line = personalizeLine(ally.line, hunterName);
  const art = ally.image || "/characters/ally-jinho.png";
  const ascension = allyAscension(hunterLevel, ally);
  const power = allyPower(ally, ascension);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-[#1a1538]/55 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ally-sheet-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md animate-level-rise overflow-hidden rounded-[1.5rem] bg-white shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="relative h-56 w-full sm:h-64"
          style={{
            background: `linear-gradient(165deg, ${ally.accent}66 0%, #efe8ff 55%, #fff6ec 100%)`,
          }}
        >
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
            style={{ background: ally.accent, opacity: 0.45 }}
            aria-hidden
          />
          <Image
            src={art}
            alt={ally.name}
            fill
            unoptimized
            className="object-contain object-center p-3"
            sizes="400px"
          />
          <span className="absolute left-3 top-3 rounded-full bg-[#1e1a3a]/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-system-gold">
            {ally.faction === "shadow" ? "Shadow" : "Ally"}
          </span>
        </div>

        <div className="px-5 pb-5 pt-4">
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
          <button
            type="button"
            onClick={onClose}
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-lilac-500 text-sm font-bold uppercase tracking-[0.16em] text-white shadow-pill"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
