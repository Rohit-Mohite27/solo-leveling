"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GateRing } from "@/components/GateRing";
import { ApiError, requestOtp, verifyOtp } from "@/lib/api";
import { useHunter } from "@/lib/hunter-store";

type Step = "profile" | "otp";

export default function GatePage() {
  const { completeAuth, hydrated, apiReady, entered, authError } = useHunter();
  const router = useRouter();
  const [step, setStep] = useState<Step>("profile");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && entered) {
      router.replace("/status");
    }
  }, [hydrated, entered, router]);

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = name.trim();
    const digits = phone.replace(/\D/g, "").slice(-10);
    if (!trimmed) {
      setError("Enter your hunter name");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(digits)) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    setBusy(true);
    try {
      await requestOtp(digits);
      setPhone(digits);
      setStep("otp");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send OTP");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\d{4,8}$/.test(otp.trim())) {
      setError("Enter the OTP from SMS");
      return;
    }
    setBusy(true);
    try {
      const data = await verifyOtp({
        phone,
        otp: otp.trim(),
        name: name.trim(),
      });
      await completeAuth(data.hunter);
      router.push("/status");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "OTP verification failed");
    } finally {
      setBusy(false);
    }
  }

  const ready = hydrated && apiReady;

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pb-16 pt-10">
      <GateRing />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center text-center">
        <p
          className="mb-4 animate-fade-up text-[11px] font-bold uppercase tracking-[0.22em] text-lilac-400"
          style={{ animationDelay: "0.05s" }}
        >
          The System has awakened
        </p>

        <h1
          className="animate-fade-up font-display text-[clamp(2.6rem,10vw,4.2rem)] font-semibold leading-[1.05] text-ink-900"
          style={{ animationDelay: "0.15s" }}
        >
          Solo Leveling
        </h1>

        <p
          className="mt-4 max-w-sm animate-fade-up font-body text-lg font-semibold text-ink-700/65"
          style={{ animationDelay: "0.28s" }}
        >
          Your goals. Your streak. Rise against yourself.
        </p>

        {step === "profile" ? (
          <form
            onSubmit={handleRequestOtp}
            className="mt-10 flex w-full max-w-sm animate-fade-up flex-col gap-3"
            style={{ animationDelay: "0.4s" }}
          >
            <label className="sr-only" htmlFor="hunter-name">
              Hunter name
            </label>
            <input
              id="hunter-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name (e.g. Rohit)"
              className="soft-card w-full rounded-2xl border-0 px-4 py-3 text-center font-body text-base font-semibold text-ink-900 outline-none ring-1 ring-lilac-200 placeholder:text-ink-700/35 focus:ring-lilac-400"
              autoComplete="nickname"
              disabled={!ready || busy}
            />
            <label className="sr-only" htmlFor="hunter-phone">
              Mobile number
            </label>
            <div className="soft-card flex w-full items-center gap-2 rounded-2xl px-3 py-2 ring-1 ring-lilac-200 focus-within:ring-lilac-400">
              <span className="shrink-0 pl-1 font-body text-base font-bold text-ink-700/70">
                +91
              </span>
              <input
                id="hunter-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="10-digit mobile"
                inputMode="numeric"
                className="w-full border-0 bg-transparent py-2 text-center font-body text-base font-semibold tracking-wider text-ink-900 outline-none placeholder:text-ink-700/35"
                autoComplete="tel-national"
                disabled={!ready || busy}
              />
            </div>
            <button
              type="submit"
              disabled={!ready || busy}
              className="min-h-12 rounded-2xl bg-lilac-500 font-body text-sm font-bold uppercase tracking-[0.2em] text-white shadow-pill transition hover:bg-lilac-600 disabled:opacity-40"
            >
              {busy ? "Sending…" : "Send OTP"}
            </button>
          </form>
        ) : (
          <form
            onSubmit={handleVerify}
            className="mt-10 flex w-full max-w-sm animate-fade-up flex-col gap-3"
            style={{ animationDelay: "0.4s" }}
          >
            <p className="font-body text-sm font-semibold text-ink-700/70">
              OTP sent to +91 {phone}
            </p>
            <label className="sr-only" htmlFor="hunter-otp">
              OTP
            </label>
            <input
              id="hunter-otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 8))}
              placeholder="Enter OTP"
              inputMode="numeric"
              className="soft-card w-full rounded-2xl border-0 px-4 py-3 text-center font-body text-base font-semibold tracking-[0.3em] text-ink-900 outline-none ring-1 ring-lilac-200 placeholder:text-ink-700/35 focus:ring-lilac-400"
              autoComplete="one-time-code"
              disabled={!ready || busy}
            />
            <button
              type="submit"
              disabled={!ready || busy}
              className="min-h-12 rounded-2xl bg-lilac-500 font-body text-sm font-bold uppercase tracking-[0.2em] text-white shadow-pill transition hover:bg-lilac-600 disabled:opacity-40"
            >
              {busy ? "Verifying…" : "Enter the Gate"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setStep("profile");
                setOtp("");
                setError(null);
              }}
              className="font-body text-xs font-bold uppercase tracking-[0.16em] text-ink-700/50"
            >
              Change number
            </button>
          </form>
        )}

        {(error || authError) && (
          <p className="mt-4 font-body text-sm font-semibold text-rose-600">
            {error || authError}
          </p>
        )}
      </div>
    </section>
  );
}
