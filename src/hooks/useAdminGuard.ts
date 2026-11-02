"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminMe, getAdminToken } from "@/lib/admin-api";

/** Redirects to /admin if no valid admin session. */
export function useAdminGuard() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!getAdminToken()) {
        router.replace("/admin");
        return;
      }
      try {
        const me = await adminMe();
        if (!me.admin) {
          router.replace("/admin");
          return;
        }
        if (!cancelled) setReady(true);
      } catch {
        router.replace("/admin");
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return ready;
}
