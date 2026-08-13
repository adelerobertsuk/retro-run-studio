import { createFileRoute } from "@tanstack/react-router";
import { Check, ChevronRight, Footprints, Plus, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AdventurePanel } from "@/components/quest/AdventurePanel";
import { RunDetailDrawer } from "@/components/quest/RunDetailDrawer";
import { AddRunDrawer } from "@/components/quest/AddRunDrawer";
import { playSfx } from "@/lib/audio";
import {
  formatPace,
  todayKey,
  useGameState,
  type ErrandEntry,
  type RunEntry,
} from "@/lib/game-state";

export const Route = createFileRoute("/quest")({
  head: () => ({
    meta: [
      { title: "Quest — 8-Bit Runner" },
      {
        name: "description",
        content:
          "Choose your own daily micro-adventures, then glance your calendar and journey log at a relaxed pace.",
      },
      { property: "og:title", content: "Quest — 8-Bit Runner" },
      {
        property: "og:description",
        content: "80s-style choose-your-adventure errands plus a calm calendar of runs and history.",
      },
    ],
  }),
  component: QuestPage,
});

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

type JourneyItem =
  | { kind: "run"; date: string; sortKey: string; run: RunEntry }
  | { kind: "errand"; date: string; sortKey: string; errand: ErrandEntry };

function QuestPage() {
  const { state } = useGameState();
  const [selected, setSelected] = useState<RunEntry | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(
    () => () => {
      setSelected(null);
      setAddOpen(false);
    },
    [],
  );

  const runDates = new Set(state.runs.map((r) => r.date));
  const errandDates = new Set(state.errands.map((e) => e.date));
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const leading = monthStart.getDay();

  const journey = useMemo(() => {
    const items: JourneyItem[] = [
      ...state.runs.map((run) => ({
        kind: "run" as const,
        date: run.date,
        sortKey: `${run.date}T12:00:00`,
        run,
      })),
      ...state.errands.map((errand) => ({
        kind: "errand" as const,
        date: errand.date,
        sortKey: errand.completedAt,
        errand,
      })),
    ];
    return items.sort((a, b) => (a.sortKey < b.sortKey ? 1 : -1)).slice(0, 8);
  }, [state.runs, state.errands]);

  const upcomingRuns = state.runs.filter((r) => r.date > todayKey()).slice(0, 3);

  return (
    <div className="space-y-6 px-5 py-5">
      <AdventurePanel />

      <section className="rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[15px] font-semibold text-foreground">Your path</h2>
          <span className="text-[11px] text-muted-foreground">
            {now.toLocaleString("en-US", { month: "long", year: "numeric" })}
          </span>
        </div>
        <p className="mt-0.5 text-[12px] text-muted-foreground">
          Runs and micro-adventures at a glance — no streak pressure.
        </p>

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
            const adventured = errandDates.has(key);
            const isToday = key === todayKey();
            const isFuture = key > todayKey();

            return (
              <div key={key} className="flex flex-col items-center gap-1 py-1">
                <div
                  className={`flex size-9 items-center justify-center rounded-xl border text-[12px] font-medium tabular-nums ${
                    ran
                      ? "border-primary/40 bg-primary/15 text-primary"
                      : adventured
                        ? "border-accent/40 bg-accent/10 text-accent-glow"
                        : isToday
                          ? "border-border bg-elevated text-foreground"
                          : isFuture
                            ? "border-transparent bg-transparent text-muted-foreground/50"
                            : "border-border/60 bg-elevated/50 text-muted-foreground"
                  }`}
                >
                  {ran ? (
                    <Check className="size-4" strokeWidth={2.5} />
                  ) : adventured ? (
                    <Sparkles className="size-3.5" strokeWidth={2} />
                  ) : (
                    day
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex items-center gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-flex size-3.5 items-center justify-center rounded border border-primary/40 bg-primary/15">
              <Check className="size-2 text-primary" strokeWidth={3} />
            </span>
            Run
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-flex size-3.5 items-center justify-center rounded border border-accent/40 bg-accent/10">
              <Sparkles className="size-2 text-accent-glow" strokeWidth={2} />
            </span>
            Adventure
          </span>
        </div>
      </section>

      {upcomingRuns.length > 0 && (
        <section>
          <h2 className="mb-2 text-[15px] font-semibold text-foreground">On deck</h2>
          <ul className="space-y-2">
            {upcomingRuns.map((run) => (
              <li
                key={run.date}
                className="flex items-center justify-between rounded-2xl border border-border bg-surface px-3.5 py-3"
              >
                <div>
                  <p className="text-[14px] font-medium text-foreground">{run.title}</p>
                  <p className="text-[12px] text-muted-foreground">
                    {new Date(`${run.date}T12:00:00`).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <span className="text-[13px] tabular-nums text-muted-foreground">
                  {run.miles.toFixed(1)} mi
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-foreground">Journey log</h2>
          <button
            type="button"
            onClick={() => {
              playSfx("tap");
              setAddOpen(true);
            }}
            className="flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-[12px] font-semibold text-primary transition-colors hover:bg-primary/15"
          >
            <Plus className="size-3.5" />
            Log run
          </button>
        </div>
        <ul className="space-y-2.5">
          {journey.length === 0 && (
            <li className="rounded-2xl border border-dashed border-border bg-surface px-4 py-6 text-center text-[13px] text-muted-foreground">
              Your story starts with a single step — type an adventure above.
            </li>
          )}
          {journey.map((item) =>
            item.kind === "run" ? (
              <li key={`run-${item.run.date}-${item.run.title}`}>
                <button
                  type="button"
                  onClick={() => {
                    playSfx("tap");
                    setSelected(item.run);
                  }}
                  className="flex w-full items-center justify-between rounded-2xl border border-border bg-surface p-3.5 text-left transition-colors hover:bg-elevated"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                      <Footprints className="size-4" />
                    </div>
                    <div>
                      <p className="text-[14px] font-medium text-foreground">{item.run.title}</p>
                      <p className="text-[12px] text-muted-foreground">
                        {new Date(`${item.run.date}T12:00:00`).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        · {formatPace(item.run.paceSeconds)} /mi
                      </p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-[14px] font-semibold tabular-nums text-primary">
                    {item.run.miles.toFixed(2)} mi
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </span>
                </button>
              </li>
            ) : (
              <li key={item.errand.id}>
                <div className="flex w-full items-center justify-between rounded-2xl border border-border bg-surface p-3.5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-8 items-center justify-center rounded-lg bg-accent/15 text-accent-glow">
                      <Sparkles className="size-4" />
                    </div>
                    <div>
                      <p className="text-[14px] font-medium text-foreground">{item.errand.text}</p>
                      <p className="text-[12px] text-muted-foreground">
                        {new Date(`${item.errand.date}T12:00:00`).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        · micro-adventure
                      </p>
                    </div>
                  </div>
                  <span className="text-[13px] font-semibold tabular-nums text-primary">
                    +{item.errand.tokens}
                  </span>
                </div>
              </li>
            ),
          )}
        </ul>
      </section>

      <RunDetailDrawer run={selected} onOpenChange={(open) => !open && setSelected(null)} />
      <AddRunDrawer open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
