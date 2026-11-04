"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DEMO_TESTING, type Quest } from "@/lib/demo-data";
import { rankRoleLabel, resolveExercise } from "@/lib/exercise-library";
import {
  DAILY_SP_CAP,
  scoreDayCapped,
  scoreTasksUncapped,
  spForTask,
} from "@/lib/guild-points";
import { useHunter } from "@/lib/hunter-store";

function QuestRow({
  quest,
  value,
  cleared,
  homeValue,
  onChange,
  onYesNo,
}: {
  quest: Quest;
  value: number;
  cleared: boolean;
  homeValue: number;
  onChange: (v: number) => void;
  onYesNo: (done: boolean) => void;
}) {
  const ex = resolveExercise(quest.name);
  const preview = spForTask({
    name: quest.name,
    kind: quest.kind,
    unit: quest.unit,
    value: homeValue + value,
    cleared: quest.kind === "yesno" ? value >= 1 || homeValue >= 1 : homeValue + value >= quest.target,
  });

  return (
    <li className="soft-card rounded-[1.35rem] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-lg text-ink-900">{quest.name}</p>
          <p className="mt-0.5 text-sm font-semibold text-ink-700/45">
            {quest.kind === "yesno"
              ? "Goal: hold the line"
              : quest.unit === "sets"
                ? `Goal ${quest.target} working sets · draft +${value}`
                : `Goal ${quest.target} ${quest.unit} · draft +${value}`}
          </p>
          <p
            className={`mt-1 text-[10px] font-bold uppercase tracking-wide ${
              preview.counted ? "text-system-clear" : "text-ink-700/35"
            }`}
          >
            {ex ? rankRoleLabel(ex.rankRole) : "Custom · usually 0 Rank SP"}
            {preview.counted ? ` · ~${preview.sp} SP if saved` : ""}
          </p>
        </div>
        {cleared ? (
          <span className="animate-stamp-in rounded-full bg-system-clear/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-system-clear">
            Clear
          </span>
        ) : (
          <span className="rounded-full bg-lilac-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-lilac-400">
            In progress
          </span>
        )}
      </div>

      <div className="mt-4">
        {quest.kind === "yesno" ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onYesNo(true)}
              className={`min-h-10 flex-1 rounded-xl border font-bold transition ${
                value === 1
                  ? "border-system-clear bg-system-clear/15 text-system-clear"
                  : "border-lilac-200 text-ink-700/60 hover:border-system-clear/50"
              }`}
            >
              Done
            </button>
            <button
              type="button"
              onClick={() => onYesNo(false)}
              className={`min-h-10 flex-1 rounded-xl border font-bold transition ${
                value === 0 && !cleared
                  ? "border-system-danger/50 bg-system-danger/10 text-system-danger"
                  : "border-lilac-200 text-ink-700/60"
              }`}
            >
              Skipped
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0}
              step={quest.kind === "distance" ? 0.1 : 1}
              inputMode={quest.kind === "steps" ? "numeric" : undefined}
              value={value || ""}
              onChange={(e) => onChange(Number(e.target.value) || 0)}
              placeholder={quest.unit === "sets" ? "sets done" : "0"}
              className="w-full rounded-xl border border-lilac-200 bg-white px-3 py-2.5 font-body text-lg font-semibold text-ink-900 outline-none focus:border-lilac-400"
            />
            <span className="shrink-0 text-sm font-semibold text-ink-700/40">{quest.unit}</span>
          </div>
        )}
      </div>
    </li>
  );
}

