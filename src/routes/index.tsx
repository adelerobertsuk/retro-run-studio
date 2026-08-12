import { createFileRoute } from "@tanstack/react-router";
import { Droplets, Flame, HeartPulse, Moon, Zap } from "lucide-react";
import { HeroViewport } from "@/components/app/HeroViewport";
import {
  HABITS,
  currentStreak,
  todayKey,
  useGameState,
  weeklyMiles,
  WEEKLY_GOAL_MILES,
} from "@/lib/game-state";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "8-Bit Runner — Turn Your Runs Into Arcade Legends" },
      {
        name: "description",
        content:
          "Track runs and daily habits, charge your Life Force, and earn Arcade Tokens in a retro 8-bit fitness companion.",
      },
      { property: "og:title", content: "8-Bit Runner — Turn Your Runs Into Arcade Legends" },
      {
        property: "og:description",
        content:
          "Track runs and daily habits, charge your Life Force, and earn Arcade Tokens in a retro 8-bit fitness companion.",
      },
    ],
  }),
  component: HomePage,
});

const HABIT_ICONS = { hydrate: Droplets, sleep: Moon, recovery: HeartPulse } as const;

function HomePage() {
  const { state, logHabit } = useGameState();
  const done = state.habitLog[todayKey()] ?? [];
  const streak = currentStreak(state.runs);
  const miles = weeklyMiles(state.runs);

  return (
    <div className="space-y-6 px-5 py-5">
      <section className="flex items-center gap-3">
        <div className="flex flex-1 items-center gap-3 rounded-2xl border border-border bg-surface p-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Zap className="size-[18px]" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Arcade Tokens</p>
            <p className="text-[17px] font-semibold tabular-nums text-foreground">
              {state.tokens.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex flex-1 items-center gap-3 rounded-2xl border border-border bg-surface p-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-accent/20 text-accent-glow">
            <Flame className="size-[18px]" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Run Streak</p>
            <p className="text-[17px] font-semibold tabular-nums text-foreground">{streak} days</p>
          </div>
        </div>
      </section>

      <HeroViewport label="Neon District — Level 4" />

      <section className="rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[15px] font-semibold text-foreground">Life Force</h2>
          <span className="text-[13px] font-semibold tabular-nums text-primary">
            {state.lifeForce}%
          </span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-elevated">
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{ width: `${state.lifeForce}%`, backgroundImage: "var(--gradient-energy)" }}
          />
        </div>
        <p className="mt-2 text-[12px] text-muted-foreground">
          {miles.toFixed(1)} of {WEEKLY_GOAL_MILES} miles this week. Log habits to top up energy.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-[15px] font-semibold text-foreground">Daily check-in</h2>
        <div className="space-y-2.5">
          {HABITS.map((habit) => {
            const Icon = HABIT_ICONS[habit.id];
            const complete = done.includes(habit.id);
            return (
              <button
                key={habit.id}
                type="button"
                onClick={() => logHabit(habit.id)}
                disabled={complete}
                className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface p-3.5 text-left transition-colors enabled:hover:bg-elevated disabled:opacity-70"
              >
                <div
                  className={`flex size-10 items-center justify-center rounded-xl ${
                    complete ? "bg-primary/20 text-primary" : "bg-elevated text-muted-foreground"
                  }`}
                >
                  <Icon className="size-5" />
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-medium text-foreground">{habit.label}</p>
                  <p className="text-[12px] text-muted-foreground">{habit.detail}</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    complete ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent-glow"
                  }`}
                >
                  {complete ? "Logged" : `+${habit.reward}`}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
