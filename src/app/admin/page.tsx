"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AdminApiError, adminLogin, adminMe, getAdminToken } from "@/lib/admin-api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!getAdminToken()) {
        if (!cancelled) setChecking(false);
        return;
      }
      try {
        const me = await adminMe();
        if (!cancelled && me.admin) {
          router.replace("/admin/dashboard");
          return;
        }
      } catch {
        // stay on login
      }
      if (!cancelled) setChecking(false);
    }
    void check();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await adminLogin(password);
      router.replace("/admin/dashboard");
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-lilac-400">
        Checking session…
      </div>
    );
  }

  return (
    <section className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col justify-center px-4 py-10">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-lilac-400">
        Solo Leveling
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink-900">Admin login</h1>
      <p className="mt-2 text-sm font-semibold text-ink-700/55">
        Password-only console for hunters, activity, and health.
      </p>

      <form onSubmit={(e) => void handleSubmit(e)} className="soft-card mt-8 space-y-4 rounded-[1.5rem] p-5">
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-ink-700/40">
            Password
          </span>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-lilac-200 bg-white px-3 py-2.5 pr-12 font-semibold text-ink-900 outline-none focus:border-lilac-400"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-lilac-500 transition hover:text-lilac-700"
              aria-label={showPassword ? "Hide password" : "Show password"}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </label>
        {error && (
          <p className="text-sm font-semibold text-system-danger" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="min-h-11 w-full rounded-2xl bg-lilac-500 font-bold uppercase tracking-[0.16em] text-white shadow-pill transition hover:bg-lilac-600 disabled:opacity-40"
        >
          {busy ? "Signing in…" : "Enter console"}
        </button>
      </form>
    </section>
  );
}

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 3l18 18M10.5 10.7a3 3 0 004.2 4.2M9.9 5.6A10.5 10.5 0 0112 5c6.5 0 10 7 10 7a18.4 18.4 0 01-3.2 3.8M6.1 6.3A18.5 18.5 0 002 12s3.5 7 10 7c1.4 0 2.7-.3 3.9-.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
