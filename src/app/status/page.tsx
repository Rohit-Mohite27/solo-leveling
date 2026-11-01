"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArmyTeaser } from "@/components/ArmyTeaser";
import { DateStrip } from "@/components/DateStrip";
import { GoalCard } from "@/components/GoalCard";
import { StepsGoalCard } from "@/components/StepsGoalCard";
import { HunterMascot } from "@/components/HunterMascot";
import { forceMidnightWarning } from "@/components/StreakWarningOverlay";
import { DEMO_TESTING, coreQuests, isStepsQuest } from "@/lib/demo-data";
import { useHunter } from "@/lib/hunter-store";

export default function StatusPage() {
  const hunter = useHunter();
  const router = useRouter();

  useEffect(() => {
    if (hunter.hydrated && !hunter.entered) {
      router.replace("/");
    }
  }, [hunter.hydrated, hunter.entered, router]);

  if (!hunter.hydrated || !hunter.entered) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center font-body text-lilac-400">
        Opening the Gate…
      </div>
    );
  }

  const core = coreQuests(hunter.quests);
  const selectedDone = core.filter((q) => hunter.selectedClears[q.id]).length;
  const selectedPct =
    core.length === 0 ? 0 : Math.round((selectedDone / core.length) * 100);
  const canEdit = hunter.isTodaySelected && (DEMO_TESTING || !hunter.today.submitted);

  return (
    <section className="mx-auto w-full max-w-lg px-4 pb-8 pt-2 sm:px-5">
      <DateStrip selectedDate={hunter.selectedDate} onSelect={hunter.selectDate} />

      <div className="mt-6 animate-fade-up text-center">
        <HunterMascot />
        <h1 className="mt-2 font-display text-3xl font-semibold text-ink-900">
          {hunter.allCleared && hunter.isTodaySelected ? "Slaying" : "Rising"}
          <span className="text-lilac-500">({selectedPct}%)</span>
        </h1>
        <p className="mt-1 font-body text-sm font-semibold text-ink-700/55">
          {hunter.name || "Sung Jinwoo"} · Level {hunter.level} · {hunter.streak} day streak
        </p>
      </div>

      <ArmyTeaser level={hunter.level} />

      <div
        className="soft-card mt-5 animate-fade-up rounded-[1.5rem] px-4 py-3"
        style={{ animationDelay: "0.08s" }}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-body text-sm font-bold text-ink-900">
              {selectedDone}/{core.length} quests clear
            </p>
            <p className="mt-0.5 text-xs font-semibold text-ink-700/45">
              {hunter.isTodaySelected
                ? DEMO_TESTING
                  ? "Testing mode — day never locks"
                  : hunter.today.submitted
                    ? "Day submitted to the System"
                    : "Tap a goal to mark done"
                : "Past day — view only"}
            </p>
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={() => hunter.submitDay()}
              disabled={hunter.quests.length === 0}
              className="rounded-full bg-lilac-500 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white shadow-pill transition hover:bg-lilac-600 disabled:opacity-40"
            >
              Submit day
            </button>
          )}
        </div>
      </div>

      {DEMO_TESTING && (
        <div className="soft-card mt-4 rounded-[1.25rem] px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-lilac-400">
            Testing tools
          </p>
          <p className="mt-1 text-xs font-semibold text-ink-700/50">
            Preview ally greetings for day/level 2 → 3 → 4… without getting stuck.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => hunter.previewNextUnlock()}
              className="rounded-full bg-lilac-500 px-3 py-1.5 text-xs font-bold text-white shadow-pill"
            >
              Next unlock (Lv {hunter.level + 1}
              {hunter.allyNext ? ` · ${hunter.allyNext.name}` : ""})
            </button>
            <button
              type="button"
              onClick={() => hunter.resetDemo()}
              className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-lilac-600 ring-1 ring-lilac-200"
            >
              Reset all demo data
            </button>
            <button
              type="button"
              onClick={() => forceMidnightWarning()}
              className="rounded-full bg-system-danger/10 px-3 py-1.5 text-xs font-bold text-system-danger ring-1 ring-system-danger/25"
            >
              Test midnight warning
            </button>
          </div>
        </div>
      )}

      <div
        className="mt-6 grid grid-cols-2 gap-3 animate-fade-up"
        style={{ animationDelay: "0.14s" }}
      >
        {hunter.quests.map((quest) =>
          isStepsQuest(quest) ? (
            <StepsGoalCard
              key={quest.id}
              quest={quest}
              value={
                hunter.isTodaySelected
                  ? hunter.today.logs[quest.id]?.value ?? 0
                  : hunter.selectedClears[quest.id]
                    ? quest.target
                    : 0
              }
              locked={!canEdit}
              onUpdateSteps={(v) => hunter.setLogValue(quest.id, v)}
              onUpdateTarget={(t) => hunter.updateQuestTarget(quest.id, t)}
            />
          ) : (
            <GoalCard
              key={quest.id}
              quest={quest}
              done={Boolean(hunter.selectedClears[quest.id])}
              locked={!canEdit}
              onToggle={() => hunter.toggleQuestDone(quest.id)}
            />
          ),
        )}
      </div>

      {hunter.quests.length === 0 && (
        <div className="soft-card mt-6 rounded-[1.5rem] p-6 text-center">
          <p className="font-body text-ink-700/70">No goals yet.</p>
          <Link
            href="/board"
            className="mt-2 inline-block font-bold text-lilac-500 underline-offset-4 hover:underline"
          >
            Add goals on Quest Board
          </Link>
        </div>
      )}

      <div className="mt-6 flex justify-center gap-4 text-sm font-bold text-lilac-500">
        <Link href="/board" className="hover:text-lilac-600">
          Edit goals
        </Link>
        <span className="text-lilac-200">·</span>
        <Link href="/daily" className="hover:text-lilac-600">
          Detailed log
        </Link>
        <span className="text-lilac-200">·</span>
        <button
          type="button"
          className="hover:text-lilac-600"
          onClick={() => {
            hunter.leaveGate();
            router.replace("/");
          }}
        >
          Sign out
        </button>
      </div>
    </section>
  );
}
