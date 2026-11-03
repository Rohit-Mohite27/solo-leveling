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
  allyForLevel,
  coreQuests,
  isStepsQuest,
  nextAlly,
  todayKey,
  unlockedAllies,
  type Ally,
  type DayRecord,
  type DayStatus,
  type Quest,
} from "./demo-data";
import {
  ALLY_BOOST_COST,
  CACHE_CHARGE_MAX,
  buildReward,
  computeRewardBreakdown,
  makeDummyPendingRewards,
  type PendingReward,
} from "./rewards";
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
  /** Rises only when a full day is cleared + submitted */
  level: number;
  /** Spendable Essence — does not raise level */
  xp: number;
  streak: number;
  quests: Quest[];
  today: DayState;
  history: DayRecord[];
  selectedDate: string;
  pendingAlly: Ally | null;
  entered: boolean;
  /** Unopened System reward chests */
  pendingRewards: PendingReward[];
  /** Extra power ranks bought with Essence */
  allyBoosts: Record<string, number>;
  /** 0–100 charge toward next Overload Cache */
  cacheCharge: number;
  /** Last claimed chest — drives Jinwoo popup */
  rewardPopup: PendingReward | null;
  /** Streak broke — army sealed until they clear days again */
  armyLostPopup: boolean;
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
  claimReward: (rewardId: string) => void;
  dismissRewardPopup: () => void;
  dismissArmyLostPopup: () => void;
  boostAlly: (allyId: string) => { ok: boolean; message: string };
  chargeCacheFromExtras: (extraXp: number) => void;
  /** Testing: load chests + Essence + mid-level army */
  seedRewardDemo: () => void;
  /** Testing: force streak break + army-loss popup */
  simulateArmyLoss: () => void;
  addQuest: (quest: Omit<Quest, "id">) => void;
  updateQuestTarget: (questId: string, target: number) => void;
  removeQuest: (questId: string) => void;
  /** Testing: wipe progress, keep name, unlock today again */
  resetDemo: () => void;
  /** Testing: jump to next level and show that ally greeting */
  previewNextUnlock: () => void;
  /** Testing / midnight warning: reset streak to 0 */
  breakStreakForTest: () => void;
  /** Essence needed for next cache tick (display) */
  xpToNext: number;
  xpProgress: number;
  unclaimedRewards: number;
  todayClearedCount: number;
  allCleared: boolean;
  clearPercent: number;
  alliesUnlocked: Ally[];
  allyNext: Ally | undefined;
  isTodaySelected: boolean;
  selectedClears: Record<string, boolean>;
};

const STORAGE_KEY = "solo-leveling-hunter-v12";

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
    pendingRewards: [],
    allyBoosts: {},
    cacheCharge: 0,
    rewardPopup: null,
    armyLostPopup: false,
  };
}

