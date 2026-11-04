"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useHunter } from "@/lib/hunter-store";
import { isStepsQuest, type QuestKind } from "@/lib/demo-data";
import {
  defaultTargetForKind,
  parseQuestTarget,
  questTargetHint,
} from "@/lib/quest-target";
import {
  EXERCISE_LIBRARY,
  LIBRARY_SOURCE_NOTE,
  exercisesForSplit,
  rankRoleLabel,
  resolveExercise,
  type LibraryExercise,
  type SplitTag,
} from "@/lib/exercise-library";

const ACCENTS = ["#7c6cf0", "#5b9cf5", "#f0a05a", "#5ec4a8", "#e85a7a", "#d48ab8"];

/** Core custom goals only — Steps lives on Home as the progress bar. */
const ADDABLE_KINDS: QuestKind[] = ["count", "distance", "duration", "yesno"];

const SPLIT_TABS: { id: SplitTag | "all"; label: string }[] = [
  { id: "push", label: "Push" },
  { id: "pull", label: "Pull" },
  { id: "legs", label: "Legs" },
  { id: "home", label: "Home" },
  { id: "all", label: "All" },
];

export default function BoardPage() {
  const hunter = useHunter();
  const router = useRouter();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<QuestKind>("count");
  const [targetText, setTargetText] = useState(defaultTargetForKind("count"));
  const [formError, setFormError] = useState<string | null>(null);
  const [split, setSplit] = useState<SplitTag | "all">("push");

  useEffect(() => {
    if (hunter.hydrated && !hunter.entered) {
      router.replace("/");
    }
  }, [hunter.hydrated, hunter.entered, router]);

  const matched = useMemo(() => resolveExercise(name), [name]);

  const catalog = useMemo(() => {
    if (split === "all") return EXERCISE_LIBRARY;
    return exercisesForSplit(split);
  }, [split]);

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

  function addFromLibrary(ex: LibraryExercise) {
    const already = hunter.quests.some(
      (q) => q.name.toLowerCase() === ex.name.toLowerCase(),
    );
    if (already) {
      setFormError(`${ex.name} is already in your pack`);
      return;
    }
    hunter.addQuest({
      name: ex.name,
      kind: ex.kind === "steps" ? "steps" : ex.kind,
      target: ex.defaultTarget,
      unit: ex.unit,
      accent: ex.accent,
    });
    setFormError(null);
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError("Enter a goal name");
      return;
    }
    if (!ADDABLE_KINDS.includes(kind)) {
      setFormError("Pick count, distance, duration, or yes/no");
      return;
    }

    const parsed = parseQuestTarget(kind, targetText);
    if (parsed === null) {
      setFormError(`Enter a valid target — ${questTargetHint(kind)}`);
      return;
    }

    // Prefer library defaults when the typed name matches
    if (matched) {
      addFromLibrary({
        ...matched,
        defaultTarget: parsed,
      });
      setName("");
      setKind("count");
      setTargetText(defaultTargetForKind("count"));
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

  const editableQuests = hunter.quests.filter((q) => !isStepsQuest(q));

  return (
    <section className="mx-auto w-full max-w-lg px-4 pb-8 pt-2 sm:px-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lilac-400">Quest Board</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink-900">Your goals</h1>
      <p className="mt-2 text-base font-semibold text-ink-700/55">
        Gym: add up to ~3 core lifts for Rank. Sit-ups, run, and steps still count. Accessories are
        optional diary — 0 Rank SP.
      </p>

      <ul className="mt-8 space-y-2">
        {editableQuests.map((q) => {
          const ex = resolveExercise(q.name);
          const role = ex?.rankRole;
          return (
            <li
              key={q.id}
              className="soft-card flex items-center justify-between gap-3 rounded-[1.25rem] px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ background: q.accent }}
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="font-display text-base text-ink-900">{q.name}</p>
                  <p className="text-sm font-semibold text-ink-700/45">
                    {q.kind === "yesno" ? "Yes / No" : `${q.target} ${q.unit}`} · {q.kind}
                  </p>
                  <p
                    className={`mt-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      role === "accessory" || !ex
                        ? "text-ink-700/35"
                        : "text-system-clear"
                    }`}
                  >
                    {ex ? rankRoleLabel(ex.rankRole) : "Custom · 0 Rank SP unless recognized"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => hunter.removeQuest(q.id)}
                className="shrink-0 text-xs font-bold uppercase tracking-wide text-system-danger/80 hover:text-system-danger"
              >
                Remove
              </button>
            </li>
          );
        })}
      </ul>

      {editableQuests.length === 0 && (
        <p className="mt-8 text-center text-sm font-semibold text-ink-700/45">
          No goals yet — pick from the System library below.
        </p>
      )}

      {/* Library picker */}
      <div className="mt-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-lilac-400">
          System library
        </p>
        <p className="mt-1 text-xs font-semibold text-ink-700/45">{LIBRARY_SOURCE_NOTE}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SPLIT_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSplit(t.id)}
              className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide transition ${
                split === t.id
                  ? "bg-lilac-500 text-white shadow-pill"
                  : "bg-white/80 text-ink-700/50 ring-1 ring-lilac-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <ul className="mt-3 grid max-h-64 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
          {catalog.map((ex) => (
            <li key={ex.id}>
              <button
                type="button"
                onClick={() => addFromLibrary(ex)}
                className="soft-card flex w-full flex-col items-start rounded-[1.15rem] px-3 py-2.5 text-left transition hover:-translate-y-0.5 hover:shadow-soft"
              >
                <span className="font-display text-sm text-ink-900">{ex.name}</span>
                <span
                  className={`mt-1 text-[9px] font-bold uppercase tracking-wide ${
                    ex.rankRole === "accessory" ? "text-ink-700/35" : "text-system-clear"
                  }`}
                >
                  {rankRoleLabel(ex.rankRole)} · {ex.defaultTarget} {ex.unit}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={handleAdd} className="soft-card mt-8 space-y-4 rounded-[1.5rem] p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-lilac-400">
          Custom / search
        </p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Bench press or Cable fly"
          className="w-full rounded-xl border border-lilac-200 bg-white px-3 py-2.5 font-semibold text-ink-900 outline-none focus:border-lilac-400"
          required
        />
        {matched && (
          <p
            className={`text-xs font-bold ${
              matched.rankRole === "accessory" ? "text-ink-700/45" : "text-system-clear"
            }`}
          >
            Matched: {matched.name} — {rankRoleLabel(matched.rankRole)}
          </p>
        )}
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
              <option value="count">Count / sets</option>
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
                {matched?.unit === "sets" || kind === "count"
                  ? "Target = your daily goal (gym cores: working sets, e.g. 3). Clear when you hit it."
                  : questTargetHint(kind)}
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
