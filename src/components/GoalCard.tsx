"use client";

import { questTargetLabel, type Quest } from "@/lib/demo-data";

type Props = {
  quest: Quest;
  done: boolean;
  locked?: boolean;
  onToggle: () => void;
};

export function GoalCard({ quest, done, locked = false, onToggle }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={locked}
      className={`soft-card relative flex min-h-[7.5rem] flex-col items-start rounded-[1.5rem] p-4 text-left transition ${
        locked
          ? "cursor-default opacity-80"
          : "hover:-translate-y-0.5 hover:shadow-soft active:scale-[0.99]"
      } ${done ? "ring-2 ring-system-clear/70" : ""}`}
      aria-pressed={done}
    >
      <div className="flex w-full items-start justify-between gap-2">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-2xl"
          style={{ background: `${quest.accent}22`, color: quest.accent }}
          aria-hidden
        >
          <GoalIcon name={quest.name} />
        </span>
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-sm font-bold ${
            done
              ? "border-system-clear bg-system-clear text-white"
              : "border-lilac-200 bg-white text-transparent"
          }`}
          aria-hidden
        >
          ✓
        </span>
      </div>

      <p className="mt-4 font-body text-sm font-bold text-lilac-400">{quest.name}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-ink-900">
        {done ? "Done" : "Not done"}
      </p>
      <p className="mt-1 text-xs font-semibold text-ink-700/45">{questTargetLabel(quest)}</p>
    </button>
  );
}

function GoalIcon({ name }: { name: string }) {
  const n = name.toLowerCase();
  // Simple geometric marks — no emoji clutter
  if (n.includes("run") || n.includes("walk")) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="5" r="2.2" fill="currentColor" />
        <path
          d="M9 22l2-7 2 2 3-6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M8 12l3 1 2-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (n.includes("gym") || n.includes("workout")) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 10h3v4H4V10zm13 0h3v4h-3v-4zM7 11h10v2H7v-2z"
          fill="currentColor"
        />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    </svg>
  );
}
