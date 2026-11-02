"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AllyDetailSheet } from "@/components/AllyDetailSheet";
import {
  ALLIES,
  alliesByFaction,
  allyAscension,
  allyPower,
  ascensionLabel,
  armyStats,
  firstName,
  type Ally,
  type AllyFaction,
} from "@/lib/demo-data";
import { useHunter } from "@/lib/hunter-store";

export default function ArmyPage() {
  const hunter = useHunter();
  const router = useRouter();
  const [tab, setTab] = useState<AllyFaction | "all">("all");
  const [selected, setSelected] = useState<Ally | null>(null);

  useEffect(() => {
    if (hunter.hydrated && !hunter.entered) {
      router.replace("/");
    }
  }, [hunter.hydrated, hunter.entered, router]);

  const stats = useMemo(() => armyStats(hunter.level), [hunter.level]);
  const hunters = useMemo(
    () => alliesByFaction("hunter", hunter.level),
    [hunter.level],
  );
  const shadows = useMemo(
    () => alliesByFaction("shadow", hunter.level),
    [hunter.level],
  );

  if (!hunter.hydrated || !hunter.entered) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-lilac-400">
        Opening the Gate…
      </div>
    );
  }

  const hunterName = firstName(hunter.name);

  return (
    <section className="mx-auto w-full max-w-lg px-4 pb-8 pt-2 sm:px-5">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#2a2458] via-[#3d3566] to-[#5b4bb8] px-5 pb-5 pt-6 text-white shadow-soft animate-fade-up">
        <div
          className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-lilac-300/25 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-12 left-6 h-36 w-36 rounded-full bg-sea-400/20 blur-2xl"
          aria-hidden
        />
        <p className="relative text-[10px] font-bold uppercase tracking-[0.22em] text-system-gold">
          Shadow Gate
        </p>
        <h1 className="relative mt-2 font-display text-3xl font-semibold leading-tight">
          {hunterName}&apos;s Army
        </h1>
        <p className="relative mt-2 max-w-[32ch] text-sm font-semibold text-white/65">
          Allies stand with you. Shadows answer only to you. After the full roster, the loop
          returns to Jinho — each return awakens more power.
        </p>

        <div className="relative mt-5 grid grid-cols-3 gap-2">
          <StatChip label="Recruited" value={`${stats.unlocked}/${stats.total}`} />
          <StatChip label="Shadows" value={String(stats.shadows)} />
          <StatChip label="Allies" value={String(stats.hunters)} />
        </div>

        <div className="relative mt-4">
          <div className="mb-1.5 flex justify-between text-[10px] font-bold uppercase tracking-wide text-white/50">
            <span>Army strength</span>
            <span>{stats.percent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-gradient-to-r from-system-gold via-lilac-300 to-sea-400 transition-[width] duration-700"
              style={{ width: `${stats.percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-5 flex gap-1 rounded-2xl bg-white/70 p-1 ring-1 ring-lilac-100">
        {(
          [
            { id: "all", label: "All" },
            { id: "hunter", label: "Allies" },
            { id: "shadow", label: "Shadows" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`min-h-10 flex-1 rounded-xl text-xs font-bold uppercase tracking-wide transition ${
              tab === t.id
                ? "bg-lilac-500 text-white shadow-pill"
                : "text-ink-700/50 hover:text-ink-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {(tab === "all" || tab === "hunter") && (
        <RosterSection
          title="Hunter allies"
          subtitle="People who walk beside you"
          unlocked={hunters.unlocked}
          locked={hunters.locked}
          hunterLevel={hunter.level}
          onSelect={setSelected}
        />
      )}

      {(tab === "all" || tab === "shadow") && (
        <RosterSection
          title="Shadow Army"
          subtitle="Soldiers bound to your command — stronger each loop"
          unlocked={shadows.unlocked}
          locked={shadows.locked}
          hunterLevel={hunter.level}
          onSelect={setSelected}
          dark
        />
      )}

      {stats.unlocked === 0 && (
        <p className="mt-8 text-center text-sm font-semibold text-ink-700/45">
          Reach Level 2 to open the Gate and recruit your first ally.
        </p>
      )}

      <p className="mt-8 text-center text-[11px] font-semibold text-ink-700/35">
        {ALLIES.length} souls in the System archive
      </p>

      {selected && (
        <AllyDetailSheet
          ally={selected}
          hunterName={hunterName}
          hunterLevel={hunter.level}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 px-3 py-2.5 ring-1 ring-white/10">
      <p className="text-[9px] font-bold uppercase tracking-wide text-white/45">{label}</p>
      <p className="mt-0.5 font-display text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function RosterSection({
  title,
  subtitle,
  unlocked,
  locked,
  hunterLevel,
  onSelect,
  dark = false,
}: {
  title: string;
  subtitle: string;
  unlocked: Ally[];
  locked: Ally[];
  hunterLevel: number;
  onSelect: (ally: Ally) => void;
  dark?: boolean;
}) {
  const rows = [
    ...unlocked.map((a) => ({ ally: a, open: true as const })),
    ...locked.map((a) => ({ ally: a, open: false as const })),
  ];

  return (
    <div className="mt-6 animate-fade-up">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-lilac-400">{title}</p>
      <p className="mt-1 text-sm font-semibold text-ink-700/45">{subtitle}</p>

      <ul className="mt-3 grid grid-cols-2 gap-3">
        {rows.map(({ ally, open }) => {
          const ascension = open ? allyAscension(hunterLevel, ally) : 0;
          const power = open ? allyPower(ally, ascension) : 0;
          return (
            <li key={ally.id}>
              <button
                type="button"
                disabled={!open}
                onClick={() => open && onSelect(ally)}
                className={`group relative flex w-full flex-col overflow-hidden rounded-[1.35rem] text-left transition ${
                  open
                    ? "soft-card hover:-translate-y-0.5 hover:shadow-soft active:scale-[0.99]"
                    : "bg-white/50 ring-1 ring-lilac-100/80"
                }`}
              >
                <div
                  className={`relative aspect-[3/4] w-full overflow-hidden ${
                    dark && open ? "bg-[#1e1a3a]" : ""
                  }`}
                  style={{
                    background: open
                      ? `linear-gradient(165deg, ${ally.accent}55 0%, #efe8ff 70%, #fff6ec 100%)`
                      : "linear-gradient(180deg, #eee6ff, #f7f3ff)",
                  }}
                >
                  {ally.image && (
                    <Image
                      src={ally.image}
                      alt={open ? ally.name : ""}
                      fill
                      unoptimized
                      className={`object-contain object-center p-2 transition duration-500 ${
                        open
                          ? "opacity-100 group-hover:scale-[1.03]"
                          : "scale-105 opacity-25 blur-[1.5px] grayscale"
                      }`}
                      sizes="180px"
                    />
                  )}
                  {!open && (
                    <span className="absolute inset-0 flex items-center justify-center bg-lilac-50/35">
                      <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-lilac-500 shadow-sm">
                        Lv {ally.unlockLevel}
                      </span>
                    </span>
                  )}
                  {open && (
                    <span
                      className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white"
                      style={{
                        background: ascension > 1 ? "#c9a227" : `${ally.accent}cc`,
                      }}
                    >
                      {ascension > 1
                        ? ascensionLabel(ascension)
                        : ally.faction === "shadow"
                          ? "Shadow"
                          : "Ally"}
                    </span>
                  )}
                </div>
                <div className="px-3 py-2.5">
                  <p
                    className={`font-display text-base font-semibold leading-tight ${
                      open ? "text-ink-900" : "text-ink-700/35"
                    }`}
                  >
                    {open ? ally.name : "Unknown"}
                  </p>
                  <p
                    className={`mt-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      open ? "text-ink-700/40" : "text-ink-700/25"
                    }`}
                  >
                    {open ? `PWR ${power.toLocaleString()}` : "Sealed"}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
