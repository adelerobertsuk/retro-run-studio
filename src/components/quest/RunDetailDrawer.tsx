import { useCallback, useEffect, useRef } from "react";
import { Download, X } from "lucide-react";
import { toast } from "sonner";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  DEFAULT_PALETTE,
  drawGround,
  drawRunner,
  drawSky,
  drawSkyline,
} from "@/components/app/pixel-scene";
import { formatPace, type RunEntry } from "@/lib/game-state";
import { playSfx } from "@/lib/audio";

function seedFrom(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 100000;
  return h || 7;
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

/** Deterministic route polyline for a run, normalised to a W x H box. */
function routePoints(run: RunEntry, W: number, H: number): [number, number][] {
  const rnd = seededRandom(seedFrom(run.title + run.date));
  const points: [number, number][] = [];
  let x = W * 0.15 + rnd() * W * 0.15;
  let y = H - H * 0.2;
  let angle = -Math.PI / 3;
  for (let i = 0; i < 26; i++) {
    angle += (rnd() - 0.5) * 1.5;
    x = Math.max(W * 0.05, Math.min(W * 0.95, x + Math.cos(angle) * (W / 18.75)));
    y = Math.max(H * 0.1, Math.min(H * 0.9, y + Math.sin(angle) * (H / 10.7)));
    points.push([x, y]);
  }
  return points;
}

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
    ctx.fillRect(sx - 3, sy - 3, 6, 6);
    ctx.fillStyle = "#6366f1";
    ctx.fillRect(ex - 4, ey - 4, 8, 8);
  }, [run]);

  return (
    <canvas
      ref={ref}
      className="pixelated block h-auto w-full rounded-2xl border border-border"
      style={{ aspectRatio: "2 / 1" }}
      role="img"
      aria-label={`Route map for ${run.title}`}
    />
  );
}

/** Static 8-bit RPG hero card preview for a single run. */
function HeroCardPreview({ run }: { run: RunEntry }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const W = 200;
    const H = 280;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = W * 2 * dpr;
    canvas.height = H * 2 * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.setTransform(2 * dpr, 0, 0, 2 * dpr, 0, 0);

    ctx.fillStyle = "#0b1020";
    ctx.fillRect(0, 0, W, H);

    const artY = 26;
    const artH = 130;
    ctx.save();
    ctx.beginPath();
    ctx.rect(12, artY, W - 24, artH);
    ctx.clip();
    ctx.translate(12, artY);
    drawSky(ctx, W - 24, artH, true);
    drawSkyline(ctx, W - 24, artH - 16, 40, 0);
    drawSkyline(ctx, W - 24, artH - 16, 40, 1);
    drawGround(ctx, W - 24, artH, artH - 16, 40);
    drawRunner(ctx, 70, artH - 16, 4, 1, DEFAULT_PALETTE);
    ctx.restore();

    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, W - 8, H - 8);
    ctx.strokeStyle = "#10b981";
    ctx.strokeRect(12, artY, W - 24, artH);

    const font = (s: number) =>
      `${s}px "Press Start 2P", ui-monospace, SFMono-Regular, Menlo, monospace`;
    ctx.textAlign = "center";
    ctx.fillStyle = "#fbbf24";
    ctx.font = font(8);
    ctx.fillText(run.title.toUpperCase().slice(0, 18), W / 2, 18);

    ctx.textAlign = "left";
    ctx.font = font(7);
    const rows: [string, string][] = [
      ["DIST", `${run.miles.toFixed(2)}MI`],
      ["PACE", `${formatPace(run.paceSeconds)}`],
      ["SPD", `${run.topSpeed.toFixed(1)}`],
      ["RANK", run.miles > 3 ? "S" : "A"],
    ];
    rows.forEach(([k, v], i) => {
      const y = artY + artH + 22 + i * 18;
      ctx.fillStyle = "#94a3b8";
      ctx.fillText(k, 18, y);
      ctx.fillStyle = "#e2e8f0";
      ctx.textAlign = "right";
      ctx.fillText(v, W - 18, y);
      ctx.textAlign = "left";
    });
  }, [run]);

  return (
    <canvas
      ref={ref}
      className="pixelated block h-auto w-full"
      style={{ aspectRatio: "5 / 7" }}
      role="img"
      aria-label={`8-bit RPG hero card preview for ${run.title}`}
    />
  );
}

/**
 * Export the route as a transparent low-bit neon overlay PNG, sized for
 * layering on a Strava or Instagram photo.
 */
function exportOverlay(run: RunEntry) {
  const W = 1080;
  const H = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, W, H);
  ctx.imageSmoothingEnabled = false;

  const raw = routePoints(run, W, H - 200);
  const step = 18; // quantise to a chunky low-bit grid
  const points = raw.map(([x, y]) => [
    Math.round(x / step) * step,
    Math.round((y + 60) / step) * step,
  ]) as [number, number][];

  const stroke = (color: string, width: number, blur: number) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineJoin = "miter";
    ctx.lineCap = "square";
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
    ctx.beginPath();
    points.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
    ctx.stroke();
    ctx.restore();
  };

  stroke("rgba(16,185,129,0.45)", 26, 42);
  stroke("#10b981", 14, 24);
  stroke("#a7f3d0", 5, 0);

  const [sx, sy] = points[0]!;
  const [ex, ey] = points[points.length - 1]!;
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(sx - 12, sy - 12, 24, 24);
  ctx.fillStyle = "#6366f1";
  ctx.fillRect(ex - 16, ey - 16, 32, 32);

  ctx.font = '34px "Press Start 2P", ui-monospace, Menlo, monospace';
  ctx.textAlign = "left";
  ctx.shadowColor = "#10b981";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#a7f3d0";
  ctx.fillText(run.title.toUpperCase().slice(0, 16), 60, H - 120);
  ctx.font = '26px "Press Start 2P", ui-monospace, Menlo, monospace';
  ctx.fillStyle = "#fbbf24";
  ctx.fillText(
    `${run.miles.toFixed(2)}MI  ${formatPace(run.paceSeconds)}/MI`,
    60,
    H - 64,
  );

  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = `8bit-route-${run.date}.png`;
  a.click();
  playSfx("complete");
  toast.success("Neon route overlay saved", {
    description: "Transparent PNG ready for Strava or Instagram.",
  });
}

export function RunDetailDrawer({
  run,
  onOpenChange,
}: {
  run: RunEntry | null;
  onOpenChange: (open: boolean) => void;
}) {
  // Safety net: if this screen unmounts (tab switch) while the drawer is open,
  // clear any body locks vaul may have left behind so the app never freezes.
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

            <button
              type="button"
              onClick={() => exportOverlay(run)}
              className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-2xl border border-primary/40 bg-primary/10 py-3 text-[14px] font-semibold text-foreground transition-colors hover:bg-primary/15"
            >
              <Download className="size-4" />
              Export neon route overlay (PNG)
            </button>

            <h3 className="mb-2 mt-5 text-[13px] font-semibold text-foreground">
              8-bit RPG hero card
            </h3>
            <div className="flex justify-center rounded-2xl border border-border bg-surface p-4">
              <div className="w-[190px]">
                <HeroCardPreview run={run} />
              </div>
            </div>
          </div>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
