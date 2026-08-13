import { createFileRoute } from "@tanstack/react-router";
import { mapStravaActivities } from "@/lib/workouts/strava-mapper";
import type { StravaActivity } from "@/lib/workouts/types";

const STRAVA_API = "https://www.strava.com/api/v3";

export const Route = createFileRoute("/api/strava/activities")({
  server: {
    handlers: {
      GET: async () => {
        const token = process.env["STRAVA_ACCESS_TOKEN"];
        if (!token) {
          return Response.json(
            {
              error:
                "STRAVA_ACCESS_TOKEN is not configured. Add it to your server env for live sync.",
            },
            { status: 503 },
          );
        }

        const url = new URL(`${STRAVA_API}/athlete/activities`);
        url.searchParams.set("per_page", "30");
        url.searchParams.set("page", "1");

        const upstream = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!upstream.ok) {
          const body = await upstream.text();
          return new Response(body || upstream.statusText, { status: upstream.status });
        }

        const activities = (await upstream.json()) as StravaActivity[];
        const runs = mapStravaActivities(activities);

        return Response.json({
          activities,
          runs,
          count: runs.length,
        });
      },
    },
  },
});
