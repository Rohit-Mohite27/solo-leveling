"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useHunter } from "@/lib/hunter-store";
import {
  DEFAULT_STEPS_TARGET,
  isStepsQuest,
  type QuestKind,
} from "@/lib/demo-data";
import {
  defaultTargetForKind,
  parseQuestTarget,
  questTargetHint,
} from "@/lib/quest-target";

const ACCENTS = ["#7c6cf0", "#5b9cf5", "#f0a05a", "#5ec4a8", "#e85a7a", "#d48ab8"];

/** Core custom goals only — Steps stays as the fixed home progress bar. */
const ADDABLE_KINDS: QuestKind[] = ["count", "distance", "duration", "yesno"];

export default function BoardPage() {
  const hunter = useHunter();
  const router = useRouter();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<QuestKind>("count");
  const [targetText, setTargetText] = useState(defaultTargetForKind("count"));
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (hunter.hydrated && !hunter.entered) {
      router.replace("/");
    }
  }, [hunter.hydrated, hunter.entered, router]);

  if (!hunter.hydrated || !hunter.entered) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-lilac-400">
        Loading board…
      </div>
    );
  }

  function unitFor(k: QuestKind): string {
    if (k === "distance") return "km";
    if (k === "duration") return "min";
    if (k === "yesno") return "done";
    if (k === "steps") return "steps";
    return "reps";
  }

  function addStepsGoal() {
    const exists = hunter.quests.some((q) => isStepsQuest(q));
    if (exists) return;
    hunter.addQuest({
      name: "Steps",
      kind: "steps",
      target: DEFAULT_STEPS_TARGET,
      unit: "steps",
      accent: "#5ec4a8",
    });
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError("Enter a goal name");
      return;
    }
    if (!ADDABLE_KINDS.includes(kind)) {
      setFormError("Use the Steps section above for the step counter");
      return;
    }

    const parsed = parseQuestTarget(kind, targetText);
    if (parsed === null) {
      setFormError(`Enter a valid target — ${questTargetHint(kind)}`);
      return;
    }

    hunter.addQuest({
      name: name.trim(),
      kind,
      target: parsed,
      unit: unitFor(kind),
      accent: ACCENTS[hunter.quests.length % ACCENTS.length],
    });
    setName("");
    setKind("count");
    setTargetText(defaultTargetForKind("count"));
  }

  const hasSteps = hunter.quests.some((q) => isStepsQuest(q));

  return (
    <section className="mx-auto w-full max-w-lg px-4 pb-8 pt-2 sm:px-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lilac-400">Quest Board</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink-900">Your goals</h1>
      <p className="mt-2 text-base font-semibold text-ink-700/55">
        These show up as cards on Home — tap Done / Not done there. The Steps bar stays on Home and
        cannot be removed.
      </p>

      <div className="soft-card mt-6 rounded-[1.35rem] p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-lilac-400">
          Steps goal
        </p>
        <p className="mt-1 text-sm font-semibold text-ink-700/55">
          Fixed on Home as a progress bar (optional for streak). Edit the daily target from Home —
          200, 500, 10,000, whatever you want.
        </p>
        <button
          type="button"
          onClick={() => addStepsGoal()}
          disabled={hasSteps}
          className="mt-3 min-h-11 w-full rounded-2xl bg-lilac-500 text-sm font-bold uppercase tracking-[0.14em] text-white shadow-pill transition hover:bg-lilac-600 disabled:opacity-40"
        >
          {hasSteps ? "Steps bar is active" : "Restore steps bar (10,000)"}
        </button>
      </div>

      <ul className="mt-8 space-y-2">
        {hunter.quests.map((q) => {
          const lockedSteps = isStepsQuest(q);
          return (
            <li
              key={q.id}
              className="soft-card flex items-center justify-between gap-3 rounded-[1.25rem] px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ background: q.accent }}
                  aria-hidden
                />
                <div>
                  <p className="font-display text-base text-ink-900">
                    {q.name}
                    {lockedSteps ? (
                      <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-ink-700/35">
                        Fixed
                      </span>
                    ) : null}
                  </p>
                  <p className="text-sm font-semibold text-ink-700/45">
                    {q.kind === "yesno" ? "Yes / No" : `${q.target} ${q.unit}`} · {q.kind}
                  </p>
                </div>
              </div>
              {lockedSteps ? (
                <span className="text-[10px] font-bold uppercase tracking-wide text-ink-700/35">
                  Locked
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => hunter.removeQuest(q.id)}
                  className="text-xs font-bold uppercase tracking-wide text-system-danger/80 hover:text-system-danger"
                >
                  Remove
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <form onSubmit={handleAdd} className="soft-card mt-8 space-y-4 rounded-[1.5rem] p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-lilac-400">Add goal</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Goal name"
          className="w-full rounded-xl border border-lilac-200 bg-white px-3 py-2.5 font-semibold text-ink-900 outline-none focus:border-lilac-400"
          required
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-ink-700/40">
              Type
            </span>
            <select
              value={kind}
              onChange={(e) => {
                const next = e.target.value as QuestKind;
                setKind(next);
                setTargetText(defaultTargetForKind(next));
                setFormError(null);
              }}
              className="w-full rounded-xl border border-lilac-200 bg-white px-3 py-2.5 font-semibold text-ink-900 outline-none"
            >
              <option value="count">Count</option>
              <option value="distance">Distance</option>
              <option value="duration">Duration</option>
              <option value="yesno">Yes / No</option>
            </select>
          </label>
          {kind !== "yesno" && (
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-ink-700/40">
                Target
              </span>
              <input
                type="text"
                inputMode={kind === "distance" ? "decimal" : "numeric"}
                value={targetText}
                onChange={(e) => {
                  // Allow clearing / partial typing; validate on submit
                  const next = e.target.value;
                  if (kind === "distance") {
                    if (next === "" || /^\d*\.?\d*$/.test(next)) setTargetText(next);
                  } else if (next === "" || /^\d*$/.test(next)) {
                    setTargetText(next);
                  }
                  setFormError(null);
                }}
                placeholder={defaultTargetForKind(kind)}
                className="w-full rounded-xl border border-lilac-200 bg-white px-3 py-2.5 font-semibold text-ink-900 outline-none"
              />
              <span className="mt-1 block text-[11px] font-semibold text-ink-700/40">
                {questTargetHint(kind)}
              </span>
            </label>
          )}
        </div>
        {formError && (
          <p className="text-sm font-semibold text-system-danger" role="alert">
            {formError}
          </p>
        )}
        <button
          type="submit"
          className="min-h-11 w-full rounded-2xl bg-lilac-500 font-bold uppercase tracking-[0.16em] text-white shadow-pill transition hover:bg-lilac-600"
        >
          Add to pack
        </button>
      </form>
    </section>
  );
}