/** Reset army progress after a broken streak — Essence chests stay. */
function applyArmyLoss<T extends HunterState>(s: T): T {
  return {
    ...s,
    level: 1,
    streak: 0,
    pendingAlly: null,
    allyBoosts: {},
    armyLostPopup: true,
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

    setState((prev) => ({
      ...prev,
      hunterId: hunter.id,
      name: hunter.name,
      level: hunter.level,
      // Essence is local spendable currency — do not replace with backend level XP
      xp: prev.xp ?? 0,
      streak: hunter.streak,
      quests,
      today,
      history,
      selectedDate: today.dateKey,
      pendingAlly: null,
      entered: true,
      pendingRewards: prev.pendingRewards ?? [],
      allyBoosts: prev.allyBoosts ?? {},
      cacheCharge: prev.cacheCharge ?? 0,
      rewardPopup: null,
      armyLostPopup: false,
    }));
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
              pendingRewards: parsed.pendingRewards ?? [],
              allyBoosts: parsed.allyBoosts ?? {},
              cacheCharge: parsed.cacheCharge ?? 0,
              rewardPopup: null,
              armyLostPopup: false,
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
        const prevLog = s.today.logs[questId];
        const prevValue = prevLog?.value ?? 0;
        const wasCleared = Boolean(prevLog?.cleared);
        // Once Cleared, never drop below the goal (can't mark undone)
        let nextValue = Math.max(0, value);
        if (wasCleared && quest.kind !== "steps") {
          if (quest.kind === "yesno") nextValue = 1;
          else nextValue = Math.max(quest.target, nextValue);
        }
        const cleared = wasCleared || isCleared(quest, nextValue);
        syncItem(questId, nextValue, cleared);

        // Over-goal grind charges Overload Cache (extras → chests, not level)
        let cacheCharge = s.cacheCharge;
        let pendingRewards = s.pendingRewards;
        if (quest.kind !== "yesno" && quest.kind !== "steps" && nextValue > prevValue) {
          const overBefore = Math.max(0, prevValue - quest.target);
          const overAfter = Math.max(0, nextValue - quest.target);
          const newOver = overAfter - overBefore;
          if (newOver > 0) {
            const extraXp =
              quest.kind === "distance"
                ? Math.round(newOver * 15)
                : Math.floor(newOver) * 2;
            cacheCharge += extraXp;
            const spawned: PendingReward[] = [];
            while (cacheCharge >= CACHE_CHARGE_MAX) {
              cacheCharge -= CACHE_CHARGE_MAX;
              spawned.push(
                buildReward("extra_grind", 40 + Math.floor(Math.random() * 25), "Overload Cache"),
              );
            }
            if (spawned.length) pendingRewards = [...spawned, ...pendingRewards];
          }
        }

        return {
          ...s,
          cacheCharge,
          pendingRewards,
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
      // Cleared goals stay cleared — no undo
      if (!done) return;
      setLogValue(questId, 1);
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
        // Already Cleared — lock it; extras still go through setLogValue / Log tab
        if (s.today.logs[questId]?.cleared) return s;
        const value = quest.kind === "yesno" ? 1 : quest.target;
        syncItem(questId, value, true);
        return {
          ...s,
          today: {
            ...s.today,
            submitted: DEMO_TESTING ? false : s.today.submitted,
            logs: {
              ...s.today.logs,
              [questId]: { questId, value, cleared: true },
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

    if (state.quests.length === 0) {
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
          const breakdown = computeRewardBreakdown(state.quests, state.today.logs);
          const allClear = coreQuests(state.quests).every(
            (q) => state.today.logs[q.id]?.cleared,
          );
          // Day chest = goal work only; extras charge Overload Cache separately
          let chestXp = breakdown.clearedXp;
          if (allClear) {
            chestXp += 40;
            const nextStreak = (result.hunter.streak ?? state.streak) || 1;
            if (nextStreak > 1) chestXp += Math.min(50, nextStreak * 5);
          }
          const reward = buildReward(
            allClear ? "day_clear" : "partial_day",
            chestXp,
          );
          const brokeStreak = !allClear && state.streak > 0;
          setState((s) => {
            const next = {
              ...s,
              level: brokeStreak ? 1 : result.hunter.level,
              // Keep local Essence bank — backend xp is not spendable currency
              streak: result.hunter.streak,
              pendingAlly: brokeStreak ? null : ally ?? s.pendingAlly,
              allyBoosts: brokeStreak ? {} : s.allyBoosts,
              armyLostPopup: brokeStreak ? true : s.armyLostPopup,
              // Extra grind already charged the cache on Log → Save; day chest only here
              pendingRewards:
                reward.xp > 0 ? [reward, ...s.pendingRewards] : s.pendingRewards,
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
            };
            return next;
          });
          if (brokeStreak) {
            leveled = false;
            newLevel = 1;
          }
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

      const prevStreak = s.streak;
      const streak = allClear ? s.streak + 1 : 0;
      const brokeStreak = !allClear && prevStreak > 0;
      const breakdown = computeRewardBreakdown(s.quests, s.today.logs);
      let chestXp = breakdown.clearedXp;
      if (allClear) {
        chestXp += 40;
        if (streak > 1) chestXp += Math.min(50, streak * 5);
      }

      // Level only from a fully cleared day — Essence stays in unclaimed chests
      let level = s.level;
      let pendingAlly = s.pendingAlly;
      let allyBoosts = s.allyBoosts;
      let armyLostPopup = s.armyLostPopup;
      if (brokeStreak) {
        level = 1;
        pendingAlly = null;
        allyBoosts = {};
        armyLostPopup = true;
        leveled = false;
        newLevel = 1;
      } else if (allClear) {
        level += 1;
        leveled = true;
        newLevel = level;
        const ally = allyForLevel(level);
        if (ally) pendingAlly = ally;
      }

      const reward =
        chestXp > 0
          ? buildReward(allClear ? "day_clear" : "partial_day", chestXp)
          : null;

      // Extras already charged Overload Cache on Log → Save; avoid double-dip
      return {
        ...s,
        level,
        streak,
        history,
        pendingAlly,
        allyBoosts,
        armyLostPopup,
        pendingRewards: reward ? [reward, ...s.pendingRewards] : s.pendingRewards,
        today: DEMO_TESTING
          ? emptyDay(s.quests, s.today.dateKey)
          : { ...s.today, submitted: true },
      };
    });

    return { leveled, newLevel };
  }, [state.hunterId, state.level, state.quests, state.streak, state.today.logs]);

  const dismissAlly = useCallback(() => {
    setState((s) => ({ ...s, pendingAlly: null }));
  }, []);

  const claimReward = useCallback((rewardId: string) => {
    setState((s) => {
      const chest = s.pendingRewards.find((r) => r.id === rewardId && !r.claimed);
      if (!chest) return s;
      return {
        ...s,
        xp: s.xp + chest.xp,
        pendingRewards: s.pendingRewards.map((r) =>
          r.id === rewardId ? { ...r, claimed: true } : r,
        ),
        rewardPopup: { ...chest, claimed: true },
      };
    });
  }, []);

  const dismissRewardPopup = useCallback(() => {
    setState((s) => ({ ...s, rewardPopup: null }));
  }, []);

  const dismissArmyLostPopup = useCallback(() => {
    setState((s) => ({ ...s, armyLostPopup: false }));
  }, []);

  const seedRewardDemo = useCallback(() => {
    setState((s) => ({
      ...s,
      level: 6,
      streak: 8,
      xp: 180,
      cacheCharge: 72,
      allyBoosts: { igris: 1, jinho: 2 },
      pendingRewards: makeDummyPendingRewards(),
      rewardPopup: null,
      armyLostPopup: false,
      pendingAlly: null,
    }));
  }, []);

  const simulateArmyLoss = useCallback(() => {
    setState((s) =>
      applyArmyLoss({
        ...s,
        // Give them an army first so the loss feels real in testing
        level: Math.max(s.level, 5),
        streak: Math.max(s.streak, 4),
      }),
    );
  }, []);

  const boostAlly = useCallback((allyId: string) => {
    let result = { ok: false, message: "Not enough Essence" };
    setState((s) => {
      if (s.xp < ALLY_BOOST_COST) {
        result = { ok: false, message: `Need ${ALLY_BOOST_COST} Essence to boost` };
        return s;
      }
      const nextRank = (s.allyBoosts[allyId] ?? 0) + 1;
      result = { ok: true, message: `Boost applied · rank ${nextRank}` };
      return {
        ...s,
        xp: s.xp - ALLY_BOOST_COST,
        allyBoosts: { ...s.allyBoosts, [allyId]: nextRank },
      };
    });
    return result;
  }, []);

  /** Charge Overload Cache from extra reps logged on the Log tab. */
  const chargeCacheFromExtras = useCallback((extraXp: number) => {
    if (extraXp <= 0) return;
    setState((s) => {
      let charge = s.cacheCharge + extraXp;
      const spawned: PendingReward[] = [];
      while (charge >= CACHE_CHARGE_MAX) {
        charge -= CACHE_CHARGE_MAX;
        spawned.push(
          buildReward("extra_grind", 40 + Math.floor(Math.random() * 25), "Overload Cache"),
        );
      }
      return {
        ...s,
        cacheCharge: charge,
        pendingRewards: spawned.length ? [...spawned, ...s.pendingRewards] : s.pendingRewards,
      };
    });
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
    setState((s) => {
      const hadArmy = s.streak > 0 || s.level > 1;
      const next = hadArmy
        ? applyArmyLoss(s)
        : { ...s, streak: 0, armyLostPopup: false };
      return {
        ...next,
        today: emptyDay(s.quests, todayKey()),
        selectedDate: todayKey(),
      };
    });
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

  const xpToNext = Math.max(0, CACHE_CHARGE_MAX - state.cacheCharge);
  const xpProgress = Math.min(100, Math.round((state.cacheCharge / CACHE_CHARGE_MAX) * 100));
  const unclaimedRewards = state.pendingRewards.filter((r) => !r.claimed).length;
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
      claimReward,
      dismissRewardPopup,
      dismissArmyLostPopup,
      boostAlly,
      chargeCacheFromExtras,
      seedRewardDemo,
      simulateArmyLoss,
      addQuest,
      updateQuestTarget,
      removeQuest,
      resetDemo,
      previewNextUnlock,
      breakStreakForTest,
      xpToNext,
      xpProgress,
      unclaimedRewards,
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
      claimReward,
      dismissRewardPopup,
      dismissArmyLostPopup,
      boostAlly,
      chargeCacheFromExtras,
      seedRewardDemo,
      simulateArmyLoss,
      addQuest,
      updateQuestTarget,
      removeQuest,
      resetDemo,
      previewNextUnlock,
      breakStreakForTest,
      xpToNext,
      xpProgress,
      unclaimedRewards,
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
