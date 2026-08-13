import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { setAudioMuted } from "@/lib/audio";
import { lifeForceFromHealth, loadLocalHealthMetrics } from "@/lib/health-metrics";
import type { RunEntry, WorkoutDataSource, WorkoutSyncMeta } from "@/lib/workouts/types";
import { generateMockWorkouts } from "@/lib/workouts/mock-workouts";
import {
  fetchWorkouts,
  resolveWorkoutSource,
} from "@/lib/workouts/workout-service";
import { applyUiLoadout } from "@/lib/ui-themes";
import type { Loadout } from "@/lib/arcade-store";
import {
  DEFAULT_LOADOUT,
  FREE_UNLOCKS,
  getStoreItem,
  isItemOwned,
  sanitizeLoadout,
} from "@/lib/arcade-store";
import { rollSideQuestTitle } from "@/lib/side-quest-card";

export type { RunEntry, WorkoutDataSource, WorkoutSyncMeta } from "@/lib/workouts/types";

export type HabitId = "steps" | "sleep" | "recovery";

export type HomeGame = "jumpman" | "snake";

export type ErrandEntry = {
  id: string;
  date: string;
  text: string;
  tokens: number;
  completed: boolean;
  completedAt: string | null;
  heroTitle?: string;
  photoSrc?: string;
};

export type GameState = {
  tokens: number;
  lifeForce: number;
  habitLog: Record<string, HabitId[]>; // date -> completed habits
  runs: RunEntry[];
  errands: ErrandEntry[];
  /** Planned training days (ISO date keys) shown on the Quest calendar. */
  trainingPlan: string[];
  unlocked: string[];
  loadout: Loadout;
  adventurerNotes: string;
  activeCity: string;
  unlockedCities: string[];
  homeGame: HomeGame;
  bonusDate: string | null;
  workoutSync: WorkoutSyncMeta;
  profile: {
    name: string;
    autoSync: boolean;
    homeCity: string;
  };
  settings: {
    notifications: boolean;
    stravaSync: boolean;
    workoutDataSource: WorkoutDataSource;
    avatarConsent: boolean;
    audio: boolean;
  };
};

export const HABITS: { id: HabitId; label: string; detail: string; reward: number }[] = [
  { id: "steps", label: "Steps", detail: "8,000 steps tracked", reward: 8 },
  { id: "sleep", label: "Sleep", detail: "7+ hours logged", reward: 12 },
  { id: "recovery", label: "Recovery", detail: "Stretch or mobility", reward: 10 },
];

export const WEEKLY_GOAL_MILES = 15;

/** Arcade Tokens earned per completed micro-adventure. */
export const ERRAND_TOKEN_REWARD = 6;

/** Small Life Force bump per errand — a gentle daily power-up. */
export const ERRAND_LIFE_FORCE_BUMP = 2;

function newEntryId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function seedTrainingPlan(now = new Date()): string[] {
  const dates: string[] = [];
  for (let i = 2; i <= 28; i += 4) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    if (d.getMonth() === now.getMonth()) dates.push(todayKey(d));
  }
  return dates;
}

export function normalizeErrand(raw: Partial<ErrandEntry> & { completedAt?: string | null }): ErrandEntry {
  const completed = raw.completed ?? Boolean(raw.completedAt);
  return {
    id: raw.id ?? newEntryId(),
    date: raw.date ?? todayKey(),
    text: raw.text ?? "Side quest",
    completed,
    completedAt: completed ? (raw.completedAt ?? new Date().toISOString()) : null,
    tokens: completed ? (raw.tokens ?? ERRAND_TOKEN_REWARD) : 0,
    heroTitle: raw.heroTitle,
    photoSrc: raw.photoSrc,
  };
}

export function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function seedHabitLog(): Record<string, HabitId[]> {
  const log: Record<string, HabitId[]> = {};
  const now = new Date();
  for (let i = 1; i < 12; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    if (i % 3 === 0) continue;
    log[todayKey(d)] = i % 2 === 0 ? ["steps", "sleep"] : ["steps"];
  }
  return log;
}

