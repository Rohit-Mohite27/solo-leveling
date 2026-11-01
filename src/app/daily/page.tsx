"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useHunter } from "@/lib/hunter-store";
import type { Quest } from "@/lib/demo-data";

function QuestRow({
  quest,
  value,
  cleared,
  onChange,
  onYesNo,
}: {
  quest: Quest;
  value: number;
  cleared: boolean;
  onChange: (v: number) => void;
  onYesNo: (done: boolean) => void;
}) {
  return (
    <li className="soft-card rounded-[1.35rem] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg text-ink-900">{quest.name}</p>
          <p className="mt-0.5 text-sm font-semibold text-ink-700/45">
            Target: {quest.kind === "yesno" ? "Done" : `${quest.target} ${quest.unit}`}
          </p>
        </div>
        {cleared && (
          <span className="animate-stamp-in rounded-full bg-system-clear/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-system-clear">
            Clear
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
              placeholder="0"
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

  useEffect(() => {
    if (hunter.hydrated && !hunter.entered) {
      router.replace("/");
    }
  }, [hunter.hydrated, hunter.entered, router]);

  if (!hunter.hydrated || !hunter.entered) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-lilac-400">
        Syncing quests…
      </div>
    );
  }

  function handleSubmit() {
    const wasAllClear = hunter.allCleared;
    hunter.submitDay();
    setToast(
      wasAllClear
        ? "Quest Complete — XP awarded. Streak updated."
        : "Logged. Partial / incomplete days break the streak.",
    );
  }

  return (
    <section className="mx-auto w-full max-w-lg px-4 pb-8 pt-2 sm:px-5">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-lilac-400">Daily Quest</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink-900">Today&apos;s objectives</h1>
      <p className="mt-2 text-base font-semibold text-ink-700/55">
        Or just tap Done on Home — this page is for exact numbers.
      </p>

      <ul className="mt-8 space-y-3">
        {hunter.quests.map((quest) => {
          const log = hunter.today.logs[quest.id];
          return (
            <QuestRow
              key={quest.id}
              quest={quest}
              value={log?.value ?? 0}
              cleared={log?.cleared ?? false}
              onChange={(v) => hunter.setLogValue(quest.id, v)}
              onYesNo={(done) => hunter.markYesNo(quest.id, done)}
            />
          );
        })}
      </ul>

      {hunter.quests.length === 0 && (
        <div className="soft-card mt-8 rounded-[1.5rem] p-6 text-center">
          <p className="text-ink-700/60">No quests in your pack yet.</p>
          <Link href="/board" className="mt-3 inline-block font-bold text-lilac-500 hover:underline">
            Open Quest Board
          </Link>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={hunter.quests.length === 0}
          className="min-h-12 rounded-2xl bg-lilac-500 font-bold uppercase tracking-[0.16em] text-white shadow-pill transition hover:bg-lilac-600 disabled:opacity-40"
        >
          Submit day to System
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
