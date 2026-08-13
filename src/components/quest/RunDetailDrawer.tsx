import { useCallback, useEffect, useRef, useState } from "react";
import { Download, ImagePlus, X } from "lucide-react";
import { drawAnalogPhoto } from "@/lib/analog-photo";
import { drawWatermark } from "@/lib/watermark";
import { toast } from "sonner";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { composeHeroCardPreview } from "@/lib/hero-card";
import { formatPace, type RunEntry } from "@/lib/game-state";
import { playSfx } from "@/lib/audio";
import { routePoints } from "@/lib/route-path";
import { RouteRevealStudio } from "./RouteRevealStudio";

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

/** Share-ready hero card preview using the Media Lab composer. */
function HeroCardPreview({ run }: { run: RunEntry }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    void composeHeroCardPreview(canvas, run);
  }, [run]);

  return (
    <canvas
      ref={ref}
      className="pixelated block h-auto w-full"
      style={{ aspectRatio: "2 / 3" }}
      role="img"
      aria-label={`8-Bit Runner hero card for ${run.title}`}
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

  drawWatermark(ctx, 60, H - 240, 1);

  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = `8bit-route-${run.date}.png`;
  a.click();
  playSfx("complete");
  toast.success("Neon route overlay saved", {
    description: "Transparent PNG ready for Strava or Instagram.",
  });
}

function AnalogPhotoBox({ run }: { run: RunEntry }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [name, setName] = useState<string | null>(null);

  const W = 540;
  const H = 675;
  const stamp = new Date(`${run.date}T12:00:00`)
    .toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
    .replace(/\//g, " ");

  const render = useCallback(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawAnalogPhoto(ctx, canvas, imgRef.current, W, H, stamp, 0);
  }, [stamp]);

  useEffect(() => {
    render();
  }, [render]);

  return (
    <div className="space-y-2.5">
      <canvas
        ref={ref}
        className="block w-full rounded-2xl border border-border"
        style={{ aspectRatio: "4 / 5" }}
        role="img"
        aria-label={`'80s analog photo for ${run.title}`}
      />
      <div className="flex gap-2.5">
        <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-border bg-surface py-3 text-[13px] font-medium text-foreground transition-colors hover:bg-elevated">
          <ImagePlus className="size-4" />
          {name ? "Change photo" : "Upload photo"}
          <input
            type="file"
            accept="image/*,video/*"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              playSfx("tap");
              if (file.type.startsWith("video/")) {
                const video = document.createElement("video");
                video.muted = true;
                video.playsInline = true;
                video.onloadeddata = () => {
                  video.currentTime = 0.2;
                };
                video.onseeked = () => {
                  const c = document.createElement("canvas");
                  c.width = video.videoWidth || W;
                  c.height = video.videoHeight || H;
                  const vctx = c.getContext("2d")!;
                  vctx.drawImage(video, 0, 0);
                  const img = new Image();
                  img.onload = () => {
                    imgRef.current = img;
                    setName(file.name);
                    render();
                  };
                  img.src = c.toDataURL("image/jpeg", 0.9);
                };
                video.src = URL.createObjectURL(file);
                return;
              }
              const img = new Image();
              img.onload = () => {
                imgRef.current = img;
                setName(file.name);
                render();
              };
              img.src = URL.createObjectURL(file);
            }}
          />
        </label>
        <button
          type="button"
          onClick={() => {
            const canvas = ref.current;
            if (!canvas) return;
            const a = document.createElement("a");
            a.href = canvas.toDataURL("image/png");
            a.download = `8bit-analog-${run.date}.png`;
            a.click();
            playSfx("complete");
            toast.success("Analog photo saved");
          }}
          className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 text-[13px] font-medium text-foreground transition-colors hover:bg-elevated"
        >
          <Download className="size-4" />
          Save
        </button>
      </div>
    </div>
  );
}

function PhotoExport({ run }: { run: RunEntry }) {
  return (
    <>
      <h3 className="mb-2 mt-5 text-[13px] font-semibold text-foreground">
        '80s analog photo
      </h3>
      <AnalogPhotoBox run={run} />

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
        Hero card share preview
      </h3>
      <div className="flex justify-center rounded-2xl border border-border bg-surface p-4">
        <div className="w-full max-w-[220px]">
          <HeroCardPreview run={run} />
        </div>
      </div>
    </>
  );
}

export function RunDetailDrawer({
  run,
  onOpenChange,
}: {
  run: RunEntry | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [mode, setMode] = useState<"photo" | "video">("photo");
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

            <div className="mt-5 grid grid-cols-2 gap-1 rounded-2xl border border-border bg-surface p-1">
              {(["photo", "video"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    playSfx("tap");
                    setMode(m);
                  }}
                  className={`rounded-xl py-2.5 text-[13px] font-semibold capitalize transition-colors ${
                    mode === m
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[12px] text-muted-foreground">
              {mode === "photo"
                ? "Instant '80s analog grade plus your 8-bit RPG hero card."
                : "Animated neon route reveal with stats and the 8-Bit Runner badge."}
            </p>

            {mode === "photo" ? (
              <PhotoExport run={run} />
            ) : (
              <div className="mt-4">
                <RouteRevealStudio run={run} />
              </div>
            )}
          </div>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