function createInitialState(): GameState {
  return {
    tokens: 240,
    lifeForce: 62,
    habitLog: seedHabitLog(),
    runs: generateMockWorkouts(),
    errands: [],
    trainingPlan: seedTrainingPlan(),
    unlocked: [...FREE_UNLOCKS],
    loadout: { ...DEFAULT_LOADOUT },
    workoutSync: {
      source: "mock",
      lastSyncedAt: null,
      lastError: null,
      usedFallback: false,
    },
    adventurerNotes: "Chased the sunset through the east side. Boss defeated at mile 4.",
    activeCity: "london",
    unlockedCities: ["london"],
    homeGame: "jumpman",
    bonusDate: null,
    profile: {
      name: "Adele Roberts",
      autoSync: true,
      homeCity: "London, UK",
    },
    settings: {
      notifications: true,
      stravaSync: false,
      workoutDataSource: "mock",
      avatarConsent: true,
      audio: false,
    },
  };
}

const STORAGE_KEY = "eight-bit-runner-state-v1";

type BooleanSettingKey = Exclude<keyof GameState["settings"], "workoutDataSource">;

type Ctx = {
  state: GameState;
  hydrated: boolean;
  workoutSyncing: boolean;
  logHabit: (id: HabitId) => void;
  spendTokens: (amount: number, unlockId: string) => boolean;
  purchaseStoreItem: (itemId: string) => "unlock" | "equip" | false;
  setNotes: (value: string) => void;
  setActiveCity: (id: string) => void;
  unlockCity: (id: string, cost: number) => boolean;
  setHomeGame: (game: HomeGame) => void;
  claimDailyBonus: (amount: number) => boolean;
  toggleSetting: (key: BooleanSettingKey) => void;
  setWorkoutDataSource: (source: WorkoutDataSource) => void;
  syncWorkouts: () => Promise<import("@/lib/workouts/types").WorkoutSyncResult>;
  addRun: (run: RunEntry) => void;
  removeRun: (date: string) => boolean;
  addErrand: (text: string) => boolean;
  completeErrand: (
    id: string,
    options?: { photoSrc?: string; heroTitle?: string },
  ) => boolean;
  removeErrand: (id: string) => boolean;
  updateErrandPhoto: (id: string, photoSrc: string) => void;
  updateProfile: (patch: Partial<GameState["profile"]>) => void;
};

const GameStateContext = createContext<Ctx | null>(null);

