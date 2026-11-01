"use client";

import { useEffect, useRef } from "react";
import { formatDayLabel, shiftDateKey, todayKey } from "@/lib/demo-data";

type Props = {
  selectedDate: string;
  onSelect: (dateKey: string) => void;
  /** How many past days + today to show */
  span?: number;
};

export function DateStrip({ selectedDate, onSelect, span = 7 }: Props) {
  const today = todayKey();
  // Today first (featured), then yesterday → older. Recent date leads the strip.
  const keys = Array.from({ length: span }, (_, i) => shiftDateKey(today, -i));

  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset to the start so Today stays in view after remounts / day changes.
    scrollerRef.current?.scrollTo({ left: 0, behavior: "auto" });
  }, [today]);

  return (
    <div
      ref={scrollerRef}
      className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {keys.map((key) => {
        const { day, weekday } = formatDayLabel(key);
        const active = key === selectedDate;
        const isToday = key === today;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className={`flex min-w-[3.35rem] shrink-0 flex-col items-center rounded-[1.35rem] px-2.5 py-2.5 transition ${
              active
                ? "bg-lilac-500 text-white shadow-pill"
                : isToday
                  ? "bg-lilac-100 text-lilac-700 ring-1 ring-lilac-300"
                  : "bg-white/70 text-ink-700 hover:bg-white"
            }`}
          >
            <span
              className={`font-display text-lg font-semibold leading-none ${
                active ? "text-white" : "text-ink-800"
              }`}
            >
              {day}
            </span>
            <span
              className={`mt-1 text-[10px] font-bold uppercase tracking-wide ${
                active ? "text-white/80" : "text-lilac-400"
              }`}
            >
              {isToday ? "Today" : weekday}
            </span>
            <span
              className={`mt-2 h-2 w-2 rounded-full ${
                active ? "bg-white/90" : isToday ? "bg-lilac-500" : "bg-lilac-200"
              }`}
              aria-hidden
            />
          </button>
        );
      })}
    </div>
  );
}
