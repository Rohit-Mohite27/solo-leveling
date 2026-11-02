"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { AdminApiError, fetchAdminOverview, type AdminOverview } from "@/lib/admin-api";

export default function AdminDashboardPage() {
  const ready = useAdminGuard();
  const [data, setData] = useState<AdminOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    fetchAdminOverview()
      .then((overview) => {
        if (!cancelled) setData(overview);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof AdminApiError ? err.message : "Failed to load overview");
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

  const cards = data
    ? [
        { label: "Total hunters", value: data.huntersTotal },
        { label: "Active today", value: data.activeToday },
        { label: "Active 7 days", value: data.active7d },
        { label: "Days submitted today", value: data.submitsToday },
        { label: "OTP challenges today", value: data.otpsToday },
      ]
    : [];

  return (
    <AdminShell>
      <p className="text-sm font-semibold text-ink-700/55">
        IST day {data?.todayKey ?? "…"}. Figures refresh when you open this page.
      </p>

      {error && (
        <p className="mt-4 text-sm font-semibold text-system-danger" role="alert">
          {error}
        </p>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="soft-card rounded-[1.25rem] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-lilac-400">
              {c.label}
            </p>
            <p className="mt-2 font-display text-3xl font-semibold text-ink-900">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/admin/hunters"
          className="rounded-2xl bg-lilac-500 px-4 py-3 text-xs font-bold uppercase tracking-wide text-white shadow-pill"
        >
          Manage hunters
        </Link>
        <Link
          href="/admin/health"
          className="rounded-2xl bg-white px-4 py-3 text-xs font-bold uppercase tracking-wide text-lilac-600 ring-1 ring-lilac-200"
        >
          System health
        </Link>
      </div>
    </AdminShell>
  );
}
