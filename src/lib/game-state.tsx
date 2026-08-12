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

export type HabitId = "steps" | "sleep" | "recovery";

export type HomeGame = "jumpman" | "snake";

export type RunEntry = {
  date: string; // yyyy-mm-dd
  miles: number;
  paceSeconds: number; // per mile
  topSpeed: number; // mph
  title: string;
};

export type GameState = {
  tokens: number;
  lifeForce: number;
  habitLog: Record<string, HabitId[]>; // date -> completed habits
  runs: RunEntry[];
  unlocked: string[];
  adventurerNotes: string;
  activeCity: string;
  unlockedCities: string[];
  homeGame: HomeGame;
  profile: {
    name: string;
    autoSync: boolean;
    homeCity: string;
  };
  settings: {
    notifications: boolean;
    stravaSync: boolean;
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

export function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function seedRuns(): RunEntry[] {
  const titles = [
    "Downtown Dash",
    "Riverside Sprint",
    "Hawkins Loop",
    "Sunrise Tempo",
    "Neon Mile Repeats",
    "Recovery Shuffle",
  ];
  const out: RunEntry[] = [];
  const now = new Date();
  const offsets = [0, 1, 2, 4, 5, 7, 8, 9, 11, 13, 14, 16, 18, 19, 21, 24, 26];
  offsets.forEach((offset, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - offset);
    out.push({
      date: todayKey(d),
      miles: Number((1.6 + ((i * 7) % 9) * 0.22).toFixed(2)),
      paceSeconds: 420 + ((i * 13) % 90),
      topSpeed: Number((9.2 + ((i * 5) % 7) * 0.35).toFixed(1)),
      title: titles[i % titles.length]!,
    });
  });
  return out.sort((a, b) => (a.date < b.date ? 1 : -1));
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
    runs: seedRuns(),
    unlocked: ["rig-rpg", "rig-vhs"],
    adventurerNotes: "Chased the sunset through the east side. Boss defeated at mile 4.",
    activeCity: "london",
    unlockedCities: ["london"],
    homeGame: "jumpman",
    profile: {
      name: "Adele Roberts",
      autoSync: true,
      homeCity: "London, UK",
    },
    settings: {
      notifications: true,
      stravaSync: true,
      avatarConsent: true,
      audio: false,
    },
  };
}

const STORAGE_KEY = "eight-bit-runner-state-v1";

type Ctx = {
  state: GameState;
  hydrated: boolean;
  logHabit: (id: HabitId) => void;
  spendTokens: (amount: number, unlockId: string) => boolean;
  setNotes: (value: string) => void;
  setActiveCity: (id: string) => void;
  unlockCity: (id: string, cost: number) => boolean;
  setHomeGame: (game: HomeGame) => void;
  toggleSetting: (key: keyof GameState["settings"]) => void;
  addRun: (run: RunEntry) => void;
  updateProfile: (patch: Partial<GameState["profile"]>) => void;
};

const GameStateContext = createContext<Ctx | null>(null);

export function GameStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(() => createInitialState());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...createInitialState(), ...(JSON.parse(raw) as GameState) });
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

  const toggleSetting = useCallback((key: keyof GameState["settings"]) => {
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

  const updateProfile = useCallback((patch: Partial<GameState["profile"]>) => {
    setState((prev) => ({ ...prev, profile: { ...prev.profile, ...patch } }));
  }, []);

  const value = useMemo(
    () => ({
      state,
      hydrated,
      logHabit,
      spendTokens,
      setNotes,
      setActiveCity,
      unlockCity,
      toggleSetting,
      addRun,
      updateProfile,
    }),
    [
      state,
      hydrated,
      logHabit,
      spendTokens,
      setNotes,
      setActiveCity,
      unlockCity,
      toggleSetting,
      addRun,
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

/**
 * Life Force is derived, not stored: 65% comes from weekly workout volume
 * synced from Strava, 35% from daily Hydrate / Sleep / Recovery check-ins.
 */
export function lifeForce(state: GameState) {
  const runPart = Math.min(1, weeklyMiles(state.runs) / WEEKLY_GOAL_MILES) * 65;
  const maxCheckIns = HABITS.length * 7;
  const habitPart = Math.min(1, weeklyCheckIns(state.habitLog) / maxCheckIns) * 35;
  return Math.round(runPart + habitPart);
}

export const BASE_WEEKLY_PAYOUT = 120;

/** Higher Life Force multiplies the weekly Arcade Token payout (1x – 2x). */
export function weeklyPayout(lf: number) {
  return Math.round(BASE_WEEKLY_PAYOUT * (1 + lf / 100));
}
