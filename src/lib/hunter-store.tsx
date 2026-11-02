"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ALLIES,
  DEMO_TESTING,
  STARTER_QUESTS,
  migrateStarterQuests,
  allyAscension,
  allyForLevel,
  ascensionXpBonus,
  coreQuests,
  isStepsQuest,
  nextAlly,
  todayKey,
  unlockedAllies,
  xpForLevel,
  type Ally,
  type DayRecord,
  type DayStatus,
  type Quest,
} from "./demo-data";
import {
  ApiError,
  createQuestApi,
  deleteQuestApi,
  fetchMe,
  fetchQuests,
  fetchRecentLogs,
  fetchToday,
  logoutApi,
  patchTodayItem,
  submitTodayApi,
  type ApiHunter,
  type ApiLogItem,
  type ApiQuest,
} from "./api";

export type QuestLog = {
  questId: string;
  value: number;
  cleared: boolean;
};

type DayState = {
  dateKey: string;
  logs: Record<string, QuestLog>;
  submitted: boolean;
};

type HunterState = {
  hunterId: number | null;
  name: string;
  level: number;
  xp: number;
  streak: number;
  quests: Quest[];
  today: DayState;
  history: DayRecord[];
  selectedDate: string;
  pendingAlly: Ally | null;
  entered: boolean;
};

type HunterContextValue = HunterState & {
  hydrated: boolean;
  apiReady: boolean;
  authError: string | null;
  enterGate: (name?: string) => void;
  /** Production: mark entered after OTP verify + load session pack */
  completeAuth: (hunter: ApiHunter) => Promise<void>;
  leaveGate: () => void;
  selectDate: (dateKey: string) => void;
  toggleQuestDone: (questId: string) => void;
  setLogValue: (questId: string, value: number) => void;
  markYesNo: (questId: string, done: boolean) => void;
  submitDay: () => Promise<{ leveled: boolean; newLevel: number; blocked?: boolean }>;
  dismissAlly: () => void;
  addQuest: (quest: Omit<Quest, "id">) => void;
  updateQuestTarget: (questId: string, target: number) => void;
  removeQuest: (questId: string) => void;
  /** Testing: wipe progress, keep name, unlock today again */
  resetDemo: () => void;
  /** Testing: jump to next level and show that ally greeting */
  previewNextUnlock: () => void;
  /** Testing / midnight warning: reset streak to 0 */
  breakStreakForTest: () => void;
  xpToNext: number;
  xpProgress: number;
  todayClearedCount: number;
  allCleared: boolean;
  clearPercent: number;
  alliesUnlocked: Ally[];
  allyNext: Ally | undefined;
  isTodaySelected: boolean;
  selectedClears: Record<string, boolean>;
};

const STORAGE_KEY = "solo-leveling-hunter-v11";

function emptyDay(quests: Quest[], dateKey = todayKey()): DayState {
  const logs: Record<string, QuestLog> = {};
  for (const q of quests) {
    logs[q.id] = { questId: q.id, value: 0, cleared: false };
  }
  return { dateKey, logs, submitted: false };
}

function isCleared(quest: Quest, value: number): boolean {
  if (quest.kind === "yesno") return value === 1;
  return value >= quest.target;
}

function dayStatusFromClears(quests: Quest[], clears: Record<string, boolean>): DayStatus {
  const core = coreQuests(quests);
  if (core.length === 0) return "empty";
  const cleared = core.filter((q) => clears[q.id]).length;
  if (cleared === 0) return "failed";
  if (cleared === core.length) return "complete";
  return "partial";
}

function mapApiQuest(q: ApiQuest): Quest {
  return {
    id: String(q.id),
    name: q.name,
    kind: q.kind,
    target: Number(q.target),
    unit: q.unit,
    accent: q.accent,
  };
}

function buildTodayFromApi(
  quests: Quest[],
  dateKey: string,
  submitted: boolean,
  items: ApiLogItem[],
): DayState {
  const byQuest = new Map(items.map((i) => [String(i.quest_id), i]));
  const logs: Record<string, QuestLog> = {};
  for (const q of quests) {
    const item = byQuest.get(q.id);
    const value = item ? Number(item.value) : 0;
    logs[q.id] = {
      questId: q.id,
      value,
      cleared: item ? Boolean(item.cleared) : false,
    };
  }
  return { dateKey, logs, submitted };
}

