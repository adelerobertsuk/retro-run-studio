export type {
  RunEntry,
  StravaActivity,
  WorkoutDataSource,
  WorkoutSyncMeta,
  WorkoutSyncResult,
} from "@/lib/workouts/types";
export { generateMockWorkouts } from "@/lib/workouts/mock-workouts";
export { mapStravaActivity, mapStravaActivities } from "@/lib/workouts/strava-mapper";
export {
  fetchWorkouts,
  resolveWorkoutSource,
  type WorkoutServiceOptions,
} from "@/lib/workouts/workout-service";
