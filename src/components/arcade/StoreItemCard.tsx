import { useState } from "react";
import { Check, Lock, Sparkles } from "lucide-react";
import { ArcadeCoinIcon } from "@/components/app/ArcadeCoinIcon";
import type { Loadout, StoreItem } from "@/lib/arcade-store";
import { isItemOwned } from "@/lib/arcade-store";
import { playSfx } from "@/lib/audio";

type Props = {
  item: StoreItem;
  tokens: number;
  unlocked: string[];
  loadout: Loadout;
  onAction: (id: string) => void;
  justUnlocked?: boolean;
};

export function StoreItemCard({
  item,
  tokens,
  unlocked,
  loadout,
  onAction,
  justUnlocked,
}: Props) {
  const owned = isItemOwned(unlocked, item);
  const equipped = item.loadoutKey ? loadout[item.loadoutKey] === item.id : false;
  const mediaOwned = !item.loadoutKey && owned;
  const affordable = tokens >= item.tokens;
  const [pressing, setPressing] = useState(false);

  const handleClick = () => {
    if (equipped || mediaOwned) return;
    if (!owned && !affordable) return;
    setPressing(true);
    playSfx(owned ? "tap" : "complete");
    onAction(item.id);
    window.setTimeout(() => setPressing(false), 320);
  };

  const active = equipped || mediaOwned;

  return (
    <article
      className={`relative flex items-center gap-3 rounded-2xl border bg-surface px-3 py-2.5 transition-all duration-200 ${
        active
          ? "border-primary/50 shadow-[0_0_20px_-10px_var(--primary)]"
          : justUnlocked
            ? "border-primary/40 shadow-[0_0_24px_-8px_var(--primary-glow)]"
            : "border-border/80"
      } ${pressing ? "scale-[0.98]" : ""}`}
    >
      {justUnlocked && (
        <div className="pointer-events-none absolute inset-0 z-10 animate-pulse rounded-2xl bg-primary/8" />
      )}

      <div
        className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl"
        style={{
          background: `linear-gradient(145deg, ${item.preview[2] ?? item.preview[1]} 0%, ${item.preview[1]} 45%, ${item.preview[0]} 100%)`,
        }}
      >
        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.06)_2px,rgba(0,0,0,0.06)_3px)]" />
        {item.category === "Avatar Style" && (
          <div className="relative flex gap-px">
            <span
              className="size-2.5 rounded-[2px] border border-white/25"
              style={{ backgroundColor: item.preview[2] ?? "#f2c49b" }}
            />
            <span
              className="size-2.5 rounded-[2px] border border-white/25"
              style={{ backgroundColor: item.preview[0] }}
            />
            <span
              className="size-2.5 rounded-[2px] border border-white/25"
              style={{ backgroundColor: item.preview[1] }}
            />
          </div>
        )}
        {active && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
            <Check className="size-2.5" strokeWidth={3} />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-foreground">{item.name}</p>
        <p className="truncate text-[11px] text-muted-foreground">
          {item.tokens === 0 ? "Included" : `${item.tokens} tokens`}
        </p>
      </div>

      <button
        type="button"
        disabled={(!owned && !affordable) || active}
        onClick={handleClick}
        className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all active:scale-95 ${
          active
            ? "bg-primary/12 text-primary"
            : owned
              ? "bg-elevated text-foreground hover:bg-primary/10"
              : affordable
                ? "bg-primary text-primary-foreground shadow-[0_2px_10px_-4px_var(--primary)]"
                : "cursor-not-allowed bg-elevated/80 text-muted-foreground"
        }`}
      >
        {active ? (
          <span className="flex items-center gap-1">
            <Check className="size-3" />
            {mediaOwned ? "Owned" : "On"}
          </span>
        ) : owned ? (
          <span className="flex items-center gap-1">
            <Sparkles className="size-3" />
            Equip
          </span>
        ) : affordable ? (
          <span className="flex items-center gap-1">
            <ArcadeCoinIcon className="size-3" />
            Unlock
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <Lock className="size-3" />
            {item.tokens}
          </span>
        )}
      </button>
    </article>
  );
}
