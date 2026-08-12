import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Flame, Footprints, HeartPulse, Moon, Zap } from "lucide-react";
import { HeroViewport } from "@/components/app/HeroViewport";
import { SnakeGame } from "@/components/app/SnakeGame";
import { TypingText } from "@/components/app/TypingText";
import { CitySelector } from "@/components/app/CitySelector";
import {
  HABITS,
  currentStreak,
  lifeForce,
  todayKey,
  useGameState,
  weeklyMiles,
  weeklyPayout,
  WEEKLY_GOAL_MILES,
} from "@/lib/game-state";
import { playSfx } from "@/lib/audio";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "8-Bit Runner" },
      {
        name: "description",
        content:
          "Track runs and daily habits, charge your Life Force, and earn Arcade Tokens in a retro 8-bit fitness companion.",
      },
      { property: "og:title", content: "8-Bit Runner" },
      {
        property: "og:description",
        content:
          "Track runs and daily habits, charge your Life Force, and earn Arcade Tokens in a retro 8-bit fitness companion.",
      },
    ],
  }),
  component: HomePage,
});

const HABIT_ICONS = { steps: Footprints, sleep: Moon, recovery: HeartPulse } as const;

function HomePage() {
  const { state } = useGameState();
  const [citiesOpen, setCitiesOpen] = useState(false);
  const streak = currentStreak(state.runs);
  const miles = weeklyMiles(state.runs);
  const lf = lifeForce(state);
  const payout = weeklyPayout(lf);

  return (
    <div className="space-y-6 px-5 py-5">
      <h1 className="text-center font-pixel text-[18px] leading-relaxed text-primary [text-shadow:0_3px_0_oklch(0.45_0.19_275),0_6px_0_oklch(0.28_0.12_275)]">
        8-BIT RUNNER
      </h1>

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

      {state.homeGame === "snake" ? (
        <SnakeGame />
      ) : (
        <HeroViewport cityId={state.activeCity} onOpenCities={() => setCitiesOpen(true)} />
      )}
      <p className="text-center font-pixel text-[9px] leading-relaxed text-accent-glow">
        <TypingText
          text={`READY PLAYER ONE — ${(state.profile.name.split(" ")[0] ?? "RUNNER").toUpperCase()}`}
          speed={80}
        />
      </p>
      <CitySelector open={citiesOpen} onOpenChange={setCitiesOpen} />

      <section className="rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[15px] font-semibold text-foreground">Life Force</h2>
          <span className="text-[13px] font-semibold tabular-nums text-primary">
            {lf}%
          </span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-elevated">
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{ width: `${lf}%`, backgroundImage: "var(--gradient-energy)" }}
          />
        </div>
        <p className="mt-2 text-[12px] text-muted-foreground">
          {miles.toFixed(1)} of {WEEKLY_GOAL_MILES} miles synced this week plus your auto-synced metrics.
        </p>
        <p className="mt-1 text-[12px] text-primary">
          Weekly payout boosted to {payout} tokens at this Life Force.
        </p>
      </section>

      <section>
        <h2 className="text-[15px] font-semibold text-foreground">Auto-Syncing Metrics</h2>
        <p className="mb-3 mt-0.5 text-[12px] text-muted-foreground">
          Pulled passively from Apple Health — nothing to tap.
        </p>
        <div className="space-y-2.5">
          {HABITS.map((habit) => {
            const Icon = HABIT_ICONS[habit.id];
            return (
              <div
                key={habit.id}
                className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface p-3.5 text-left"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Icon className="size-5" />
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-medium text-foreground">{habit.label}</p>
                  <p className="text-[12px] text-muted-foreground">{habit.detail}</p>
                </div>
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Synced
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
