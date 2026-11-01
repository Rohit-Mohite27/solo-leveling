"use client";

import Image from "next/image";
import Link from "next/link";
import { armyStats, unlockedAllies } from "@/lib/demo-data";

type Props = {
  level: number;
};

/** Home strip — recent recruits + gate into the full Army roster. */
export function ArmyTeaser({ level }: Props) {
  const unlocked = unlockedAllies(level);
  const stats = armyStats(level);
  const recent = [...unlocked].reverse().slice(0, 5);

  return (
    <Link
      href="/army"
      className="soft-card mt-5 block animate-fade-up rounded-[1.5rem] p-4 transition hover:-translate-y-0.5 hover:shadow-soft"
      style={{ animationDelay: "0.1s" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-lilac-400">
            Shadow Gate
          </p>
          <p className="mt-1 font-display text-xl font-semibold text-ink-900">Your Army</p>
          <p className="mt-0.5 text-xs font-semibold text-ink-700/45">
            {stats.unlocked}/{stats.total} recruited · {stats.shadows} shadows · {stats.hunters}{" "}
            allies
          </p>
        </div>
        <span className="rounded-full bg-lilac-500/10 px-2.5 py-1 text-[11px] font-bold text-lilac-600">
          {stats.percent}%
        </span>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-lilac-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-lilac-400 to-sea-400 transition-[width] duration-700"
          style={{ width: `${stats.percent}%` }}
        />
      </div>

      <div className="mt-4 flex items-center gap-2">
        {recent.length === 0 ? (
          <p className="text-sm font-semibold text-ink-700/45">
            Level up to recruit your first ally…
          </p>
        ) : (
          <>
            <div className="flex -space-x-2">
              {recent.map((ally) => (
                <div
                  key={ally.id}
                  className="relative h-11 w-11 overflow-hidden rounded-full border-2 border-white shadow-sm"
                  style={{ background: `${ally.accent}33` }}
                >
                  {ally.image ? (
                    <Image
                      src={ally.image}
                      alt={ally.name}
                      fill
                      unoptimized
                      className="object-cover object-top"
                      sizes="44px"
                    />
                  ) : null}
                </div>
              ))}
            </div>
            <span className="ml-auto text-[11px] font-bold uppercase tracking-wide text-lilac-500">
              View roster →
            </span>
          </>
        )}
      </div>
    </Link>
  );
}
