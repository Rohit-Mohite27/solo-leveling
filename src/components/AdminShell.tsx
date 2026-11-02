"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { adminLogout } from "@/lib/admin-api";

const NAV = [
  { href: "/admin/dashboard", label: "Overview" },
  { href: "/admin/hunters", label: "Hunters" },
  { href: "/admin/health", label: "Health" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await adminLogout().catch(() => undefined);
    router.replace("/admin");
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-lilac-400">
            System console
          </p>
          <h1 className="font-display text-2xl font-semibold text-ink-900">Admin</h1>
        </div>
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-lilac-600 ring-1 ring-lilac-200 transition hover:bg-white"
        >
          Sign out
        </button>
      </header>

      <nav className="mt-5 flex flex-wrap gap-2">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition ${
                active
                  ? "bg-lilac-500 text-white shadow-pill"
                  : "bg-white/80 text-ink-700/60 ring-1 ring-lilac-100 hover:text-ink-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6">{children}</div>
    </div>
  );
}
