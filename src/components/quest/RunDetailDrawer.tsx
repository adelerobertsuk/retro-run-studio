import { useCallback, useEffect, useRef } from "react";
import { X } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { formatPace, type RunEntry } from "@/lib/game-state";
import { playSfx } from "@/lib/audio";
import { routePoints } from "@/lib/route-path";

/** Deterministic pixel route map derived from the run title + date. */
function RouteMap({ run }: { run: RunEntry }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const W = 300;
    const H = 150;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = "#131a2e";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 15) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 15) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(W, y + 0.5);
      ctx.stroke();
    }

    const points = routePoints(run, W, H);
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    points.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
    ctx.stroke();

    const [sx, sy] = points[0]!;
    const [ex, ey] = points[points.length - 1]!;
    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.arc(sx, sy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fde047";
    ctx.shadowColor = "#fde047";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(ex, ey, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }, [run]);

  return (
    <canvas
      ref={ref}
      className="block h-auto w-full rounded-2xl border border-border"
      style={{ aspectRatio: "2 / 1" }}
      role="img"
      aria-label={`Route map for ${run.title}`}
    />
  );
}

export function RunDetailDrawer({
  run,
  onOpenChange,
}: {
  run: RunEntry | null;
  onOpenChange: (open: boolean) => void;
}) {
  useEffect(
    () => () => {
      const body = document.body;
      body.style.removeProperty("pointer-events");
      body.style.removeProperty("overflow");
      body.style.removeProperty("position");
      body.removeAttribute("data-scroll-locked");
    },
    [],
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) playSfx("tap");
      onOpenChange(open);
    },
    [onOpenChange],
  );

  return (
    <Drawer open={!!run} onOpenChange={handleOpenChange} shouldScaleBackground={false}>
      <DrawerContent className="max-h-[88vh] border-border bg-background">
        {run ? (
          <div className="mx-auto w-full max-w-[430px] overflow-y-auto px-5 pb-8">
            <DrawerHeader className="flex flex-row items-start justify-between gap-3 px-0 text-left">
              <div>
                <DrawerTitle className="text-[19px] tracking-tight text-foreground">
                  {run.title}
                </DrawerTitle>
                <DrawerDescription className="text-[12px] text-muted-foreground">
                  {new Date(`${run.date}T12:00:00`).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </DrawerDescription>
              </div>
              <DrawerClose
                aria-label="Close run details"
                className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-4" />
              </DrawerClose>
            </DrawerHeader>

            <div className="grid grid-cols-3 gap-2">
              {[
                ["Distance", `${run.miles.toFixed(2)} mi`],
                ["Pace", `${formatPace(run.paceSeconds)} /mi`],
                ["Top speed", `${run.topSpeed.toFixed(1)} mph`],
                ["Moving time", formatPace(Math.round(run.miles * run.paceSeconds))],
                ["Calories", `${Math.round(run.miles * 105)} kcal`],
                ["Elevation", `${Math.round(40 + run.miles * 18)} ft`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-border bg-surface p-3">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {label}
                  </p>
                  <p className="mt-1 text-[14px] font-semibold tabular-nums text-foreground">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <h3 className="mb-2 mt-5 text-[13px] font-semibold text-foreground">Route</h3>
            <RouteMap run={run} />
          </div>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
