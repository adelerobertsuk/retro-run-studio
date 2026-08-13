export type RunEntry = {
  date: string; // yyyy-mm-dd
  miles: number;
  paceSeconds: number; // per mile
  topSpeed: number; // mph
  title: string;
  /** Logged via Quest → Log run (not synced workouts). */
  manual?: boolean;
};

export type WorkoutDataSource = "mock" | "strava";

export type WorkoutSyncMeta = {
  source: WorkoutDataSource;
  lastSyncedAt: string | null;
  lastError: string | null;
  usedFallback: boolean;
};

export type WorkoutSyncResult = {
  runs: RunEntry[];
  meta: WorkoutSyncMeta;
};

/** Raw Strava activity shape (subset of API v3). */
export type StravaActivity = {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  start_date: string;
  start_date_local: string;
  max_speed?: number;
  average_speed?: number;
  type: string;
};
