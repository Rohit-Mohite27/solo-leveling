"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import {
  AdminApiError,
  fetchAdminHunter,
  resetAdminHunter,
  type AdminHunterDetail,
} from "@/lib/admin-api";

export default function AdminHunterDetailPage() {
  const ready = useAdminGuard();
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [data, setData] = useState<AdminHunterDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(id)) {
      setError("Invalid hunter id");
      return;
    }
    try {
      const detail = await fetchAdminHunter(id);
      setData(detail);
      setError(null);
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Failed to load hunter");
    }
  }, [id]);

  useEffect(() => {
    if (!ready) return;
    void load();
  }, [ready, load]);

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
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Reset failed");
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-lilac-400">Loading…</div>
    );
  }

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
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleReset()}
              className="mt-5 min-h-11 w-full rounded-2xl bg-system-danger/10 text-sm font-bold uppercase tracking-wide text-system-danger ring-1 ring-system-danger/30 transition hover:bg-system-danger/15 disabled:opacity-40"
            >
              {busy ? "Resetting…" : "Reset hunter data"}
            </button>
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
            Recent days
          </h3>
          <ul className="mt-3 space-y-2">
            {data.recentLogs.length === 0 && (
              <li className="text-sm font-semibold text-ink-700/45">No daily logs yet.</li>
            )}
            {data.recentLogs.map((l) => (
              <li
                key={l.id}
                className="soft-card flex justify-between rounded-[1.15rem] px-4 py-3 text-sm font-semibold"
              >
                <span className="text-ink-900">{l.dateKey}</span>
                <span className="text-ink-700/50">
                  {l.status}
                  {l.submitted ? " · submitted" : ""}
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-6 text-center text-xs font-semibold text-ink-700/40">
            <Link href="/admin/dashboard" className="text-lilac-500 hover:underline">
              Back to overview
            </Link>
          </p>
        </>
      )}
    </AdminShell>
  );
}
