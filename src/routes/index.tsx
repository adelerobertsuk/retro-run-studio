import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Flame, Footprints, HeartPulse, Moon } from "lucide-react";
import { ArcadeCoinIcon } from "@/components/app/ArcadeCoinIcon";
import { HeroViewport } from "@/components/app/HeroViewport";
import { MetricCircle } from "@/components/app/MetricCircle";
import { SnakeGame } from "@/components/app/SnakeGame";
import { CitySelector } from "@/components/app/CitySelector";
import { RunnerLevelCard } from "@/components/app/RunnerLevelCard";
import { currentStreak, todayKey, useGameState } from "@/lib/game-state";
import { getDailyEncouragement } from "@/lib/daily-encouragement";
import { formatMetricValue, useHealthMetrics } from "@/lib/health-metrics";

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

const METRIC_CONFIG = [
  { id: "steps" as const, label: "Steps", icon: Footprints },
  { id: "sleep" as const, label: "Sleep", icon: Moon },
  { id: "recovery" as const, label: "Recovery", icon: HeartPulse },
];

function HomePage() {
  const { state } = useGameState();
  const { metrics, percents, lifeForce: lf } = useHealthMetrics();
  const [citiesOpen, setCitiesOpen] = useState(false);
  const streak = currentStreak(state.runs);
  const today = todayKey();
  const errandsToday = state.errands.filter((e) => e.date === today && e.completed).length;
  const encouragement = getDailyEncouragement({
    lifeForce: lf,
    streak,
    tokens: state.tokens,
    errandsToday,
    homeCity: state.profile.homeCity,
  });

  return (
    <div className="space-y-6 px-5 py-5">
      <section className="flex items-center gap-3">
        <div className="flex flex-1 items-center gap-3 rounded-2xl border border-border bg-surface p-3">
        <div className="flex size-11 items-center justify-center rounded-full bg-amber-500/10 ring-1 ring-amber-400/25">
            <ArcadeCoinIcon className="size-10" />
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
        <HeroViewport
          cityId={state.activeCity}
          playerName={state.profile.name}
          onOpenCities={() => setCitiesOpen(true)}
        />
      )}

      <RunnerLevelCard />
      <CitySelector open={citiesOpen} onOpenChange={setCitiesOpen} />

      <section className="rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[15px] font-semibold text-foreground">Life Force</h2>
          <span className="text-[13px] font-semibold tabular-nums text-primary">{lf}%</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-elevated">
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{ width: `${lf}%`, backgroundImage: "var(--gradient-energy)" }}
          />
        </div>

        <div className="mt-4 flex justify-between gap-1">
          {METRIC_CONFIG.map(({ id, label, icon }) => (
            <MetricCircle
              key={id}
              label={label}
              value={formatMetricValue(id, metrics)}
              percent={percents[id]}
              icon={icon}
            />
          ))}
        </div>

        <p className="mt-4 rounded-xl border border-border/60 bg-elevated/50 px-3.5 py-3 text-[13px] leading-relaxed text-muted-foreground">
          {encouragement}
        </p>
      </section>
    </div>
  );
}
