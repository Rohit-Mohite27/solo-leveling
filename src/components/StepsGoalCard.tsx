"use client";

import { useEffect, useState } from "react";
import { isStepsQuest, type Quest } from "@/lib/demo-data";

type Props = {
  quest: Quest;
  value: number;
  locked?: boolean;
  onUpdateSteps: (value: number) => void;
  onUpdateTarget: (target: number) => void;
};

/**
 * Optional steps tracker — does not affect streak / core quest clear.
 */
export function StepsGoalCard({
  quest,
  value,
  locked = false,
  onUpdateSteps,
  onUpdateTarget,
}: Props) {
  const [draft, setDraft] = useState("");
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState(String(quest.target));

  const target = Math.max(1, quest.target);
  const current = Math.max(0, value);
  const pct = Math.min(100, Math.round((current / target) * 100));

  useEffect(() => {
    if (!editingGoal) setGoalDraft(String(quest.target));
  }, [quest.target, editingGoal]);

  /** Single add is capped at 5 digits (1–99999). */
  const MAX_STEP_ADD = 99999;

  function commitSteps() {
    if (draft.trim() === "") return;
    // Each Add piles onto the current total (4000 then +450 → 4450); past the goal is fine.
    let added = Math.max(0, Math.floor(Number(draft) || 0));
    if (added === 0) {
      setDraft("");
      return;
    }
    if (added > MAX_STEP_ADD) added = MAX_STEP_ADD;
    onUpdateSteps(current + added);
    setDraft("");
  }

  function saveGoal() {
    const raw = goalDraft.trim();
    const parsed = Math.floor(Number(raw));
    // Allow any positive whole goal (200, 500, 10000, …) — do not force a 1000 floor
    if (!Number.isFinite(parsed) || parsed < 1) return;
    const next = Math.min(parsed, 500_000);
    onUpdateTarget(next);
    setGoalDraft(String(next));
    setEditingGoal(false);
  }

  return (
    <>
      <div className="soft-card relative col-span-2 flex flex-col rounded-[1.5rem] p-4 text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
              style={{ background: `${quest.accent}22`, color: quest.accent }}
              aria-hidden
            >
              <StepsIcon />
            </span>
            <div className="min-w-0">
              <p className="font-body text-sm font-bold text-lilac-400">
                {quest.name}
                <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-ink-700/35">
                  Optional
                </span>
              </p>
              <p className="font-display text-2xl font-semibold text-ink-900">
                {current.toLocaleString()}
                <span className="text-base font-semibold text-ink-700/40">
                  {" "}
                  / {target.toLocaleString()}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEditingGoal(true)}
            className="shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-lilac-500 ring-1 ring-lilac-200 transition hover:bg-lilac-50 hover:text-lilac-600"
          >
            Edit goal
          </button>
        </div>

        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-lilac-100">
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${quest.accent}, #7c6cf0)`,
            }}
          />
        </div>
        <p className="mt-1.5 text-xs font-semibold text-ink-700/45">
          {pct >= 100 ? "Goal hit — keep going if you want" : `${pct}% of daily goal`}
          {" · "}
          optional (doesn’t affect streak)
        </p>

        {!locked && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={5}
              value={draft}
              onChange={(e) => {
                // Digits only, max 5 (99999 per add)
                const digits = e.target.value.replace(/\D/g, "").slice(0, 5);
                setDraft(digits);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitSteps();
              }}
              aria-label="Add steps to today's total (max 99999)"
              className="min-w-0 flex-1 rounded-xl border border-lilac-200 bg-white px-3 py-2.5 font-body text-base font-semibold text-ink-900 outline-none focus:border-lilac-400"
              placeholder=""
            />
            <button
              type="button"
              onClick={commitSteps}
              className="rounded-xl bg-lilac-500 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-pill"
            >
              Add
            </button>
          </div>
        )}

        <p className="mt-3 text-[11px] font-semibold leading-relaxed text-ink-700/45">
          {isStepsQuest(quest)
            ? "Paste today’s total from Apple Health (iPhone) or Health Connect / Fitness (Android). Auto-connect from the browser isn’t available yet."
            : null}
        </p>
      </div>

      {editingGoal && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[#2a2458]/55 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-steps-goal-title"
          onClick={() => setEditingGoal(false)}
        >
          <div
            className="w-full max-w-sm rounded-[1.5rem] bg-white p-5 shadow-soft"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-lilac-400">
              Steps goal
            </p>
            <h3
              id="edit-steps-goal-title"
              className="mt-2 font-display text-2xl font-semibold text-ink-900"
            >
              Edit daily target
            </h3>
            <p className="mt-1 text-sm font-semibold text-ink-700/50">
              Set any daily goal — 200, 500, 10,000, whatever fits you.
            </p>

            <label className="mt-5 block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-ink-700/40">
                Target steps
              </span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoFocus
                value={goalDraft}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setGoalDraft(digits);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveGoal();
                }}
                className="w-full rounded-xl border border-lilac-200 bg-white px-3 py-3 font-display text-xl font-semibold text-ink-900 outline-none focus:border-lilac-400"
              />
            </label>

            <div className="mt-3 flex flex-wrap gap-2">
              {[200, 500, 10000, 15000, 20000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setGoalDraft(String(preset))}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                    Number(goalDraft) === preset
                      ? "bg-lilac-500 text-white"
                      : "bg-lilac-50 text-lilac-600 ring-1 ring-lilac-200"
                  }`}
                >
                  {preset.toLocaleString()}
                </button>
              ))}
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setEditingGoal(false)}
                className="min-h-11 flex-1 rounded-2xl bg-white text-sm font-bold uppercase tracking-wide text-lilac-600 ring-1 ring-lilac-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveGoal}
                className="min-h-11 flex-1 rounded-2xl bg-lilac-500 text-sm font-bold uppercase tracking-wide text-white shadow-pill"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function StepsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 20l2-7 2 2 3-8 2 4h3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="6" r="2" fill="currentColor" />
    </svg>
  );
}
