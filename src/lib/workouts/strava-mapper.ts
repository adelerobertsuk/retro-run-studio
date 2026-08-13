import type { RunEntry, StravaActivity } from "@/lib/workouts/types";

const METERS_PER_MILE = 1609.344;
const MS_TO_MPH = 2.23694;

function dateKeyFromActivity(activity: StravaActivity): string {
  const local = activity.start_date_local ?? activity.start_date;
  return local.slice(0, 10);
}

/** Map a Strava activity payload into our app run model. */
export function mapStravaActivity(activity: StravaActivity): RunEntry | null {
  if (!activity.distance || activity.distance <= 0) return null;
  const miles = activity.distance / METERS_PER_MILE;
  if (miles < 0.05) return null;

  const paceSeconds =
    miles > 0 ? Math.round(activity.moving_time / miles) : activity.moving_time;
  const topSpeed = activity.max_speed
    ? Number((activity.max_speed * MS_TO_MPH).toFixed(1))
    : activity.average_speed
      ? Number((activity.average_speed * MS_TO_MPH).toFixed(1))
      : 0;

  return {
    date: dateKeyFromActivity(activity),
    miles: Number(miles.toFixed(2)),
    paceSeconds,
    topSpeed,
    title: activity.name?.trim() || "Strava Run",
  };
}

export function mapStravaActivities(activities: StravaActivity[]): RunEntry[] {
  const byDate = new Map<string, RunEntry>();
  for (const activity of activities) {
    const run = mapStravaActivity(activity);
    if (!run) continue;
    const existing = byDate.get(run.date);
    if (!existing || run.miles > existing.miles) {
      byDate.set(run.date, run);
    }
  }
  return [...byDate.values()].sort((a, b) => (a.date < b.date ? 1 : -1));
}
