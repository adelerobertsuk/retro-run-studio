import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { ArcadeCoinIcon } from "@/components/app/ArcadeCoinIcon";
import { playSfx } from "@/lib/audio";
import { getStoreItem, isFilterUnlocked } from "@/lib/arcade-store";
import { useGameState } from "@/lib/game-state";

export type MediaFilterOption = {
  id: string;
  name: string;
  icon: ReactNode;
};

type Props = {
  items: MediaFilterOption[];
  activeId: string;
  onSelect: (id: string) => void;
};

export function MediaFilterRow({ items, activeId, onSelect }: Props) {
  const { state, purchaseStoreItem } = useGameState();

  return (
    <div className="relative -mx-1">
      <div className="flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => {
          const storeItem = getStoreItem(item.id);
          const locked = !isFilterUnlocked(state.unlocked, item.id);
          const active = activeId === item.id;
          const cost = storeItem?.tokens ?? 0;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (locked) {
                  if (storeItem && state.tokens >= cost && cost > 0) {
                    const result = purchaseStoreItem(item.id);
                    if (result) {
                      playSfx("complete");
                      toast.success(`Unlocked ${item.name}`);
                      onSelect(item.id);
                      return;
                    }
                  }
                  playSfx("tap");
                  toast.message(cost > 0 ? `Unlock for ${cost} tokens` : "Locked");
                  return;
                }
                playSfx("tap");
                onSelect(item.id);
              }}
              className={`flex w-[88px] shrink-0 flex-col items-center gap-1.5 rounded-2xl border px-2 py-2.5 transition-colors ${
                active
                  ? "border-primary/50 bg-primary/15 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                  : locked
                    ? "border-border/60 bg-surface/60 opacity-80"
                    : "border-border bg-surface hover:border-primary/30"
              }`}
            >
              <span
                className={`flex size-10 items-center justify-center rounded-xl ${
                  active ? "bg-primary/25 text-primary" : "bg-elevated text-muted-foreground"
                }`}
              >
                {item.icon}
              </span>
              <span className="w-full truncate text-center text-[11px] font-semibold text-foreground">
                {item.name}
              </span>
              {locked && cost > 0 ? (
                <span className="flex items-center gap-0.5 text-[9px] font-medium text-muted-foreground">
                  <Lock className="size-2.5" />
                  <ArcadeCoinIcon className="size-2.5" />
                  {cost}
                </span>
              ) : locked ? (
                <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
                  <Lock className="size-2.5" />
                  Locked
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
