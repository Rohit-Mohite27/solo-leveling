"use client";

import { HunterProvider } from "@/lib/hunter-store";
import { LevelUpOverlay } from "./LevelUpOverlay";
import { StreakWarningOverlay } from "./StreakWarningOverlay";
import { AppChrome } from "./AppChrome";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HunterProvider>
      <AppChrome>{children}</AppChrome>
      <LevelUpOverlay />
      <StreakWarningOverlay />
    </HunterProvider>
  );
}