function defaultState(): HunterState {
  const quests = STARTER_QUESTS;
  const key = todayKey();
  return {
    hunterId: null,
    name: "Rohit",
    level: 1,
    xp: 0,
    streak: 0,
    quests,
    today: emptyDay(quests, key),
    history: [],
    selectedDate: key,
    pendingAlly: null,
    entered: false,
  };
}

const HunterContext = createContext<HunterContextValue | null>(null);

export function HunterProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<HunterState>(defaultState);
  const [hydrated, setHydrated] = useState(false);
  const [apiReady, setApiReady] = useState(DEMO_TESTING);
  const [authError, setAuthError] = useState<string | null>(null);

  const loadSessionPack = useCallback(async (hunter: ApiHunter) => {
    const [questsRows, todayPack, recent] = await Promise.all([
      fetchQuests(hunter.id),
      fetchToday(hunter.id),
      fetchRecentLogs(hunter.id),
    ]);
    const quests = questsRows.map(mapApiQuest);
    const today = buildTodayFromApi(
      quests,
      todayPack.date_key,
      todayPack.log.submitted,
      todayPack.items,
    );
    const history: DayRecord[] = recent
      .filter((l) => l.submitted && l.date_key !== today.dateKey)
      .map((l) => ({
        dateKey: l.date_key,
        status: l.status,
        questClears: {},
      }));

    setState({
      hunterId: hunter.id,
      name: hunter.name,
      level: hunter.level,
      xp: hunter.xp,
      streak: hunter.streak,
      quests,
      today,
      history,
      selectedDate: today.dateKey,
      pendingAlly: null,
      entered: true,
    });
    setApiReady(true);
    setAuthError(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      if (DEMO_TESTING) {
        try {
          for (const k of Object.keys(localStorage)) {
            if (k.startsWith("solo-leveling-hunter-") && k !== STORAGE_KEY) {
              localStorage.removeItem(k);
            }
          }
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw) as HunterState;
            const key = todayKey();
            const quests = migrateStarterQuests(
              parsed.quests?.length ? parsed.quests : STARTER_QUESTS,
            );
            setState({
              ...defaultState(),
              ...parsed,
              hunterId: null,
              name: parsed.name?.trim() || "Rohit",
              quests,
              history: [],
              today: {
                ...emptyDay(quests, key),
                logs: parsed.today?.logs ?? emptyDay(quests, key).logs,
                submitted: false,
              },
              selectedDate: key,
              pendingAlly: null,
            });
          }
        } catch {
          // ignore
        }
        if (!cancelled) {
          setAuthError(null);
          setHydrated(true);
          setApiReady(true);
        }
        return;
      }

      try {
        const me = await fetchMe();
        if (cancelled) return;
        setAuthError(null);
        await loadSessionPack(me.hunter);
      } catch (err) {
        if (cancelled) return;
        if (!(err instanceof ApiError && err.status === 401)) {
          setAuthError(err instanceof Error ? err.message : "Could not reach API");
        }
        setState(defaultState());
        setApiReady(true);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once on mount
  }, []);

  useEffect(() => {
    if (!hydrated || !DEMO_TESTING) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...state, today: { ...state.today, submitted: false } }),
    );
  }, [state, hydrated]);

  const enterGate = useCallback((name?: string) => {
    // Local/demo only — production uses completeAuth after OTP
    setState((s) => ({
      ...s,
      entered: true,
      name: name?.trim() || s.name || "Rohit",
      selectedDate: todayKey(),
    }));
  }, []);

  const completeAuth = useCallback(
    async (hunter: ApiHunter) => {
      await loadSessionPack(hunter);
    },
    [loadSessionPack],
  );

  const leaveGate = useCallback(() => {
    if (!DEMO_TESTING) {
      void logoutApi().catch(() => undefined);
    }
    setState(defaultState());
  }, []);

  const selectDate = useCallback((dateKey: string) => {
    setState((s) => ({ ...s, selectedDate: dateKey }));
  }, []);

  const syncItem = useCallback(
    (questId: string, value: number, cleared: boolean) => {
      if (DEMO_TESTING || !state.hunterId) return;
      const qid = Number(questId);
      if (!Number.isFinite(qid)) return;
      void patchTodayItem(state.hunterId, qid, { value, cleared }).catch((err) => {
        console.error("Failed to sync quest item", err);
      });
    },
    [state.hunterId],
  );

  const setLogValue = useCallback(
    (questId: string, value: number) => {
      setState((s) => {
        const quest = s.quests.find((q) => q.id === questId);
        if (!quest) return s;
        const nextValue = Math.max(0, value);
        const cleared = isCleared(quest, nextValue);
        syncItem(questId, nextValue, cleared);
        return {
          ...s,
          today: {
            ...s.today,
            logs: {
              ...s.today.logs,
              [questId]: {
                questId,
                value: nextValue,
                cleared,
              },
            },
          },
        };
      });
    },
    [syncItem],
  );

  const markYesNo = useCallback(
    (questId: string, done: boolean) => {
      setLogValue(questId, done ? 1 : 0);
    },
    [setLogValue],
  );

  const toggleQuestDone = useCallback(
    (questId: string) => {
      setState((s) => {
        if (s.selectedDate !== s.today.dateKey) return s;
        if (s.today.submitted && !DEMO_TESTING) return s;
        const quest = s.quests.find((q) => q.id === questId);
        if (!quest) return s;
        const current = s.today.logs[questId]?.cleared ?? false;
        const nextCleared = !current;
        const value = nextCleared ? (quest.kind === "yesno" ? 1 : quest.target) : 0;
        syncItem(questId, value, nextCleared);
        return {
          ...s,
          today: {
            ...s.today,
            submitted: DEMO_TESTING ? false : s.today.submitted,
            logs: {
              ...s.today.logs,
              [questId]: { questId, value, cleared: nextCleared },
            },
          },
        };
      });
    },
    [syncItem],
  );

  const submitDay = useCallback(async () => {
    let leveled = false;
    let newLevel = 0;

    // Must clear every core quest before the System accepts the day.
    const coreNow = coreQuests(state.quests);
    const readyToSubmit =
      coreNow.length > 0 &&
      coreNow.every((q) => state.today.logs[q.id]?.cleared);
    if (!readyToSubmit) {
      return { leveled: false, newLevel: 0, blocked: true };
    }

    if (!DEMO_TESTING && state.hunterId) {
      try {
        const result = await submitTodayApi(state.hunterId);
        if (result.hunter) {
          const prevLevel = state.level;
          leveled = result.leveled;
          newLevel = result.hunter.level;
          const ally =
            leveled && result.hunter.level > prevLevel
              ? allyForLevel(result.hunter.level)
              : null;
          setState((s) => ({
            ...s,
            level: result.hunter.level,
            xp: result.hunter.xp,
            streak: result.hunter.streak,
            pendingAlly: ally ?? s.pendingAlly,
            today: { ...s.today, submitted: true },
            history: [
              ...s.history.filter((h) => h.dateKey !== s.today.dateKey),
              {
                dateKey: s.today.dateKey,
                status: (result.status as DayStatus) ?? "partial",
                questClears: Object.fromEntries(
                  s.quests.map((q) => [q.id, Boolean(s.today.logs[q.id]?.cleared)]),
                ),
              },
            ],
          }));
        }
        return { leveled, newLevel };
      } catch (err) {
        console.error(err);
        return { leveled: false, newLevel: 0 };
      }
    }

    setState((s) => {
      if (s.today.submitted && !DEMO_TESTING) return s;

      const core = coreQuests(s.quests);
      const allClear =
        core.length > 0 && core.every((q) => s.today.logs[q.id]?.cleared);
      const questClears: Record<string, boolean> = {};
      for (const q of s.quests) {
        questClears[q.id] = Boolean(s.today.logs[q.id]?.cleared);
      }
      const status = dayStatusFromClears(s.quests, questClears);

      const history = DEMO_TESTING
        ? s.history
        : [
            ...s.history.filter((h) => h.dateKey !== s.today.dateKey),
            { dateKey: s.today.dateKey, status, questClears },
          ];

      const streak = allClear ? s.streak + 1 : 0;

      let xpGain = 0;
      for (const q of core) {
        if (s.today.logs[q.id]?.cleared) xpGain += 25;
      }
      if (allClear) xpGain += 40;
      if (allClear && streak > 1) xpGain += Math.min(50, streak * 5);

      let level = s.level;
      let xp = s.xp + xpGain;
      let pendingAlly = s.pendingAlly;

      if (DEMO_TESTING && allClear) {
        level += 1;
        leveled = true;
        newLevel = level;
        xp = 0;
        const ally = allyForLevel(level);
        if (ally) {
          pendingAlly = ally;
          xp = ascensionXpBonus(allyAscension(level, ally));
        }
      } else {
        while (xp >= xpForLevel(level)) {
          xp -= xpForLevel(level);
          level += 1;
          leveled = true;
          newLevel = level;
          const ally = allyForLevel(level);
          if (ally) {
            pendingAlly = ally;
            xp += ascensionXpBonus(allyAscension(level, ally));
          }
        }
      }

      return {
        ...s,
        level,
        xp,
        streak,
        history,
        pendingAlly,
        today: DEMO_TESTING
          ? emptyDay(s.quests, s.today.dateKey)
          : { ...s.today, submitted: true },
      };
    });

    return { leveled, newLevel };
  }, [state.hunterId, state.level, state.quests, state.today.logs]);

  const dismissAlly = useCallback(() => {
    setState((s) => ({ ...s, pendingAlly: null }));
  }, []);

  const resetDemo = useCallback(() => {
    const base = defaultState();
    setState((s) => ({
      ...base,
      entered: true,
      name: s.name || "Rohit",
    }));
    try {
      for (const k of Object.keys(localStorage)) {
        if (k.startsWith("solo-leveling-hunter-")) localStorage.removeItem(k);
      }
    } catch {
      // ignore
    }
  }, []);

  const previewNextUnlock = useCallback(() => {
    setState((s) => {
      let nextLevel = s.level + 1;
      let ally = allyForLevel(nextLevel);
      while (!ally && nextLevel < s.level + ALLIES.length + 5) {
        nextLevel += 1;
        ally = allyForLevel(nextLevel);
      }
      return {
        ...s,
        level: nextLevel,
        xp: 0,
        streak: Math.max(s.streak, nextLevel - 1),
        pendingAlly: ally ?? s.pendingAlly,
        today: emptyDay(s.quests, todayKey()),
        selectedDate: todayKey(),
        history: [],
      };
    });
  }, []);

  const breakStreakForTest = useCallback(() => {
    setState((s) => ({
      ...s,
      streak: 0,
      today: emptyDay(s.quests, todayKey()),
      selectedDate: todayKey(),
    }));
  }, []);

  const addQuest = useCallback(
    (quest: Omit<Quest, "id">) => {
      if (!DEMO_TESTING && state.hunterId) {
        void createQuestApi(state.hunterId, {
          name: quest.name,
          kind: quest.kind,
          target: quest.target,
          unit: quest.unit,
          accent: quest.accent,
        })
          .then((row) => {
            const mapped = mapApiQuest(row);
            setState((s) => ({
              ...s,
              quests: [...s.quests, mapped],
              today: {
                ...s.today,
                logs: {
                  ...s.today.logs,
                  [mapped.id]: { questId: mapped.id, value: 0, cleared: false },
                },
              },
            }));
          })
          .catch(console.error);
        return;
      }

      setState((s) => {
        const id = `q${Date.now()}`;
        const nextQuests = [...s.quests, { ...quest, id }];
        return {
          ...s,
          quests: nextQuests,
          today: {
            ...s.today,
            logs: {
              ...s.today.logs,
              [id]: { questId: id, value: 0, cleared: false },
            },
          },
        };
      });
    },
    [state.hunterId],
  );

  const updateQuestTarget = useCallback((questId: string, target: number) => {
    const nextTarget = Math.max(1, Math.floor(target));
    setState((s) => {
      const quest = s.quests.find((q) => q.id === questId);
      if (!quest) return s;
      const nextQuests = s.quests.map((q) =>
        q.id === questId ? { ...q, target: nextTarget } : q,
      );
      const log = s.today.logs[questId];
      const value = log?.value ?? 0;
      return {
        ...s,
        quests: nextQuests,
        today: {
          ...s.today,
          logs: {
            ...s.today.logs,
            [questId]: {
              questId,
              value,
              cleared: isCleared({ ...quest, target: nextTarget }, value),
            },
          },
        },
      };
    });
  }, []);

  const removeQuest = useCallback(
    (questId: string) => {
      // Steps bar is fixed — never remove from the pack
      const target = state.quests.find((q) => q.id === questId);
      if (target && isStepsQuest(target)) return;

      if (!DEMO_TESTING) {
        const qid = Number(questId);
        if (Number.isFinite(qid)) {
          void deleteQuestApi(qid).catch(console.error);
        }
      }
      setState((s) => {
        const doomed = s.quests.find((q) => q.id === questId);
        if (doomed && isStepsQuest(doomed)) return s;
        const nextQuests = s.quests.filter((q) => q.id !== questId);
        const restLogs = { ...s.today.logs };
        delete restLogs[questId];
        return {
          ...s,
          quests: nextQuests,
          today: { ...s.today, logs: restLogs },
        };
      });
    },
    [state.quests],
  );

  const xpToNext = xpForLevel(state.level);
  const xpProgress = Math.min(100, Math.round((state.xp / xpToNext) * 100));
  const core = coreQuests(state.quests);
  const todayClearedCount = core.filter((q) => state.today.logs[q.id]?.cleared).length;
  const allCleared = core.length > 0 && todayClearedCount === core.length;
  const clearPercent =
    core.length === 0 ? 0 : Math.round((todayClearedCount / core.length) * 100);
  const alliesUnlocked = unlockedAllies(state.level);
  const allyNext = nextAlly(state.level);
  const isTodaySelected = state.selectedDate === state.today.dateKey;

  const selectedClears = useMemo(() => {
    if (isTodaySelected) {
      const map: Record<string, boolean> = {};
      for (const q of state.quests) {
        map[q.id] = Boolean(state.today.logs[q.id]?.cleared);
      }
      return map;
    }
    const rec = state.history.find((h) => h.dateKey === state.selectedDate);
    return rec?.questClears ?? {};
  }, [isTodaySelected, state.quests, state.today.logs, state.history, state.selectedDate]);

  const value = useMemo<HunterContextValue>(
    () => ({
      ...state,
      hydrated,
      apiReady,
      authError,
      enterGate,
      completeAuth,
      leaveGate,
      selectDate,
      toggleQuestDone,
      setLogValue,
      markYesNo,
      submitDay,
      dismissAlly,
      addQuest,
      updateQuestTarget,
      removeQuest,
      resetDemo,
      previewNextUnlock,
      breakStreakForTest,
      xpToNext,
      xpProgress,
      todayClearedCount,
      allCleared,
      clearPercent,
      alliesUnlocked,
      allyNext,
      isTodaySelected,
      selectedClears,
    }),
    [
      state,
      hydrated,
      apiReady,
      authError,
      enterGate,
      completeAuth,
      leaveGate,
      selectDate,
      toggleQuestDone,
      setLogValue,
      markYesNo,
      submitDay,
      dismissAlly,
      addQuest,
      updateQuestTarget,
      removeQuest,
      resetDemo,
      previewNextUnlock,
      breakStreakForTest,
      xpToNext,
      xpProgress,
      todayClearedCount,
      allCleared,
      clearPercent,
      alliesUnlocked,
      allyNext,
      isTodaySelected,
      selectedClears,
    ],
  );

  return <HunterContext.Provider value={value}>{children}</HunterContext.Provider>;
}

export function useHunter(): HunterContextValue {
  const ctx = useContext(HunterContext);
  if (!ctx) throw new Error("useHunter must be used within HunterProvider");
  return ctx;
}
