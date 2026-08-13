import { useState } from "react";
import { Check, Coins, Lock, Sparkles } from "lucide-react";
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

  return (
    <article
      className={`relative flex flex-col overflow-hidden rounded-2xl border bg-surface transition-all duration-300 ${
        equipped || mediaOwned
          ? "border-primary/60 shadow-[0_0_24px_-8px_var(--primary)]"
          : justUnlocked
            ? "scale-[1.02] border-primary/50 shadow-[0_0_28px_-6px_var(--primary-glow)]"
            : "border-border"
      } ${pressing ? "scale-[0.97]" : ""}`}
    >
      {justUnlocked && (
        <div className="pointer-events-none absolute inset-0 z-10 animate-pulse bg-primary/10" />
      )}

      <div
        className="relative mx-3 mt-3 flex h-[72px] items-end justify-center gap-1 overflow-hidden rounded-xl p-2"
        style={{
          background: `linear-gradient(135deg, ${item.preview[2] ?? item.preview[1]} 0%, ${item.preview[1]} 50%, ${item.preview[0]} 100%)`,
        }}
      >
        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_3px,rgba(0,0,0,0.08)_3px,rgba(0,0,0,0.08)_4px)]" />
        {item.category === "Avatar Style" && (
          <div className="relative flex gap-0.5">
            <span
              className="size-5 rounded-sm border border-white/20"
              style={{ backgroundColor: item.preview[2] ?? "#f2c49b" }}
            />
            <span
              className="size-5 rounded-sm border border-white/20"
              style={{ backgroundColor: item.preview[0] }}
            />
            <span
              className="size-5 rounded-sm border border-white/20"
              style={{ backgroundColor: item.preview[1] }}
            />
          </div>
        )}
        {(equipped || mediaOwned) && (
          <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
            <Check className="size-3.5" strokeWidth={3} />
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3.5 pt-2.5">
        <p className="text-[13px] font-semibold leading-snug text-foreground">{item.name}</p>
        <p className="mt-1 flex-1 text-[11px] leading-relaxed text-muted-foreground">
          {item.description}
        </p>

        <button
          type="button"
          disabled={(!owned && !affordable) || equipped || mediaOwned}
          onClick={handleClick}
          className={`mt-3 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12px] font-semibold transition-all duration-200 active:scale-95 ${
            equipped || mediaOwned
              ? "bg-primary/15 text-primary"
              : owned
                ? "bg-elevated text-foreground hover:bg-primary/10"
                : affordable
                  ? "bg-primary text-primary-foreground shadow-[0_4px_14px_-4px_var(--primary)] hover:brightness-110"
                  : "cursor-not-allowed bg-elevated text-muted-foreground"
          }`}
        >
          {equipped || mediaOwned ? (
            <>
              <Check className="size-3.5" /> {mediaOwned ? "Owned" : "Equipped"}
            </>
          ) : owned ? (
            <>
              <Sparkles className="size-3.5" /> Equip
            </>
          ) : affordable ? (
            <>
              <Coins className="size-3.5" />
              Unlock · {item.tokens}
            </>
          ) : (
            <>
              <Lock className="size-3.5" />
              {item.tokens} coins
            </>
          )}
        </button>
      </div>
    </article>
  );
}