export default function DailyPage() {
  const hunter = useHunter();
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  /** Drafts — Save progress commits these onto Home task cards (does not lock the day). */
  const [drafts, setDrafts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (hunter.hydrated && !hunter.entered) {
      router.replace("/");
    }
  }, [hunter.hydrated, hunter.entered, router]);

  useEffect(() => {
    if (!hunter.hydrated || !hunter.entered) return;
    const next: Record<string, number> = {};
    for (const q of hunter.quests) {
      next[q.id] = 0;
    }
    setDrafts(next);
  }, [hunter.hydrated, hunter.entered, hunter.today.dateKey, hunter.quests]);

  const projectedTasks = useMemo(() => {
    return hunter.quests.map((q) => {
      const home = hunter.today.logs[q.id]?.value ?? 0;
      const added = drafts[q.id] ?? 0;
      const value =
        q.kind === "yesno" ? (added >= 1 || home >= 1 ? 1 : 0) : home + added;
      return {
        name: q.name,
        kind: q.kind,
        unit: q.unit,
        value,
        cleared: q.kind === "yesno" ? value >= 1 : value >= q.target,
      };
    });
  }, [hunter.quests, hunter.today.logs, drafts]);

  const rawSp = scoreTasksUncapped(projectedTasks);
  const cappedSp = scoreDayCapped(projectedTasks);

  if (!hunter.hydrated || !hunter.entered) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-lilac-400">
        Syncing quests…
      </div>
    );
  }

  const dayLocked = Boolean(hunter.today.submitted) && !DEMO_TESTING;

  function setDraft(questId: string, value: number) {
    setDrafts((d) => ({ ...d, [questId]: Math.max(0, value) }));
  }

  function handleSaveProgress() {
    if (hunter.today.submitted && !DEMO_TESTING) {
      setToast("Day already submitted — progress is locked.");
      return;
    }
    for (const q of hunter.quests) {
      const added = drafts[q.id] ?? 0;
      if (q.kind === "yesno") {
        if (added >= 1) hunter.markYesNo(q.id, true);
      } else if (added > 0) {
        const current = hunter.today.logs[q.id]?.value ?? 0;
        hunter.setLogValue(q.id, current + added);
      }
    }
    const cleared: Record<string, number> = {};
    for (const q of hunter.quests) {
      cleared[q.id] = 0;
    }
    setDrafts(cleared);
    setToast(null);
    router.push("/status");
  }

  return (
    <section className="mx-auto w-full max-w-lg px-4 pb-8 pt-2 sm:px-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lilac-400">Daily Log</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink-900">Enter today&apos;s work</h1>
      <p className="mt-2 text-base font-semibold text-ink-700/55">
        Gym hunters: log core lifts as <span className="text-lilac-600">working sets</span> (e.g. 3).
        You can still log sit-ups, run, and steps — they count. Accessories stay in your diary for 0
        Rank SP. You do <span className="text-lilac-600">not</span> need to log the whole workout.
      </p>

      <div className="soft-card mt-5 rounded-[1.35rem] px-4 py-3">
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-lilac-400">
              Today&apos;s Rank SP
            </p>
            <p className="mt-1 font-display text-2xl font-semibold text-ink-900">
              {cappedSp}
              <span className="text-base text-ink-700/40"> / {DAILY_SP_CAP}</span>
            </p>
          </div>
          <p className="text-[11px] font-semibold text-ink-700/45">
            {rawSp > DAILY_SP_CAP
              ? `Raw ${rawSp} · capped`
              : "10 SP / 10 push-ups"}
          </p>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-lilac-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#f6d860] to-lilac-500 transition-[width]"
            style={{
              width: `${Math.min(100, Math.round((cappedSp / DAILY_SP_CAP) * 100))}%`,
            }}
          />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-lilac-400">
          Today&apos;s tasks
          {hunter.quests.length > 0 ? (
            <span className="ml-1 font-semibold normal-case tracking-normal text-ink-700/40">
              ({hunter.quests.length})
            </span>
          ) : null}
        </p>
        <Link
          href="/board"
          className="shrink-0 rounded-full bg-lilac-500 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-pill transition hover:bg-lilac-600"
        >
          Add from library
        </Link>
      </div>

      {hunter.quests.length === 0 ? (
        <div className="soft-card mt-3 rounded-[1.5rem] p-6 text-center">
          <p className="text-ink-700/60">No quests in your pack yet.</p>
          <Link href="/board" className="mt-3 inline-block font-bold text-lilac-500 hover:underline">
            Open Quest Board · System library
          </Link>
        </div>
      ) : (
        <div
          className={`mt-3 ${
            hunter.quests.length > 5
              ? "max-h-[min(28rem,52dvh)] overflow-y-auto overscroll-contain rounded-[1.35rem] pr-1"
              : ""
          }`}
        >
          <ul className="space-y-3">
            {hunter.quests.map((quest) => {
              const value = drafts[quest.id] ?? 0;
              const homeValue = hunter.today.logs[quest.id]?.value ?? 0;
              const cleared =
                quest.kind === "yesno" ? value >= 1 : value >= quest.target;
              return (
                <QuestRow
                  key={quest.id}
                  quest={quest}
                  value={value}
                  homeValue={homeValue}
                  cleared={cleared}
                  onChange={(v) => setDraft(quest.id, v)}
                  onYesNo={(done) => setDraft(quest.id, done ? 1 : 0)}
                />
              );
            })}
          </ul>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3">
        <button
          type="button"
          onClick={handleSaveProgress}
          disabled={hunter.quests.length === 0 || dayLocked}
          className="min-h-12 rounded-2xl bg-lilac-500 font-bold uppercase tracking-[0.16em] text-white shadow-pill transition hover:bg-lilac-600 disabled:opacity-40"
        >
          Save progress to goals
        </button>
        <Link
          href="/status"
          className="flex min-h-12 items-center justify-center rounded-2xl bg-white/80 font-bold text-lilac-500 ring-1 ring-lilac-200"
        >
          Back to Home
        </Link>
      </div>

      {toast && (
        <p className="mt-4 text-center text-sm font-bold text-lilac-600" role="status">
          {toast}
        </p>
      )}
    </section>
  );
}
