"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/status", label: "Home" },
  { href: "/daily", label: "Log" },
  { href: "/army", label: "Army" },
  { href: "/board", label: "Goals" },
];

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const showNav = pathname !== "/" && !isAdmin;

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="atmosphere relative min-h-[100dvh]">
      {showNav && (
        <header className="relative z-10 mx-auto flex w-full max-w-lg items-center justify-between px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))] sm:px-5">
          <Link
            href="/status"
            className="font-display text-base font-semibold tracking-wide text-lilac-600 transition hover:text-lilac-700 sm:text-lg"
          >
            Solo Leveling
          </Link>
          {/* Desktop / tablet top nav */}
          <nav className="hidden gap-1 sm:flex">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition ${
                    active
                      ? "bg-lilac-500 text-white shadow-pill"
                      : "text-ink-700/55 hover:bg-white/70 hover:text-ink-800"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>
      )}

      <main className={`relative z-10 ${showNav ? "pb-24 sm:pb-8" : ""}`}>{children}</main>

      {/* Mobile bottom tabs */}
      {showNav && (
        <nav
          className="fixed inset-x-0 bottom-0 z-40 border-t border-lilac-100/80 bg-white/90 px-3 pt-2 backdrop-blur-md sm:hidden"
          style={{ paddingBottom: "max(0.65rem, env(safe-area-inset-bottom))" }}
        >
          <div className="mx-auto flex max-w-lg items-center justify-around">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex min-h-11 min-w-[3.75rem] flex-col items-center justify-center rounded-xl px-2 text-[10px] font-bold uppercase tracking-wide transition sm:min-w-[4.5rem] sm:px-3 sm:text-[11px] ${
                    active ? "bg-lilac-500 text-white shadow-pill" : "text-ink-700/50"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
