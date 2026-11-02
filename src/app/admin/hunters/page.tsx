"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import {
  AdminApiError,
  fetchAdminHunters,
  type AdminHunterRow,
} from "@/lib/admin-api";

export default function AdminHuntersPage() {
  const ready = useAdminGuard();
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<AdminHunterRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      fetchAdminHunters(q)
        .then((list) => {
          if (!cancelled) setRows(list);
        })
        .catch((err) => {
          if (!cancelled) {
            setError(err instanceof AdminApiError ? err.message : "Failed to load hunters");
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [ready, q]);

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-lilac-400">Loading…</div>
    );
  }

  return (
    <AdminShell>
      <label className="block">
        <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-ink-700/40">
          Search
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Name or phone"
          className="w-full rounded-xl border border-lilac-200 bg-white px-3 py-2.5 font-semibold text-ink-900 outline-none focus:border-lilac-400"
        />
      </label>

      {error && (
        <p className="mt-3 text-sm font-semibold text-system-danger" role="alert">
          {error}
        </p>
      )}

      <p className="mt-3 text-xs font-semibold text-ink-700/45">
        {loading ? "Loading…" : `${rows.length} hunter${rows.length === 1 ? "" : "s"}`}
      </p>

      <ul className="mt-4 space-y-2">
        {rows.map((h) => (
          <li key={h.id}>
            <Link
              href={`/admin/hunters/${h.id}`}
              className="soft-card flex items-center justify-between gap-3 rounded-[1.25rem] px-4 py-3 transition hover:-translate-y-0.5 hover:shadow-soft"
            >
              <div>
                <p className="font-display text-base text-ink-900">{h.name}</p>
                <p className="text-sm font-semibold text-ink-700/45">
                  {h.phone ? `+91 ${h.phone}` : h.email || "No contact"} · Lv {h.level} ·{" "}
                  {h.streak} streak
                </p>
              </div>
              <span className="text-xs font-bold uppercase tracking-wide text-lilac-500">View</span>
            </Link>
          </li>
        ))}
      </ul>
    </AdminShell>
  );
}
