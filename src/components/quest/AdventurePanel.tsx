import { useState } from "react";
import { ArrowRight, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { playSfx } from "@/lib/audio";
import {
  ERRAND_TOKEN_REWARD,
  todayKey,
  useGameState,
  type ErrandEntry,
} from "@/lib/game-state";

const SUGGESTIONS = [
  "walk to the shop",
  "stretch for ten minutes",
  "take the scenic route home",
  "climb the stairs instead",
];

export function AdventurePanel() {
  const { state, addErrand } = useGameState();
  const [draft, setDraft] = useState("");
  const today = todayKey();

  const todayErrands = state.errands.filter((e) => e.date === today);
  const todayCoins = todayErrands.reduce((sum, e) => sum + e.tokens, 0);

  const submit = () => {
    if (!addErrand(draft)) return;
    playSfx("complete");
    toast.success("Adventure logged", {
      description: `+${ERRAND_TOKEN_REWARD} Arcade Tokens · Life Force nudged up.`,
    });
    setDraft("");
  };

  return (
    <section className="rounded-2xl border border-dashed border-accent/35 bg-surface p-4">
      <p className="font-pixel text-[8px] leading-relaxed tracking-wide text-accent-glow">
        CHOOSE YOUR OWN ADVENTURE
      </p>
      <h2 className="mt-2 text-[15px] font-semibold leading-snug text-foreground">
        What small quest calls to you today?
      </h2>
      <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
        Type a daily errand or micro-adventure — no pressure, just your path. Each one earns coins
        and a gentle power-up.
      </p>

      <div className="mt-4 flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="e.g. walk to the shop"
          className="min-w-0 flex-1 rounded-xl border border-border bg-elevated px-3.5 py-2.5 text-[14px] text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-primary/50"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!draft.trim()}
          className="flex shrink-0 items-center gap-1 rounded-xl border border-primary/40 bg-primary/15 px-3.5 py-2.5 text-[13px] font-semibold text-primary transition-colors hover:bg-primary/20 disabled:opacity-40"
        >
          Go
          <ArrowRight className="size-3.5" />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((idea) => (
          <button
            key={idea}
            type="button"
            onClick={() => {
              playSfx("tap");
              setDraft(idea);
            }}
            className="rounded-full border border-border bg-elevated px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
          >
            {idea}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl bg-elevated/60 px-3 py-2">
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Zap className="size-3.5 text-primary" />
          Today's coins
        </span>
        <span className="text-[13px] font-semibold tabular-nums text-primary">+{todayCoins}</span>
      </div>

      {todayErrands.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {todayErrands.map((errand) => (
            <ErrandRow key={errand.id} errand={errand} />
          ))}
        </ul>
      )}
    </section>
  );
}

function ErrandRow({ errand }: { errand: ErrandEntry }) {
  return (
    <li className="flex items-start gap-2 rounded-xl border border-border/60 bg-background/40 px-3 py-2">
      <Sparkles className="mt-0.5 size-3.5 shrink-0 text-accent-glow" />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] text-foreground">{errand.text}</p>
        <p className="text-[11px] text-muted-foreground">
          +{errand.tokens} coins ·{" "}
          {new Date(errand.completedAt).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
      </div>
    </li>
  );
}
