"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { AdminApiError, fetchAdminHealth, type AdminHealth } from "@/lib/admin-api";

export default function AdminHealthPage() {
  const ready = useAdminGuard();
  const [data, setData] = useState<AdminHealth | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    fetchAdminHealth()
      .then((health) => {
        if (!cancelled) setData(health);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof AdminApiError ? err.message : "Health check failed");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [ready]);

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-lilac-400">Loading…</div>
    );
  }

  const dbUp = data?.database === "up";

  return (
    <AdminShell>
      <p className="text-sm font-semibold text-ink-700/55">
        Live check against the API and TiDB / MySQL.
      </p>

      {error && (
        <p className="mt-4 text-sm font-semibold text-system-danger" role="alert">
          {error}
        </p>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="soft-card rounded-[1.35rem] p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-lilac-400">API</p>
          <p className="mt-2 font-display text-2xl font-semibold text-ink-900">
            {data ? "Up" : "…"}
          </p>
          <p className="mt-1 text-sm font-semibold text-ink-700/50">{data?.service ?? "—"}</p>
        </div>
        <div className="soft-card rounded-[1.35rem] p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-lilac-400">
            Database
          </p>
          <p
            className={`mt-2 font-display text-2xl font-semibold ${
              dbUp ? "text-system-clear" : data ? "text-system-danger" : "text-ink-900"
            }`}
          >
            {data ? (dbUp ? "Up" : "Down") : "…"}
          </p>
          <p className="mt-1 text-sm font-semibold text-ink-700/50">{data?.message ?? "—"}</p>
        </div>
      </div>

      {data?.timestamp && (
        <p className="mt-4 text-xs font-semibold text-ink-700/40">
          Checked at {new Date(data.timestamp).toLocaleString()}
        </p>
      )}
    </AdminShell>
  );
}
