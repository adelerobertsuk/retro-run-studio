import { generateMockWorkouts } from "@/lib/workouts/mock-workouts";
import { mapStravaActivities } from "@/lib/workouts/strava-mapper";
import type {
  RunEntry,
  WorkoutDataSource,
  WorkoutSyncMeta,
  WorkoutSyncResult,
  StravaActivity,
} from "@/lib/workouts/types";

export type WorkoutServiceOptions = {
  /** When Strava fails, return mock data instead of throwing. Default true. */
  fallbackToMock?: boolean;
};

async function fetchStravaActivities(): Promise<RunEntry[]> {
  const res = await fetch("/api/strava/activities", {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text || `Strava sync failed (${res.status})`);
  }
  const payload = (await res.json()) as { activities: StravaActivity[] };
  const runs = mapStravaActivities(payload.activities ?? []);
  if (runs.length === 0) {
    throw new Error("No Strava runs found for this athlete.");
  }
  return runs;
}

function meta(
  source: WorkoutDataSource,
  usedFallback: boolean,
  lastError: string | null,
): WorkoutSyncMeta {
  return {
    source,
    lastSyncedAt: new Date().toISOString(),
    lastError,
    usedFallback,
  };
}

/** Resolve workouts from the selected data source. */
export async function fetchWorkouts(
  source: WorkoutDataSource,
  options: WorkoutServiceOptions = {},
): Promise<WorkoutSyncResult> {
  const { fallbackToMock = true } = options;

  if (source === "mock") {
    return {
      runs: generateMockWorkouts(),
      meta: meta("mock", false, null),
    };
  }

  try {
    const runs = await fetchStravaActivities();
    return {
      runs,
      meta: meta("strava", false, null),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Strava sync failed";
    if (!fallbackToMock) {
      return {
        runs: [],
        meta: meta("strava", false, message),
      };
    }
    return {
      runs: generateMockWorkouts(),
      meta: meta("mock", true, message),
    };
  }
}

/**
 * Pick the effective source: Strava only when both the user enables sync
 * and selects live Strava as the workout data source.
 */
export function resolveWorkoutSource(
  stravaSyncEnabled: boolean,
  dataSource: WorkoutDataSource,
): WorkoutDataSource {
  if (dataSource === "strava" && stravaSyncEnabled) return "strava";
  return "mock";
}