export function GameStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(() => createInitialState());
  const [hydrated, setHydrated] = useState(false);
  const [workoutSyncing, setWorkoutSyncing] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<GameState>;
        const unlocked = [...new Set([...FREE_UNLOCKS, ...(parsed.unlocked ?? [])])];
        const loadout = sanitizeLoadout(parsed.loadout, unlocked);
        const merged = {
          ...createInitialState(),
          ...parsed,
          errands: (parsed.errands ?? []).map((e) => normalizeErrand(e)),
          trainingPlan: parsed.trainingPlan ?? seedTrainingPlan(),
          loadout,
          unlocked,
          workoutSync: { ...createInitialState().workoutSync, ...parsed.workoutSync },
          settings: { ...createInitialState().settings, ...parsed.settings },
        };
        setState(merged);
        applyUiLoadout(loadout);
      }
    } catch {
      /* ignore corrupted state */
    }
    setHydrated(true);
  }, []);

  // Keep the global chiptune engine in sync with the Settings audio toggle.
  useEffect(() => {
    setAudioMuted(!state.settings.audio);
  }, [state.settings.audio]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable */
    }
  }, [state, hydrated]);

  const logHabit = useCallback((id: HabitId) => {
    setState((prev) => {
      const key = todayKey();
      const done = prev.habitLog[key] ?? [];
      if (done.includes(id)) return prev;
      const reward = HABITS.find((h) => h.id === id)?.reward ?? 5;
      return {
        ...prev,
        habitLog: { ...prev.habitLog, [key]: [...done, id] },
        tokens: prev.tokens + reward,
        lifeForce: Math.min(100, prev.lifeForce + reward),
      };
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    applyUiLoadout(state.loadout);
  }, [state.loadout, hydrated]);

  const purchaseStoreItem = useCallback((itemId: string): "unlock" | "equip" | false => {
    const item = getStoreItem(itemId);
    if (!item) return false;
    let action: "unlock" | "equip" | false = false;
    setState((prev) => {
      const owned = isItemOwned(prev.unlocked, item);
      if (owned) {
        if (!item.loadoutKey) return prev;
        action = "equip";
        return { ...prev, loadout: { ...prev.loadout, [item.loadoutKey]: itemId } };
      }
      if (prev.tokens < item.tokens) return prev;
      action = "unlock";
      const next = {
        ...prev,
        tokens: prev.tokens - item.tokens,
        unlocked: [...prev.unlocked, itemId],
      };
      if (item.loadoutKey) {
        return { ...next, loadout: { ...prev.loadout, [item.loadoutKey]: itemId } };
      }
      return next;
    });
    return action;
  }, []);

  const spendTokens = useCallback((amount: number, unlockId: string) => {
    let ok = false;
    setState((prev) => {
      if (prev.tokens < amount || prev.unlocked.includes(unlockId)) return prev;
      ok = true;
      return { ...prev, tokens: prev.tokens - amount, unlocked: [...prev.unlocked, unlockId] };
    });
    return ok;
  }, []);

  const setNotes = useCallback((value: string) => {
    setState((prev) => ({ ...prev, adventurerNotes: value }));
  }, []);

  const setActiveCity = useCallback((id: string) => {
    setState((prev) => ({ ...prev, activeCity: id }));
  }, []);

  const setHomeGame = useCallback((game: HomeGame) => {
    setState((prev) => ({ ...prev, homeGame: game }));
  }, []);

  /** One arcade-token bonus per day, awarded by the navigational Jumpman. */
  const claimDailyBonus = useCallback((amount: number) => {
    let ok = false;
    setState((prev) => {
      const key = todayKey();
      if (prev.bonusDate === key) return prev;
      ok = true;
      return { ...prev, bonusDate: key, tokens: prev.tokens + amount };
    });
    return ok;
  }, []);

  const unlockCity = useCallback((id: string, cost: number) => {
    let ok = false;
    setState((prev) => {
      if (prev.unlockedCities.includes(id) || prev.tokens < cost) return prev;
      ok = true;
      return {
        ...prev,
        tokens: prev.tokens - cost,
        unlockedCities: [...prev.unlockedCities, id],
        activeCity: id,
      };
    });
    return ok;
  }, []);

  const toggleSetting = useCallback((key: BooleanSettingKey) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, [key]: !prev.settings[key] },
    }));
  }, []);

  const addRun = useCallback((run: RunEntry) => {
    setState((prev) => ({
      ...prev,
      runs: [run, ...prev.runs.filter((r) => r.date !== run.date)].sort((a, b) =>
        a.date < b.date ? 1 : -1,
      ),
      tokens: prev.tokens + Math.round(run.miles * 10),
    }));
  }, []);

  const removeRun = useCallback((date: string) => {
    let ok = false;
    setState((prev) => {
      const run = prev.runs.find((r) => r.date === date);
      if (!run?.manual) return prev;
      ok = true;
      return {
        ...prev,
        runs: prev.runs.filter((r) => r.date !== date),
      };
    });
    return ok;
  }, []);

  const addErrand = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return false;
    setState((prev) => {
      const entry: ErrandEntry = {
        id: newEntryId(),
        date: todayKey(),
        text: trimmed,
        tokens: 0,
        completed: false,
        completedAt: null,
      };
      return {
        ...prev,
        errands: [entry, ...prev.errands],
      };
    });
    return true;
  }, []);

  const completeErrand = useCallback(
    (id: string, options?: { photoSrc?: string; heroTitle?: string }) => {
      let ok = false;
      setState((prev) => {
        const errand = prev.errands.find((e) => e.id === id);
        if (!errand || errand.completed) return prev;
        ok = true;
        const heroTitle = options?.heroTitle ?? rollSideQuestTitle(errand);
        const completedAt = new Date().toISOString();
        const updated: ErrandEntry = {
          ...errand,
          completed: true,
          completedAt,
          tokens: ERRAND_TOKEN_REWARD,
          heroTitle,
          photoSrc: options?.photoSrc ?? errand.photoSrc,
        };
        return {
          ...prev,
          errands: prev.errands.map((e) => (e.id === id ? updated : e)),
          tokens: prev.tokens + ERRAND_TOKEN_REWARD,
          lifeForce: Math.min(100, prev.lifeForce + ERRAND_LIFE_FORCE_BUMP),
        };
      });
      return ok;
    },
    [],
  );

  const updateErrandPhoto = useCallback((id: string, photoSrc: string) => {
    setState((prev) => ({
      ...prev,
      errands: prev.errands.map((e) => (e.id === id ? { ...e, photoSrc } : e)),
    }));
  }, []);

  const removeErrand = useCallback((id: string) => {
    let ok = false;
    setState((prev) => {
      if (!prev.errands.some((e) => e.id === id)) return prev;
      ok = true;
      return {
        ...prev,
        errands: prev.errands.filter((e) => e.id !== id),
      };
    });
    return ok;
  }, []);

  const updateProfile = useCallback((patch: Partial<GameState["profile"]>) => {
    setState((prev) => ({ ...prev, profile: { ...prev.profile, ...patch } }));
  }, []);

  const setWorkoutDataSource = useCallback((source: WorkoutDataSource) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, workoutDataSource: source },
    }));
  }, []);

  const syncWorkouts = useCallback(async () => {
    setWorkoutSyncing(true);
    try {
      const source = resolveWorkoutSource(
        state.settings.stravaSync,
        state.settings.workoutDataSource,
      );
      const result = await fetchWorkouts(source, { fallbackToMock: true });
      setState((prev) => ({
        ...prev,
        runs: result.runs,
        workoutSync: result.meta,
      }));
      return result;
    } finally {
      setWorkoutSyncing(false);
    }
  }, [state.settings.stravaSync, state.settings.workoutDataSource]);

  const value = useMemo(
    () => ({
      state,
      hydrated,
      workoutSyncing,
      logHabit,
      spendTokens,
      purchaseStoreItem,
      setNotes,
      setActiveCity,
      setHomeGame,
      claimDailyBonus,
      unlockCity,
      toggleSetting,
      setWorkoutDataSource,
      syncWorkouts,
      addRun,
      removeRun,
      addErrand,
      completeErrand,
      updateErrandPhoto,
      removeErrand,
      updateProfile,
    }),
    [
      state,
      hydrated,
      workoutSyncing,
      logHabit,
      spendTokens,
      purchaseStoreItem,
      setNotes,
      setActiveCity,
      setHomeGame,
      claimDailyBonus,
      unlockCity,
      toggleSetting,
      setWorkoutDataSource,
      syncWorkouts,
      addRun,
      removeRun,
      addErrand,
      completeErrand,
      updateErrandPhoto,
      removeErrand,
      updateProfile,
    ],
  );



  return <GameStateContext.Provider value={value}>{children}</GameStateContext.Provider>;
}

