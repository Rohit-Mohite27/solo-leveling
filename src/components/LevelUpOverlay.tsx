"use client";

import Image from "next/image";
import {
  allyAscension,
  allyPower,
  ascensionLabel,
  firstName,
  personalizeLine,
} from "@/lib/demo-data";
import { useHunter } from "@/lib/hunter-store";

/**
 * Ally unlock splash — character art is the hero (gacha-style),
 * greeting + continue sit in the lower band over a soft fade.
 * After a full roster, loops awaken allies with higher power.
 */
export function LevelUpOverlay() {
  const { pendingAlly, level, name, dismissAlly } = useHunter();

  if (!pendingAlly) return null;

  const hunterName = firstName(name);
  const line = personalizeLine(pendingAlly.line, hunterName);
  const art = pendingAlly.image || "/characters/ally-jinho.png";
  const accent = pendingAlly.accent;
  const ascension = allyAscension(level, pendingAlly);
  const power = allyPower(pendingAlly, ascension);
  const awakened = ascension > 1;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1a1538]/70 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="level-up-title"
      onClick={dismissAlly}
    >
      <div
        className="relative flex h-[min(88dvh,720px)] w-[calc(100%-8px)] max-w-[420px] animate-level-rise flex-col overflow-hidden rounded-[1.5rem] shadow-[0_24px_64px_rgba(42,36,88,0.45)] sm:max-w-[440px]"
        style={{
          background: `linear-gradient(180deg, ${accent}55 0%, #efe8ff 38%, #fff6ec 100%)`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* —— Hero character (majority of the card) —— */}
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <div
            className="pointer-events-none absolute left-1/2 top-[42%] h-[70%] w-[90%] -translate-x-1/2 -translate-y-1/2 animate-glow-pulse rounded-full blur-3xl"
            style={{ background: accent }}
            aria-hidden
          />

          <span
            className="absolute left-3 top-3 z-10 animate-stamp-in rounded-full bg-[#1e1a3a]/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-system-gold shadow-pill"
            style={{ animationDelay: "0.12s", animationFillMode: "both" }}
          >
            Level {level}
          </span>

          <div className="absolute inset-x-1 top-8 bottom-[2%] animate-ally-enter sm:inset-x-2 sm:top-10 sm:bottom-[4%]">
            <div className="relative mx-auto h-full w-full max-w-[380px] animate-float">
              <Image
                src={art}
                alt={pendingAlly.name}
                fill
                priority
                unoptimized
                sizes="(max-width: 480px) 92vw, 400px"
                className="object-contain object-center drop-shadow-[0_12px_28px_rgba(42,36,88,0.28)]"
                style={
                  pendingAlly.artScale
                    ? {
                        transform: `scale(${pendingAlly.artScale})`,
                        transformOrigin: "center center",
                      }
                    : undefined
                }
              />
            </div>
          </div>

          {/* Soft fade into greeting — keep character face visible */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[28%] bg-gradient-to-t from-[#fff6ec] via-[#fff6ec]/75 to-transparent"
            aria-hidden
          />
        </div>

        {/* —— Greeting band (bottom) —— */}
        <div className="relative z-10 -mt-2 shrink-0 px-5 pb-5 pt-1 sm:px-6 sm:pb-6">
          <p
            className="animate-hud-flash text-center text-[11px] font-bold uppercase tracking-[0.22em] text-system-gold"
            style={{ animationDelay: "0.25s", animationFillMode: "both" }}
          >
            {awakened ? "Ally awakened" : "Ally unlocked"}
          </p>
          <h2
            id="level-up-title"
            className="mt-1.5 animate-type-fade text-center font-display text-[1.65rem] font-semibold leading-tight text-ink-900 sm:text-[1.85rem]"
            style={{ animationDelay: "0.35s", animationFillMode: "both" }}
          >
            {pendingAlly.name}
          </h2>
          <p
            className="mt-1 animate-type-fade text-center text-[11px] font-bold uppercase tracking-[0.18em] text-ink-700/45"
            style={{ animationDelay: "0.42s", animationFillMode: "both" }}
          >
            {pendingAlly.title}
          </p>
          <div
            className="mt-2 flex animate-type-fade flex-wrap items-center justify-center gap-2"
            style={{ animationDelay: "0.48s", animationFillMode: "both" }}
          >
            <span
              className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white"
              style={{ background: awakened ? "#c9a227" : `${accent}cc` }}
            >
              {ascensionLabel(ascension)}
            </span>
            <span className="rounded-full bg-lilac-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-lilac-700">
              Power {power.toLocaleString()}
              {awakened ? ` · +${Math.round((ascension - 1) * 50)}%` : ""}
            </span>
          </div>
          <p
            className="mx-auto mt-3 max-w-[34ch] animate-type-fade text-center font-body text-[15px] font-semibold leading-relaxed text-ink-800"
            style={{ animationDelay: "0.55s", animationFillMode: "both" }}
          >
            “{line}”
          </p>
          <p
            className="mt-2 animate-type-fade text-center text-xs font-semibold text-ink-700/45"
            style={{ animationDelay: "0.62s", animationFillMode: "both" }}
          >
            {hunterName} · Level {level}
            {awakened ? " · Loop boost active" : ""}
          </p>

          <button
            type="button"
            onClick={dismissAlly}
            className="mt-4 inline-flex min-h-12 w-full animate-btn-pop items-center justify-center rounded-2xl bg-lilac-500 text-sm font-bold uppercase tracking-[0.16em] text-white shadow-pill transition hover:bg-lilac-600"
            style={{
              animationDelay: "0.68s",
              animationFillMode: "both",
              background: `linear-gradient(135deg, #7c6cf0 0%, ${accent} 160%)`,
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
