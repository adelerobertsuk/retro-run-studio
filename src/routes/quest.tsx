import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Check, ChevronRight, Footprints, Plus, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { toast } from "sonner";
import { AdventurePanel } from "@/components/quest/AdventurePanel";
import { SwipeToDeleteRow } from "@/components/quest/SwipeToDeleteRow";
import { RunDetailDrawer } from "@/components/quest/RunDetailDrawer";
import { SideQuestCompleteDrawer } from "@/components/quest/SideQuestCompleteDrawer";
import { AddRunDrawer } from "@/components/quest/AddRunDrawer";
import { playSfx } from "@/lib/audio";
import {
  formatPace,
  normalizeErrand,
  todayKey,
  useGameState,
  type ErrandEntry,
  type RunEntry,
} from "@/lib/game-state";
import { errandDisplayTitle, errandTokenReward } from "@/lib/side-quest-card";

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
  const { state, removeRun, removeErrand } = useGameState();
  const [selectedRun, setSelectedRun] = useState<RunEntry | null>(null);
  const [selectedQuest, setSelectedQuest] = useState<ErrandEntry | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(
    () => () => {
      setSelectedRun(null);
      setSelectedQuest(null);
      setAddOpen(false);
    },
    [],
  );

  const today = todayKey();
  const runDates = new Set(state.runs.map((r) => r.date));
  const errandDates = new Set(
    state.errands.filter((e) => e.completed).map((e) => e.date),
  );
  const scheduledDates = new Set([
    ...state.trainingPlan,
    ...state.runs.filter((r) => r.date > today).map((r) => r.date),
  ]);

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
      ...state.errands
        .filter((e) => e.completed)
        .map((raw) => normalizeErrand(raw))
        .filter((errand) => Boolean(errand.completedAt))
        .map((errand) => ({
          kind: "errand" as const,
          date: errand.date,
          sortKey: errand.completedAt!,
          errand,
        })),
    ];
    return items.sort((a, b) => (a.sortKey < b.sortKey ? 1 : -1)).slice(0, 6);
  }, [state.runs, state.errands]);

  const upcomingRuns = state.runs.filter((r) => r.date > today).slice(0, 3);

  const deleteRun = (date: string) => {
    if (!removeRun(date)) return;
    playSfx("tap");
    toast.success("Run removed");
    setSelectedRun((run) => (run?.date === date ? null : run));
  };

  const deleteQuest = (id: string) => {
    if (!removeErrand(id)) return;
    playSfx("tap");
    toast.success("Quest removed");
    setSelectedQuest((quest) => (quest?.id === id ? null : quest));
  };

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
            const scheduled = scheduledDates.has(key);
            const isToday = key === today;
            const isFuture = key > today;
            const both = ran && adventured;

            let cellClass =
              "flex size-9 items-center justify-center rounded-xl border text-[12px] font-medium tabular-nums ";
            let cellStyle: CSSProperties | undefined;

            if (both) {
              cellClass += "border-primary/45 text-foreground";
              cellStyle = {
                background:
                  "conic-gradient(from 225deg, hsl(var(--primary) / 0.24) 0deg 180deg, hsl(var(--accent) / 0.2) 180deg 360deg)",
              };
            } else if (ran) {
              cellClass += "border-primary/40 bg-primary/15 text-primary";
            } else if (adventured) {
              cellClass += "border-accent/40 bg-accent/10 text-accent-glow";
            } else if (scheduled) {
              cellClass += "border-violet-400/45 bg-violet-500/12 text-violet-300";
            } else if (isToday) {
              cellClass += "border-border bg-elevated text-foreground";
            } else if (isFuture) {
              cellClass += "border-transparent bg-transparent text-muted-foreground/50";
            } else {
              cellClass += "border-border/60 bg-elevated/50 text-muted-foreground";
            }

            return (
              <div key={key} className="relative flex flex-col items-center gap-1 py-1">
                <div className={cellClass} style={cellStyle}>
                  {both ? (
                    <span className="flex items-center gap-0.5">
                      <Check className="size-3" strokeWidth={2.5} />
                      <Sparkles className="size-2.5" strokeWidth={2} />
                    </span>
                  ) : ran ? (
                    <Check className="size-4" strokeWidth={2.5} />
                  ) : adventured ? (
                    <Sparkles className="size-3.5" strokeWidth={2} />
                  ) : scheduled ? (
                    <CalendarDays className="size-3.5" strokeWidth={2} />
                  ) : (
                    day
                  )}
                </div>
                {scheduled && (ran || adventured) && !both && (
                  <span
                    className="absolute -right-0.5 -top-0.5 size-2 rounded-full border border-violet-300/60 bg-violet-500"
                    aria-hidden
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
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
          <span className="flex items-center gap-1">
            <span className="inline-flex size-3.5 items-center justify-center rounded border border-violet-400/45 bg-violet-500/12">
              <CalendarDays className="size-2 text-violet-300" strokeWidth={2} />
            </span>
            Training plan
          </span>
          <span className="flex items-center gap-1">
            <span
              className="inline-block size-3.5 rounded border border-primary/40"
              style={{
                background:
                  "conic-gradient(from 225deg, hsl(var(--primary) / 0.35) 0deg 180deg, hsl(var(--accent) / 0.3) 180deg 360deg)",
              }}
            />
            Both
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
              No entries yet
            </li>
          )}
          {journey.map((item) =>
            item.kind === "run" ? (
              <li key={`run-${item.run.date}-${item.run.title}`}>
                {item.run.manual ? (
                  <SwipeToDeleteRow
                    onDelete={() => deleteRun(item.run.date)}
                    deleteLabel={`Remove run: ${item.run.title}`}
                    className="rounded-2xl"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        playSfx("tap");
                        setSelectedRun(item.run);
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
                  </SwipeToDeleteRow>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      playSfx("tap");
                      setSelectedRun(item.run);
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
                )}
              </li>
            ) : (
              <li key={item.errand.id}>
                <SwipeToDeleteRow
                  onDelete={() => deleteQuest(item.errand.id)}
                  deleteLabel={`Remove quest: ${item.errand.text}`}
                  className="rounded-2xl"
                >
                  <button
                    type="button"
                    onClick={() => {
                      playSfx("tap");
                      setSelectedQuest(normalizeErrand(item.errand));
                    }}
                    className="flex w-full items-center justify-between rounded-2xl border border-border bg-surface p-3.5 text-left transition-colors hover:bg-elevated"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex size-8 items-center justify-center rounded-lg bg-accent/15 text-accent-glow">
                        <Sparkles className="size-4" />
                      </div>
                      <div>
                        <p className="text-[14px] font-medium text-foreground">
                          {errandDisplayTitle(item.errand)}
                        </p>
                        <p className="text-[12px] text-muted-foreground">
                          {new Date(`${item.errand.date}T12:00:00`).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          · quest
                        </p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 text-[13px] font-semibold tabular-nums text-primary">
                      +{errandTokenReward(item.errand)}
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </span>
                  </button>
                </SwipeToDeleteRow>
              </li>
            ),
          )}
        </ul>
      </section>

      <RunDetailDrawer run={selectedRun} onOpenChange={(open) => !open && setSelectedRun(null)} />
      <SideQuestCompleteDrawer
        errand={selectedQuest}
        viewOnly
        onOpenChange={(open) => !open && setSelectedQuest(null)}
      />
      <AddRunDrawer open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