export function useGameState() {
  const ctx = useContext(GameStateContext);
  if (!ctx) throw new Error("useGameState must be used inside GameStateProvider");
  return ctx;
}

export function formatPace(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function currentStreak(runs: RunEntry[]) {
  const dates = new Set(runs.map((r) => r.date));
  let streak = 0;
  const cursor = new Date();
  if (!dates.has(todayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (dates.has(todayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function weeklyMiles(runs: RunEntry[]) {
  const start = new Date();
  start.setDate(start.getDate() - 6);
  const startKey = todayKey(start);
  return runs
    .filter((r) => r.date >= startKey)
    .reduce((sum, r) => sum + r.miles, 0);
}

/** Habit check-ins completed over the trailing 7 days. */
export function weeklyCheckIns(habitLog: Record<string, HabitId[]>) {
  const start = new Date();
  start.setDate(start.getDate() - 6);
  const startKey = todayKey(start);
  return Object.entries(habitLog)
    .filter(([date]) => date >= startKey)
    .reduce((sum, [, ids]) => sum + ids.length, 0);
}

export function lifeForce(_state?: GameState) {
  if (typeof window === "undefined") return 62;
  return lifeForceFromHealth(loadLocalHealthMetrics());
}

export const BASE_WEEKLY_PAYOUT = 120;

/** Higher Life Force multiplies the weekly Arcade Token payout (1x – 2x). */
export function weeklyPayout(lf: number) {
  return Math.round(BASE_WEEKLY_PAYOUT * (1 + lf / 100));
}
