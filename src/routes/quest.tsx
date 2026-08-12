import { createFileRoute } from "@tanstack/react-router";
import { Check, ChevronRight, Flame } from "lucide-react";
import { useState } from "react";
import { RunDetailDrawer } from "@/components/quest/RunDetailDrawer";
import {
  currentStreak,
  formatPace,
  todayKey,
  useGameState,
  weeklyMiles,
  WEEKLY_GOAL_MILES,
  type RunEntry,
} from "@/lib/game-state";

export const Route = createFileRoute("/quest")({
  head: () => ({
    meta: [
      { title: "Quest Tracker — 8-Bit Runner" },
      {
        name: "description",
        content:
          "Track daily run streaks on a glowing retro calendar and chase your weekly distance goal.",
      },
      { property: "og:title", content: "Quest Tracker — 8-Bit Runner" },
      {
        property: "og:description",
        content: "Daily run streaks, glowing retro checkmarks, and weekly distance goals.",
      },
    ],
  }),
  component: QuestPage,
});

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function QuestPage() {
  const { state } = useGameState();
  const [selected, setSelected] = useState<RunEntry | null>(null);
  const runDates = new Set(state.runs.map((r) => r.date));
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const leading = monthStart.getDay();
  const miles = weeklyMiles(state.runs);
  const pct = Math.min(100, (miles / WEEKLY_GOAL_MILES) * 100);
  const streak = currentStreak(state.runs);

  return (
    <div className="space-y-6 px-5 py-5">
      <section className="rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-accent/20 text-accent-glow">
            <Flame className="size-5" />
          </div>
          <div>
            <p className="text-[12px] text-muted-foreground">Current streak</p>
            <p className="text-[22px] font-semibold tracking-tight text-foreground">
              {streak} day{streak === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[15px] font-semibold text-foreground">Weekly distance goal</h2>
          <span className="text-[13px] font-semibold tabular-nums text-primary">
            {miles.toFixed(1)} / {WEEKLY_GOAL_MILES} mi
          </span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-elevated">
          <div
            className="h-full rounded-full"
            style={{ width: `${pct}%`, backgroundImage: "var(--gradient-energy)" }}
          />
        </div>
        <p className="mt-2 text-[12px] text-muted-foreground">
          {Math.max(0, WEEKLY_GOAL_MILES - miles).toFixed(1)} miles left to clear this week's quest.
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-[15px] font-semibold text-foreground">
          {now.toLocaleString("en-US", { month: "long", year: "numeric" })}
        </h2>
        <div className="mt-4 grid grid-cols-7 gap-y-2 text-center">
          {WEEKDAYS.map((d, i) => (
            <span key={i} className="text-[11px] font-medium text-muted-foreground">
              {d}
            </span>
          ))}
          {Array.from({ length: leading }).map((_, i) => (
            <span key={`pad-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const key = todayKey(new Date(now.getFullYear(), now.getMonth(), day, 12));
            const ran = runDates.has(key);
            const isToday = key === todayKey();
            return (
              <div key={key} className="flex flex-col items-center gap-1 py-1">
                <div
                  className={`flex size-9 items-center justify-center rounded-xl border text-[12px] font-medium tabular-nums ${
                    ran
                      ? "border-primary/40 bg-primary/15 text-primary shadow-[0_0_16px_-4px_var(--primary)]"
                      : isToday
                        ? "border-accent/50 bg-accent/10 text-accent-glow"
                        : "border-border bg-elevated text-muted-foreground"
                  }`}
                >
                  {ran ? <Check className="size-4" strokeWidth={3} /> : day}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-[15px] font-semibold text-foreground">Recent runs</h2>
        <ul className="space-y-2.5">
          {state.runs.slice(0, 5).map((run) => (
            <li key={run.date}>
              <button
                type="button"
                onClick={() => setSelected(run)}
                className="flex w-full items-center justify-between rounded-2xl border border-border bg-surface p-3.5 text-left transition-colors hover:bg-elevated"
              >
                <div>
                <p className="text-[14px] font-medium text-foreground">{run.title}</p>
                <p className="text-[12px] text-muted-foreground">
                  {new Date(`${run.date}T12:00:00`).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  · {formatPace(run.paceSeconds)} /mi
                </p>
                </div>
                <span className="flex items-center gap-1 text-[14px] font-semibold tabular-nums text-primary">
                  {run.miles.toFixed(2)} mi
                  <ChevronRight className="size-4 text-muted-foreground" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <RunDetailDrawer run={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  );
}
