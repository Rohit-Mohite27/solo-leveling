"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import {
  AdminApiError,
  deleteAdminHunter,
  fetchAdminHunter,
  fetchAdminHunterDay,
  resetAdminHunter,
  resetAdminHunterDates,
  saveAdminHunterDay,
  type AdminHunterDay,
  type AdminHunterDetail,
} from "@/lib/admin-api";

type EditTask = {
  questId: number;
  name: string;
  kind: string | null;
  unit: string | null;
  target: string | null;
  value: string;
  cleared: boolean;
  active: boolean;
};

function DayDetailModal({
  open,
  hunterName,
  day,
  loading,
  busy,
  onClose,
  onResetDay,
  onSaveSubmit,
}: {
  open: boolean;
  hunterName: string;
  day: AdminHunterDay | null;
  loading: boolean;
  busy: boolean;
  onClose: () => void;
  onResetDay: () => void;
  onSaveSubmit: (tasks: EditTask[]) => void;
}) {
  const [edits, setEdits] = useState<EditTask[]>([]);

  useEffect(() => {
    if (!day) {
      setEdits([]);
      return;
    }
    setEdits(
      day.tasks.map((t) => ({
        questId: t.questId,
        name: t.name,
        kind: t.kind,
        unit: t.unit,
        target: t.target,
        value: t.value,
        cleared: t.cleared,
        active: t.active,
      })),
    );
  }, [day]);

  if (!open) return null;

  function setTask(questId: number, patch: Partial<EditTask>) {
    setEdits((prev) => prev.map((t) => (t.questId === questId ? { ...t, ...patch } : t)));
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#1e1a3a]/65 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="day-detail-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85dvh] w-full max-w-sm flex-col overflow-hidden rounded-[1.5rem] bg-white shadow-soft animate-level-rise"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-y-auto p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-lilac-400">
            Enter / edit day · {hunterName}
          </p>
          <h2
            id="day-detail-title"
            className="mt-2 font-display text-2xl font-semibold text-ink-900"
          >
            {day?.dateKey ?? "…"}
          </h2>
          {day && (
            <p className="mt-1 text-sm font-semibold text-ink-700/50">
              {day.status}
              {day.submitted ? " · submitted" : " · not submitted"}
            </p>
          )}
          <p className="mt-2 text-xs font-semibold text-ink-700/45">
            Use this when a hunter missed midnight. Fill their tasks, then save &amp; submit so
            streak and XP rebuild.
          </p>

          {loading && <p className="mt-6 text-sm font-semibold text-lilac-400">Loading records…</p>}

          {!loading && edits.length === 0 && (
            <p className="mt-6 text-sm font-semibold text-ink-700/45">
              No active quests on this hunter.
            </p>
          )}

          {!loading && edits.length > 0 && (
            <ul className="mt-5 space-y-3">
              {edits.map((t) => (
                <li
                  key={`${day?.dateKey}-${t.questId}`}
                  className="rounded-xl bg-lilac-50/80 px-3 py-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-display text-base text-ink-900">
                        {t.name}
                        {!t.active ? (
                          <span className="ml-2 text-[10px] font-bold uppercase text-ink-700/35">
                            removed
                          </span>
                        ) : null}
                      </p>
                      {t.kind !== "yesno" && t.target ? (
                        <p className="text-[10px] font-semibold text-ink-700/40">
                          Goal {t.target}
                          {t.unit ? ` ${t.unit}` : ""}
                        </p>
                      ) : null}
                    </div>
                    <label className="flex shrink-0 items-center gap-1.5 text-xs font-bold text-lilac-600">
                      <input
                        type="checkbox"
                        checked={t.cleared}
                        disabled={busy}
                        onChange={(e) => {
                          const cleared = e.target.checked;
                          if (t.kind === "yesno") {
                            setTask(t.questId, { cleared, value: cleared ? "1" : "0" });
                          } else {
                            setTask(t.questId, { cleared });
                          }
                        }}
                        className="accent-lilac-500"
                      />
                      Cleared
                    </label>
                  </div>
                  {t.kind === "yesno" ? (
                    <p className="mt-2 text-sm font-bold text-ink-800">
                      {t.cleared ? "Held" : "Not held"}
                    </p>
                  ) : (
                    <input
                      type="number"
                      min={0}
                      step="any"
                      disabled={busy}
                      value={t.value}
                      onChange={(e) => {
                        const value = e.target.value;
                        const num = Number(value);
                        const target = Number(t.target ?? 0);
                        const cleared =
                          t.kind === "steps"
                            ? t.cleared
                            : Number.isFinite(num) && target > 0
                              ? num >= target
                              : t.cleared;
                        setTask(t.questId, { value, cleared });
                      }}
                      className="mt-2 min-h-10 w-full rounded-xl border border-lilac-200 bg-white px-3 text-sm font-semibold text-ink-900 outline-none focus:border-lilac-400"
                    />
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              disabled={busy || loading || edits.length === 0}
              onClick={() => onSaveSubmit(edits)}
              className="min-h-11 w-full rounded-2xl bg-lilac-500 text-sm font-bold uppercase tracking-[0.14em] text-white shadow-pill transition hover:bg-lilac-600 disabled:opacity-40"
            >
              {busy ? "Saving…" : "Save & submit report"}
            </button>
            <button
              type="button"
              disabled={busy || loading || !day}
              onClick={onResetDay}
              className="min-h-11 w-full rounded-2xl bg-system-danger/10 text-sm font-bold uppercase tracking-wide text-system-danger ring-1 ring-system-danger/30 transition hover:bg-system-danger/15 disabled:opacity-40"
            >
              {busy ? "Forgetting…" : "Forget this day (log + XP + streak)"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 w-full rounded-2xl bg-white text-sm font-bold uppercase tracking-[0.14em] text-lilac-600 ring-1 ring-lilac-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminHunterDetailPage() {
  const ready = useAdminGuard();
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [data, setData] = useState<AdminHunterDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Record<string, boolean>>({});
  const [extraDate, setExtraDate] = useState("");
  const [clearingDates, setClearingDates] = useState(false);

  const [dayOpen, setDayOpen] = useState(false);
  const [dayLoading, setDayLoading] = useState(false);
  const [dayBusy, setDayBusy] = useState(false);
  const [dayDetail, setDayDetail] = useState<AdminHunterDay | null>(null);

  const load = useCallback(async () => {
    if (!Number.isFinite(id)) {
      setError("Invalid hunter id");
      return;
    }
    try {
      const detail = await fetchAdminHunter(id);
      setData(detail);
      setError(null);
      setSelectedDates({});
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Failed to load hunter");
    }
  }, [id]);

  useEffect(() => {
    if (!ready) return;
    void load();
  }, [ready, load]);

  async function openDay(dateKey: string) {
    setDayOpen(true);
    setDayLoading(true);
    setDayDetail(null);
    setError(null);
    try {
      const day = await fetchAdminHunterDay(id, dateKey);
      setDayDetail(day);
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Failed to load day");
      setDayOpen(false);
    } finally {
      setDayLoading(false);
    }
  }

  async function handleSaveSubmit(tasks: EditTask[]) {
    if (!dayDetail || !data) return;
    const ok = window.confirm(
      `Save & submit ${data.hunter.name}'s report for ${dayDetail.dateKey}?\n\nThis writes the day to the live DB and rebuilds level, XP, and streak.`,
    );
    if (!ok) return;
    setDayBusy(true);
    setError(null);
    try {
      const next = await saveAdminHunterDay(id, dayDetail.dateKey, {
        submit: true,
        tasks: tasks.map((t) => ({
          questId: t.questId,
          value: Number(t.value) || 0,
          cleared: t.cleared,
        })),
      });
      setData(next);
      setDayDetail(next.day);
      if (next.rebuilt) {
        const { previous: prev, level, xp, streak } = next.rebuilt;
        window.alert(
          `Submitted ${dayDetail.dateKey}.\n\nLevel ${prev.level}→${level}\nXP ${prev.xp}→${xp}\nStreak ${prev.streak}→${streak}`,
        );
      } else {
        window.alert(`Saved ${dayDetail.dateKey}.`);
      }
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Save day failed");
    } finally {
      setDayBusy(false);
    }
  }

  async function handleResetOpenedDay() {
    if (!dayDetail || !data) return;
    const ok = window.confirm(
      `Forget ${data.hunter.name}'s ${dayDetail.dateKey}?\n\nDeletes that day’s log and rebuilds level, XP, and streak as if that day never happened.`,
    );
    if (!ok) return;
    setDayBusy(true);
    try {
      const next = await resetAdminHunterDates(id, [dayDetail.dateKey]);
      setData(next);
      setDayOpen(false);
      setDayDetail(null);
      setSelectedDates((prev) => {
        const copy = { ...prev };
        delete copy[dayDetail.dateKey];
        return copy;
      });
      if (next.rebuilt) {
        const { previous: prev, level, xp, streak } = next.rebuilt;
        window.alert(
          `Forgot ${dayDetail.dateKey}.\n\nLevel ${prev.level}→${level}\nXP ${prev.xp}→${xp}\nStreak ${prev.streak}→${streak}`,
        );
      }
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Reset day failed");
    } finally {
      setDayBusy(false);
    }
  }

  async function handleReset() {
    if (!data) return;
    const ok = window.confirm(
      `Reset ${data.hunter.name}? This clears XP, streak, logs, and restores starter quests.`,
    );
    if (!ok) return;
    setBusy(true);
    try {
      const next = await resetAdminHunter(id);
      setData(next);
      setSelectedDates({});
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Reset failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    if (!data) return;
    const ok = window.confirm(
      `Remove ${data.hunter.name} permanently?\n\nThis deletes their account, quests, and daily logs. This cannot be undone.`,
    );
    if (!ok) return;
    const typed = window.prompt(`Type REMOVE to confirm deleting ${data.hunter.name}:`);
    if (typed?.trim().toUpperCase() !== "REMOVE") {
      setError("Removal cancelled — type REMOVE to confirm.");
      return;
    }
    setRemoving(true);
    setError(null);
    try {
      await deleteAdminHunter(id);
      router.replace("/admin/hunters");
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Remove failed");
      setRemoving(false);
    }
  }

  function toggleDate(dateKey: string) {
    setSelectedDates((prev) => ({ ...prev, [dateKey]: !prev[dateKey] }));
  }

  function openExtraDate() {
    const key = extraDate.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) {
      setError("Use YYYY-MM-DD for the missed day.");
      return;
    }
    setError(null);
    void openDay(key);
  }

  async function handleClearDates() {
    if (!data) return;
    const keys = Object.entries(selectedDates)
      .filter(([, on]) => on)
      .map(([k]) => k);
    if (keys.length === 0) {
      setError("Select at least one date to clear.");
      return;
    }
    const ok = window.confirm(
      `Forget these days for ${data.hunter.name}:\n${keys.join(", ")}\n\nDeletes those logs and rebuilds level, XP, and streak as if those days never happened.`,
    );
    if (!ok) return;
    setClearingDates(true);
    setError(null);
    try {
      const next = await resetAdminHunterDates(id, keys);
      setData(next);
      setSelectedDates({});
      if (next.rebuilt) {
        const { previous: prev, level, xp, streak } = next.rebuilt;
        window.alert(
          `Forgot ${keys.join(", ")}.\n\nLevel ${prev.level}→${level}\nXP ${prev.xp}→${xp}\nStreak ${prev.streak}→${streak}`,
        );
      } else {
        window.alert(
          "Day log cleared, but streak/XP were not rebuilt. The API may be on an old deploy — redeploy the backend.",
        );
      }
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Clear dates failed");
    } finally {
      setClearingDates(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-lilac-400">Loading…</div>
    );
  }

  const selectedCount = Object.values(selectedDates).filter(Boolean).length;

  return (
    <AdminShell>
      <button
        type="button"
        onClick={() => router.push("/admin/hunters")}
        className="text-xs font-bold uppercase tracking-wide text-lilac-500"
      >
        ← Hunters
      </button>

      {error && (
        <p className="mt-3 text-sm font-semibold text-system-danger" role="alert">
          {error}
        </p>
      )}

      {!data ? (
        <p className="mt-6 text-lilac-400">Loading hunter…</p>
      ) : (
        <>
          <div className="soft-card mt-4 rounded-[1.5rem] p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-lilac-400">
              Hunter #{data.hunter.id}
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-ink-900">
              {data.hunter.name}
            </h2>
            <p className="mt-2 text-sm font-semibold text-ink-700/60">
              {data.hunter.phone ? `+91 ${data.hunter.phone}` : data.hunter.email || "No contact"}
            </p>
            <p className="mt-1 text-sm font-semibold text-ink-700/55">
              Level {data.hunter.level} · {data.hunter.xp} XP · {data.hunter.streak} day streak
            </p>
            <div className="mt-5 space-y-2">
              <button
                type="button"
                disabled={busy || removing || clearingDates}
                onClick={() => void handleReset()}
                className="min-h-11 w-full rounded-2xl bg-lilac-50 text-sm font-bold uppercase tracking-wide text-lilac-600 ring-1 ring-lilac-200 transition hover:bg-lilac-100 disabled:opacity-40"
              >
                {busy ? "Resetting…" : "Reset all hunter data"}
              </button>
              <button
                type="button"
                disabled={busy || removing || clearingDates}
                onClick={() => void handleRemove()}
                className="min-h-11 w-full rounded-2xl bg-system-danger/10 text-sm font-bold uppercase tracking-wide text-system-danger ring-1 ring-system-danger/30 transition hover:bg-system-danger/15 disabled:opacity-40"
              >
                {removing ? "Removing…" : "Remove hunter"}
              </button>
            </div>
          </div>

          <h3 className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-lilac-400">
            Quests
          </h3>
          <ul className="mt-3 space-y-2">
            {data.quests.map((q) => (
              <li
                key={q.id}
                className="soft-card rounded-[1.15rem] px-4 py-3 text-sm font-semibold text-ink-800"
              >
                {q.name}{" "}
                <span className="text-ink-700/45">
                  · {q.kind === "yesno" ? "yes/no" : `${q.target} ${q.unit}`}
                </span>
              </li>
            ))}
          </ul>

          <h3 className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-lilac-400">
            Missed day / recent days
          </h3>
          <p className="mt-1 text-xs font-semibold text-ink-700/45">
            Pick a date to enter a missed report (keeps streak alive). Or open a listed day to edit /
            submit. Clearing a day forgets it and rebuilds XP + streak.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <input
              type="date"
              value={extraDate}
              onChange={(e) => setExtraDate(e.target.value)}
              className="min-h-11 flex-1 rounded-xl border border-lilac-200 bg-white px-3 font-semibold text-ink-900 outline-none focus:border-lilac-400"
            />
            <button
              type="button"
              onClick={openExtraDate}
              className="min-h-11 rounded-xl bg-lilac-500 px-4 text-xs font-bold uppercase tracking-wide text-white shadow-pill"
            >
              Enter missed day
            </button>
          </div>

          <ul className="mt-3 space-y-2">
            {data.recentLogs.length === 0 && (
              <li className="text-sm font-semibold text-ink-700/45">No daily logs yet.</li>
            )}
            {data.recentLogs.map((l) => (
              <li
                key={l.id}
                className="soft-card flex items-center gap-3 rounded-[1.15rem] px-3 py-2.5"
              >
                <input
                  type="checkbox"
                  checked={Boolean(selectedDates[l.dateKey])}
                  onChange={() => toggleDate(l.dateKey)}
                  className="h-4 w-4 shrink-0 accent-lilac-500"
                  aria-label={`Select ${l.dateKey}`}
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  type="button"
                  onClick={() => void openDay(l.dateKey)}
                  className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
                >
                  <span className="font-semibold text-ink-900">{l.dateKey}</span>
                  <span className="text-xs font-semibold text-ink-700/50">
                    {l.status}
                    {l.submitted ? " · submitted" : ""}
                    <span className="ml-2 text-lilac-500">Edit</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {selectedCount > 0 && (
            <p className="mt-2 text-xs font-semibold text-lilac-500">
              Selected:{" "}
              {Object.entries(selectedDates)
                .filter(([, on]) => on)
                .map(([k]) => k)
                .join(", ")}
            </p>
          )}

          <button
            type="button"
            disabled={clearingDates || selectedCount === 0 || busy || removing}
            onClick={() => void handleClearDates()}
            className="mt-3 min-h-11 w-full rounded-2xl bg-orange-500/10 text-sm font-bold uppercase tracking-wide text-orange-700 ring-1 ring-orange-400/35 transition hover:bg-orange-500/15 disabled:opacity-40"
          >
            {clearingDates
              ? "Clearing…"
              : `Clear ${selectedCount || ""} selected date${selectedCount === 1 ? "" : "s"}`.trim()}
          </button>

          <p className="mt-6 text-center text-xs font-semibold text-ink-700/40">
            <Link href="/admin/dashboard" className="text-lilac-500 hover:underline">
              Back to overview
            </Link>
          </p>
        </>
      )}

      <DayDetailModal
        open={dayOpen}
        hunterName={data?.hunter.name ?? "Hunter"}
        day={dayDetail}
        loading={dayLoading}
        busy={dayBusy}
        onClose={() => {
          setDayOpen(false);
          setDayDetail(null);
        }}
        onResetDay={() => void handleResetOpenedDay()}
        onSaveSubmit={(tasks) => void handleSaveSubmit(tasks)}
      />
    </AdminShell>
  );
}
