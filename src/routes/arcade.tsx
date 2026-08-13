import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { StoreItemCard } from "@/components/arcade/StoreItemCard";
import { ArcadeCoinIcon } from "@/components/app/ArcadeCoinIcon";
import { SHOP_SHELVES, STORE_ITEMS, type ShopShelf } from "@/lib/arcade-store";
import { playSfx } from "@/lib/audio";
import { useGameState } from "@/lib/game-state";

export const Route = createFileRoute("/arcade")({
  head: () => ({
    meta: [
      { title: "Arcade Shop — 8-Bit Runner" },
      {
        name: "description",
        content:
          "Spend Arcade Tokens on curated themes, runner looks, and Media Lab unlocks.",
      },
      { property: "og:title", content: "Arcade Shop — 8-Bit Runner" },
      {
        property: "og:description",
        content: "A premium catalog of retro themes, sprite kits, and export styles.",
      },
    ],
  }),
  component: ArcadePage,
});

function ArcadePage() {
  const { state, purchaseStoreItem } = useGameState();
  const [justUnlocked, setJustUnlocked] = useState<string | null>(null);
  const [shelf, setShelf] = useState<ShopShelf["id"]>("themes");

  const activeShelf = SHOP_SHELVES.find((s) => s.id === shelf) ?? SHOP_SHELVES[0]!;
  const shelfItems = activeShelf.categories.flatMap((cat) =>
    STORE_ITEMS.filter((i) => i.category === cat),
  );

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
      toast.error("Not enough coins");
      return;
    }

    if (result === "unlock") {
      setJustUnlocked(id);
      playSfx("complete");
      toast.success(`${item.name} unlocked!`);
      window.setTimeout(() => setJustUnlocked((cur) => (cur === id ? null : cur)), 900);
    } else {
      toast.success(`${item.name} equipped`);
    }
  };

  return (
    <div className="space-y-5 px-5 py-5">
      <section className="relative overflow-hidden rounded-2xl border border-primary/25 bg-surface px-4 py-3.5">
        <div
          className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full opacity-25 blur-2xl"
          style={{ background: "var(--primary)" }}
        />
        <div className="relative flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Balance
            </p>
            <p className="mt-0.5 flex items-center gap-2 text-[28px] font-bold tabular-nums leading-none text-foreground">
              {state.tokens.toLocaleString()}
              <ArcadeCoinIcon className="size-6" />
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-3 gap-1 rounded-2xl border border-border bg-surface p-1">
        {SHOP_SHELVES.map((tab) => {
          const active = tab.id === shelf;
          const count = tab.categories.reduce(
            (n, cat) => n + STORE_ITEMS.filter((i) => i.category === cat).length,
            0,
          );
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                playSfx("tap");
                setShelf(tab.id);
              }}
              className={`rounded-xl px-2 py-2.5 text-center transition-colors ${
                active
                  ? "bg-elevated text-foreground shadow-[var(--shadow-card)] ring-1 ring-primary/20"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="block text-[12px] font-semibold">{tab.label}</span>
              <span className="mt-0.5 block text-[10px] tabular-nums text-muted-foreground">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <section>
        <ul className="space-y-2">
          {shelfItems.map((item) => (
            <li key={item.id}>
              <StoreItemCard
                item={item}
                tokens={state.tokens}
                unlocked={state.unlocked}
                loadout={state.loadout}
                justUnlocked={justUnlocked === item.id}
                onAction={handleAction}
              />
            </li>
          ))}
        </ul>
      </section>

      <Link
        to="/media"
        onClick={() => playSfx("tap")}
        className="flex items-center justify-between rounded-2xl border border-border/80 bg-surface px-4 py-3 transition-colors hover:bg-elevated"
      >
        <div>
          <p className="text-[13px] font-semibold text-foreground">Overlay stickers</p>
        </div>
        <Sparkles className="size-4 text-accent-glow" />
      </Link>
    </div>
  );
}
