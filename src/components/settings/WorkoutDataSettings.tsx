import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { playSfx } from "@/lib/audio";
import { useGameState, type WorkoutDataSource } from "@/lib/game-state";
import { Switch } from "@/components/ui/switch";

const SOURCES: { id: WorkoutDataSource; label: string; hint: string }[] = [
  { id: "mock", label: "Mock data", hint: "Local generator — great for testing" },
  { id: "strava", label: "Live Strava", hint: "Pull workouts from the Strava API" },
];

function formatSyncedAt(iso: string | null) {
  if (!iso) return "Not synced yet";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function WorkoutDataSettings() {
  const {
    state,
    workoutSyncing,
    setWorkoutDataSource,
    syncWorkouts,
    toggleSetting,
  } = useGameState();
  const { settings, workoutSync } = state;
  const effectiveSource =
    settings.stravaSync && settings.workoutDataSource === "strava" ? "strava" : "mock";

  const handleSync = async () => {
    playSfx("tap");
    const result = await syncWorkouts();
    if (result.meta.usedFallback) {
      toast.warning("Using mock workouts", {
        description: result.meta.lastError ?? "Strava was unavailable.",
      });
      return;
    }
    toast.success(
      effectiveSource === "strava" ? "Strava workouts synced" : "Mock workouts refreshed",
      { description: `${result.runs.length} runs loaded.` },
    );
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="border-b border-border px-4 py-3.5">
        <p className="text-[14px] font-medium text-foreground">Workout data</p>
        <p className="text-[12px] text-muted-foreground">
          Mock generator for local dev, or live Strava when connected.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3.5">
        <div>
          <p className="text-[14px] font-medium text-foreground">Strava account sync</p>
          <p className="text-[12px] text-muted-foreground">Required for live workout import</p>
        </div>
        <Switch
          checked={settings.stravaSync}
          onCheckedChange={(on) => {
            playSfx("tap");
            toggleSetting("stravaSync");
            if (on) void syncWorkouts();
          }}
          aria-label="Strava account sync"
        />
      </div>

      <div className="border-b border-border px-4 py-3.5">
        <p className="text-[12px] font-medium text-muted-foreground">Data source</p>
        <div className="mt-2 grid grid-cols-2 gap-1.5 rounded-xl bg-elevated p-1">
          {SOURCES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                playSfx("tap");
                setWorkoutDataSource(s.id);
                void syncWorkouts();
              }}
              aria-pressed={settings.workoutDataSource === s.id}
              className={`rounded-lg px-2 py-2 text-left transition-colors ${
                settings.workoutDataSource === s.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="block text-[13px] font-medium">{s.label}</span>
              <span
                className={`block text-[10px] leading-snug ${
                  settings.workoutDataSource === s.id
                    ? "text-primary-foreground/80"
                    : "text-muted-foreground"
                }`}
              >
                {s.hint}
              </span>
            </button>
          ))}
        </div>
        {settings.workoutDataSource === "strava" && !settings.stravaSync && (
          <p className="mt-2 text-[11px] text-amber-400/90">
            Turn on Strava sync above to use live data — mock fallback applies until then.
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 px-4 py-3.5">
        <div className="min-w-0">
          <p className="text-[12px] text-muted-foreground">Active source</p>
          <p className="text-[13px] font-medium capitalize text-foreground">
            {effectiveSource === "strava" ? "Live Strava" : "Mock generator"}
            {workoutSync.usedFallback ? " (fallback)" : ""}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Last sync · {formatSyncedAt(workoutSync.lastSyncedAt)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleSync()}
          disabled={workoutSyncing}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2.5 text-[12px] font-semibold text-primary-foreground disabled:opacity-60"
        >
          {workoutSyncing ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RefreshCw className="size-3.5" />
          )}
          Sync now
        </button>
      </div>
    </section>
  );
}
