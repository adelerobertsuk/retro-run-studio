import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { StoreItemCard } from "@/components/arcade/StoreItemCard";
import { STORE_CATEGORIES, STORE_ITEMS } from "@/lib/arcade-store";
import { playSfx } from "@/lib/audio";
import { useGameState } from "@/lib/game-state";

export const Route = createFileRoute("/arcade")({
  head: () => ({
    meta: [
      { title: "Arcade Shop — 8-Bit Runner" },
      {
        name: "description",
        content:
          "Spend Arcade Tokens on retro UI palettes, themes, avatar styles, and Media Lab unlocks.",
      },
      { property: "og:title", content: "Arcade Shop — 8-Bit Runner" },
      {
        property: "og:description",
        content: "Unlock Sega Blue, GameBoy Green, Neon Arcade palettes and more.",
      },
    ],
  }),
  component: ArcadePage,
});

function ArcadePage() {
  const { state, purchaseStoreItem } = useGameState();
  const [justUnlocked, setJustUnlocked] = useState<string | null>(null);

  const handleAction = (id: string) => {
    const item = STORE_ITEMS.find((i) => i.id === id);
    if (!item) return;

    const owned = state.unlocked.includes(item.id) || item.tokens === 0;
    const equipped = item.loadoutKey
      ? state.loadout[item.loadoutKey] === item.id
      : owned;

    if (equipped) return;

    const result = purchaseStoreItem(id);
    if (!result) {
      playSfx("tap");
      toast.error("Not enough coins", { description: "Keep running and completing quests!" });
      return;
    }

    if (result === "unlock") {
      setJustUnlocked(id);
      playSfx("complete");
      toast.success(`${item.name} unlocked!`, {
        description: item.loadoutKey ? "Equipped and ready to go." : "Available in Media Lab.",
      });
      window.setTimeout(() => setJustUnlocked((cur) => (cur === id ? null : cur)), 900);
    } else {
      toast.success(`${item.name} equipped`);
    }
  };

  return (
    <div className="space-y-6 px-5 py-5">
      <section className="relative overflow-hidden rounded-2xl border border-primary/30 bg-surface p-4">
        <div
          className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full opacity-30 blur-2xl"
          style={{ background: "var(--primary)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-6 left-8 size-24 rounded-full opacity-20 blur-2xl"
          style={{ background: "var(--accent)" }}
        />
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <p className="font-pixel text-[8px] tracking-wide text-accent-glow">ARCADE TOKENS</p>
            <p className="mt-1.5 text-[32px] font-bold tabular-nums leading-none text-foreground">
              {state.tokens.toLocaleString()}
            </p>
            <p className="mt-1.5 text-[12px] text-muted-foreground">
              Earn coins from runs, quests &amp; micro-adventures
            </p>
          </div>
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/20 text-primary shadow-[0_0_24px_-6px_var(--primary)]">
            <Zap className="size-7" />
          </div>
        </div>
      </section>

      <p className="flex items-center gap-2 text-[12px] text-muted-foreground">
        <Sparkles className="size-3.5 text-primary" />
        Tap to unlock — palettes and themes equip instantly.
      </p>

      {STORE_CATEGORIES.map((category) => (
        <section key={category}>
          <h2 className="mb-3 text-[15px] font-semibold text-foreground">{category}</h2>
          <div className="grid grid-cols-2 gap-3">
            {STORE_ITEMS.filter((i) => i.category === category).map((item) => (
              <StoreItemCard
                key={item.id}
                item={item}
                tokens={state.tokens}
                unlocked={state.unlocked}
                loadout={state.loadout}
                justUnlocked={justUnlocked === item.id}
                onAction={handleAction}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
