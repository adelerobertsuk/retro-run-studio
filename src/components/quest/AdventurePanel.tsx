import { useMemo, useState } from "react";
import { ArrowRight, Check, Circle } from "lucide-react";
import { toast } from "sonner";
import { playSfx } from "@/lib/audio";
import { todayKey, useGameState, type ErrandEntry } from "@/lib/game-state";
import { SideQuestCompleteDrawer } from "./SideQuestCompleteDrawer";

export function AdventurePanel() {
  const { state, addErrand } = useGameState();
  const [draft, setDraft] = useState("");
  const [completing, setCompleting] = useState<ErrandEntry | null>(null);
  const today = todayKey();

  const { visiblePending, visibleDone, hiddenDoneCount } = useMemo(() => {
    const todayErrands = state.errands.filter((e) => e.date === today);
    const pending = todayErrands.filter((e) => !e.completed);
    const done = todayErrands.filter((e) => e.completed);
    return {
      visiblePending: pending,
      visibleDone: done.slice(0, 3),
      hiddenDoneCount: Math.max(0, done.length - 3),
    };
  }, [state.errands, today]);

  const submit = () => {
    if (!addErrand(draft)) return;
    playSfx("tap");
    toast.success("Quest added");
    setDraft("");
  };

  return (
    <>
      <section className="rounded-2xl border border-dashed border-accent/35 bg-surface p-4">
        <p className="cyoa-eyebrow font-pixel text-[9px] text-accent-glow">
          CHOOSE YOUR OWN ADVENTURE
        </p>
        <h2 className="mt-2 text-[15px] font-semibold leading-snug text-foreground">
          What small quest calls to you today?
        </h2>

        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="e.g., walk to the shop"
            className="min-w-0 flex-1 rounded-xl border border-border bg-elevated px-3.5 py-2.5 text-[14px] text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-primary/50"
          />
          <button
            type="button"
            onClick={submit}
            disabled={!draft.trim()}
            className="flex shrink-0 items-center gap-1 rounded-xl border border-primary/40 bg-primary/15 px-3.5 py-2.5 text-[13px] font-semibold text-primary transition-colors hover:bg-primary/20 disabled:opacity-40"
          >
            Add
            <ArrowRight className="size-3.5" />
          </button>
        </div>

        {(visiblePending.length > 0 || visibleDone.length > 0) && (
          <ul className="mt-3 space-y-1.5">
            {visiblePending.map((errand) => (
              <ErrandRow
                key={errand.id}
                errand={errand}
                onComplete={() => {
                  playSfx("tap");
                  setCompleting(errand);
                }}
              />
            ))}
            {visibleDone.map((errand) => (
              <ErrandRow key={errand.id} errand={errand} />
            ))}
          </ul>
        )}
        {hiddenDoneCount > 0 && (
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Older completed quests are in your journey log
          </p>
        )}
      </section>

      <SideQuestCompleteDrawer
        errand={completing}
        onOpenChange={(open) => !open && setCompleting(null)}
      />
    </>
  );
}

function ErrandRow({
  errand,
  onComplete,
}: {
  errand: ErrandEntry;
  onComplete?: () => void;
}) {
  const completed = errand.completed;

  return (
    <li
      className={`flex items-start gap-2 rounded-xl border px-3 py-2 ${
        completed
          ? "border-border/40 bg-background/30 opacity-80"
          : "border-border/60 bg-background/40"
      }`}
    >
      {completed ? (
        <Check className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={2.5} />
      ) : (
        <button
          type="button"
          aria-label={`Complete quest: ${errand.text}`}
          onClick={onComplete}
          className="mt-0.5 shrink-0 text-muted-foreground transition-colors hover:text-primary"
        >
          <Circle className="size-4" strokeWidth={2} />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <p
          className={`text-[13px] ${completed ? "text-muted-foreground line-through" : "text-foreground"}`}
        >
          {errand.text}
        </p>
      </div>
    </li>
  );
}
