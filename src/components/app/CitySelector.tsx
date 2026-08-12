import { Check, Lock, MapPin } from "lucide-react";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { CITIES, cityLevel } from "@/lib/cities";
import { useGameState } from "@/lib/game-state";

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

export function CitySelector({ open, onOpenChange }: Props) {
  const { state, setActiveCity, unlockCity } = useGameState();
  const totalMiles = state.runs.reduce((s, r) => s + r.miles, 0);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="border-border bg-surface">
        <DrawerHeader className="text-left">
          <DrawerTitle className="text-[17px]">Marathon Cities</DrawerTitle>
          <DrawerDescription className="text-[13px]">
            {totalMiles.toFixed(1)} season miles · {state.tokens.toLocaleString()} tokens
          </DrawerDescription>
        </DrawerHeader>
        <div className="max-h-[60vh] space-y-2.5 overflow-y-auto px-4 pb-8">
          {CITIES.map((c) => {
            const byMiles = totalMiles >= c.milesRequired;
            const unlocked = state.unlockedCities.includes(c.id) || byMiles;
            const active = state.activeCity === c.id;
            return (
              <div
                key={c.id}
                className={`flex items-center gap-3 rounded-2xl border p-3.5 ${
                  active ? "border-primary/60 bg-primary/10" : "border-border bg-elevated"
                }`}
              >
                <span
                  className="flex size-9 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${c.accent}22`, color: c.accent }}
                >
                  <MapPin className="size-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-foreground">
                    {c.name} — Level {cityLevel(c.id)}
                  </p>
                  <p className="truncate text-[12px] text-muted-foreground">
                    {c.landmark} ·{" "}
                    {unlocked
                      ? c.milesRequired === 0
                        ? "Default city"
                        : `Unlocked at ${c.milesRequired} mi`
                      : `${c.milesRequired} mi to unlock`}
                  </p>
                </div>
                {unlocked ? (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCity(c.id);
                      onOpenChange(false);
                      toast.success(`Now running in ${c.name}`);
                    }}
                    disabled={active}
                    className="rounded-xl bg-primary px-3 py-2 text-[12px] font-semibold text-primary-foreground disabled:opacity-50"
                  >
                    {active ? <Check className="size-4" /> : "Select"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (unlockCity(c.id, c.tokens)) {
                        onOpenChange(false);
                        toast.success(`${c.name} unlocked`, {
                          description: `${c.tokens} tokens spent.`,
                        });
                      } else {
                        toast.error("Not enough tokens", {
                          description: `${c.name} costs ${c.tokens} tokens.`,
                        });
                      }
                    }}
                    className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-[12px] font-semibold text-foreground"
                  >
                    <Lock className="size-3.5" />
                    {c.tokens}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
