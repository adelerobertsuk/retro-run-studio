import { createFileRoute } from "@tanstack/react-router";
import { Check, Zap } from "lucide-react";
import { toast } from "sonner";
import { STORE_ITEMS } from "@/lib/rigs";
import { useGameState } from "@/lib/game-state";

export const Route = createFileRoute("/arcade")({
  head: () => ({
    meta: [
      { title: "Arcade Store — Unlock Rigs With Tokens" },
      {
        name: "description",
        content:
          "Spend Arcade Tokens on camera rigs, trading card skins and video effects for your 8-bit run media.",
      },
      { property: "og:title", content: "Arcade Store — Unlock Rigs With Tokens" },
      {
        property: "og:description",
        content: "Camera rigs, card skins and video effects, unlocked with Arcade Tokens.",
      },
    ],
  }),
  component: ArcadePage,
});

const CATEGORIES = ["Camera Rig", "Card Skin", "Video Effect"] as const;

function ArcadePage() {
  const { state, spendTokens } = useGameState();

  return (
    <div className="space-y-6 px-5 py-5">
      <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4">
        <div>
          <p className="text-[12px] text-muted-foreground">Your balance</p>
          <p className="text-[24px] font-semibold tabular-nums text-foreground">
            {state.tokens.toLocaleString()}
          </p>
        </div>
        <div className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Zap className="size-5" />
        </div>
      </div>

      {CATEGORIES.map((category) => (
        <section key={category}>
          <h2 className="mb-3 text-[15px] font-semibold text-foreground">{category}s</h2>
          <div className="grid grid-cols-2 gap-3">
            {STORE_ITEMS.filter((i) => i.category === category).map((item) => {
              const owned = state.unlocked.includes(item.id) || item.tokens === 0;
              const affordable = state.tokens >= item.tokens;
              return (
                <div
                  key={item.id}
                  className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-3.5"
                >
                  <div>
                    <div className="mb-3 flex h-20 items-center justify-center rounded-xl bg-elevated">
                      <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                        {category.split(" ")[0]}
                      </span>
                    </div>
                    <p className="text-[13px] font-semibold text-foreground">{item.name}</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={owned || !affordable}
                    onClick={() => {
                      if (spendTokens(item.tokens, item.id)) {
                        toast.success(`${item.name} unlocked`);
                      }
                    }}
                    className={`mt-3 flex items-center justify-center gap-1.5 rounded-xl py-2 text-[12px] font-semibold transition-opacity ${
                      owned
                        ? "bg-primary/15 text-primary"
                        : affordable
                          ? "bg-primary text-primary-foreground"
                          : "bg-elevated text-muted-foreground"
                    }`}
                  >
                    {owned ? (
                      <>
                        <Check className="size-3.5" /> Owned
                      </>
                    ) : (
                      `Unlock for ${item.tokens}`
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
