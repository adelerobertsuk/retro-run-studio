import { useState } from "react";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { playSfx } from "@/lib/audio";
import { todayKey, useGameState } from "@/lib/game-state";

const FIELD =
  "mt-1.5 w-full rounded-xl border border-border bg-elevated px-3 py-2.5 text-[14px] text-foreground outline-none focus:border-primary/60";

/** Manual run entry for runners who don't sync Strava. */
export function AddRunDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { addRun } = useGameState();
  const [title, setTitle] = useState("Manual Run");
  const [date, setDate] = useState(todayKey());
  const [miles, setMiles] = useState("3.1");
  const [paceMin, setPaceMin] = useState("8");
  const [paceSec, setPaceSec] = useState("30");
  const [topSpeed, setTopSpeed] = useState("9.5");

  const submit = () => {
    const distance = Number(miles);
    const pace = Number(paceMin) * 60 + Number(paceSec);
    if (!Number.isFinite(distance) || distance <= 0) {
      toast.error("Enter a distance greater than zero");
      return;
    }
    if (!Number.isFinite(pace) || pace <= 0) {
      toast.error("Enter a valid pace");
      return;
    }
    addRun({
      date,
      miles: Number(distance.toFixed(2)),
      paceSeconds: Math.round(pace),
      topSpeed: Number(topSpeed) || 0,
      title: title.trim() || "Manual Run",
    });
    playSfx("complete");
    toast.success("Run logged", {
      description: `+${Math.round(distance * 10)} Arcade Tokens earned.`,
    });
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
      <DrawerContent className="max-h-[88vh] border-border bg-background">
        <div className="mx-auto w-full max-w-[430px] overflow-y-auto px-5 pb-8">
          <DrawerHeader className="px-0 text-left">
            <DrawerTitle className="text-[19px] tracking-tight text-foreground">
              Add manual run
            </DrawerTitle>
            <DrawerDescription className="text-[12px] text-muted-foreground">
              Log distance, pace and time yourself — no Strava connection needed.
            </DrawerDescription>
          </DrawerHeader>

          <div className="space-y-3.5">
            <div>
              <label htmlFor="run-title" className="text-[12px] text-muted-foreground">
                Run title
              </label>
              <input id="run-title" className={FIELD} value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label htmlFor="run-date" className="text-[12px] text-muted-foreground">
                Date
              </label>
              <input
                id="run-date"
                type="date"
                className={FIELD}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="run-miles" className="text-[12px] text-muted-foreground">
                  Distance (mi)
                </label>
                <input
                  id="run-miles"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  className={FIELD}
                  value={miles}
                  onChange={(e) => setMiles(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="run-speed" className="text-[12px] text-muted-foreground">
                  Top speed (mph)
                </label>
                <input
                  id="run-speed"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  className={FIELD}
                  value={topSpeed}
                  onChange={(e) => setTopSpeed(e.target.value)}
                />
              </div>
            </div>
            <div>
              <span className="text-[12px] text-muted-foreground">Pace per mile</span>
              <div className="mt-1.5 grid grid-cols-2 gap-3">
                <input
                  aria-label="Pace minutes"
                  type="number"
                  inputMode="numeric"
                  className={FIELD.replace("mt-1.5 ", "")}
                  value={paceMin}
                  onChange={(e) => setPaceMin(e.target.value)}
                />
                <input
                  aria-label="Pace seconds"
                  type="number"
                  inputMode="numeric"
                  className={FIELD.replace("mt-1.5 ", "")}
                  value={paceSec}
                  onChange={(e) => setPaceSec(e.target.value)}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={submit}
              className="w-full rounded-2xl bg-primary py-3.5 text-[15px] font-semibold text-primary-foreground"
            >
              Save run
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
