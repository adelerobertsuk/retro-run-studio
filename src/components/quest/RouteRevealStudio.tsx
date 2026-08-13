import { useCallback, useEffect, useRef, useState } from "react";
import { Film, ImagePlus, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { formatPace, type RunEntry } from "@/lib/game-state";
import { routePoints, tracePath } from "@/lib/route-path";
import { drawWatermark } from "@/lib/watermark";
import { playSfx } from "@/lib/audio";

const W = 540;
const H = 960;
const DRAW_START = 40;
const DRAW_END = 260;
const STATS_AT = 268;
const TOTAL = 380;

const pixel = (s: number) =>
  `${s}px "Press Start 2P", ui-monospace, SFMono-Regular, Menlo, monospace`;

/** Cover-fit an image into the frame. */
function drawCover(ctx: CanvasRenderingContext2D, img: CanvasImageSource, w: number, h: number) {
  const iw = (img as HTMLImageElement).width || w;
  const ih = (img as HTMLImageElement).height || h;
  const scale = Math.max(w / iw, h / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

/** Warm '80s analog camera grade: film tone, vignette, scanlines, halation. */
function drawPhotoPlate(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource | null,
  frame: number,
  stamp: string,
) {
  ctx.save();
  if (img) {
    ctx.filter = "sepia(0.42) saturate(1.35) contrast(1.12) brightness(1.03)";
    drawCover(ctx, img, W, H);
    ctx.filter = "none";
  } else {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#1c1533");
    g.addColorStop(0.55, "#2a1c3d");
    g.addColorStop(1, "#0b1020");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();

  // warm analog wash + teal shadows
  ctx.save();
  ctx.globalCompositeOperation = "soft-light";
  const warm = ctx.createLinearGradient(0, 0, 0, H);
  warm.addColorStop(0, "rgba(255,176,92,0.55)");
  warm.addColorStop(0.6, "rgba(255,120,80,0.22)");
  warm.addColorStop(1, "rgba(30,90,120,0.45)");
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // vignette
  const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.72);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(3,4,12,0.72)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // scanlines + rolling bar
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = "#000";
  for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = "#e6f7ff";
  ctx.fillRect(0, (frame * 3) % H, W, 46);
  ctx.restore();

  // glowing camcorder timestamp
  ctx.save();
  ctx.textAlign = "right";
  ctx.shadowColor = "#fbbf24";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#fde68a";
  ctx.font = pixel(14);
  ctx.fillText(stamp, W - 26, H - 34);
  ctx.font = pixel(10);
  ctx.fillStyle = Math.floor(frame / 20) % 2 ? "#fbbf24" : "rgba(251,191,36,0.35)";
  ctx.fillText("AUTO  SP", W - 26, H - 58);
  ctx.restore();

  ctx.save();
  ctx.textAlign = "left";
  ctx.shadowColor = "#f43f5e";
  ctx.shadowBlur = 14;
  ctx.fillStyle = "#fecdd3";
  ctx.font = pixel(11);
  ctx.fillText("\u25CF REC", 26, 44);
  ctx.restore();
}

function drawStats(ctx: CanvasRenderingContext2D, run: RunEntry, t: number) {
  const ease = 1 - Math.pow(1 - Math.min(1, t), 3);
  const y = H * 0.58 + (1 - ease) * 60;
  ctx.save();
  ctx.globalAlpha = ease;
  ctx.fillStyle = "rgba(5,6,15,0.72)";
  ctx.beginPath();
  ctx.roundRect(34, y, W - 68, 210, 22);
  ctx.fill();
  ctx.strokeStyle = "rgba(16,185,129,0.65)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.fillStyle = "#a7f3d0";
  ctx.font = pixel(11);
  ctx.fillText(run.title.toUpperCase().slice(0, 18), 58, y + 40);

  const rows: [string, string][] = [
    ["DIST", `${run.miles.toFixed(2)} MI`],
    ["PACE", `${formatPace(run.paceSeconds)} /MI`],
    ["TIME", formatPace(Math.round(run.miles * run.paceSeconds))],
  ];
  rows.forEach(([k, v], i) => {
    const ry = y + 82 + i * 34;
    ctx.font = pixel(10);
    ctx.fillStyle = "#94a3b8";
    ctx.fillText(k, 58, ry);
    ctx.textAlign = "right";
    ctx.font = pixel(13);
    ctx.fillStyle = "#fbbf24";
    ctx.fillText(v, W - 58, ry);
    ctx.textAlign = "left";
  });

  drawWatermark(ctx, 34, y + 232, 0.78);
  ctx.restore();
}

export function RouteRevealStudio({ run }: { run: RunEntry }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const frameRef = useRef(0);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [nonce, setNonce] = useState(0);

  const onUpload = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      frameRef.current = 0;
      setPhotoName(file.name);
      setNonce((n) => n + 1);
    };
    img.src = url;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const pts = routePoints(run, W, H * 0.62).map(
      ([x, y]) => [x, y + H * 0.06] as [number, number],
    );
    const stamp = new Date(`${run.date}T12:00:00`)
      .toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
      .replace(/\//g, " ");

    let raf = 0;
    const render = () => {
      const f = frameRef.current;
      ctx.clearRect(0, 0, W, H);
      drawPhotoPlate(ctx, imgRef.current, f, stamp);

      const p = Math.max(0, Math.min(1, (f - DRAW_START) / (DRAW_END - DRAW_START)));
      if (p > 0) {
        const strokes: [string, number, number][] = [
          ["rgba(16,185,129,0.35)", 26, 46],
          ["#10b981", 12, 26],
          ["#d1fae5", 4, 10],
        ];
        strokes.forEach(([color, width, blur]) => {
          ctx.save();
          ctx.lineJoin = "round";
          ctx.lineCap = "round";
          ctx.strokeStyle = color;
          ctx.lineWidth = width;
          ctx.shadowColor = "#10b981";
          ctx.shadowBlur = blur;
          tracePath(ctx, pts, p);
          ctx.stroke();
          ctx.restore();
        });
        const head = tracePath(ctx, pts, p);
        ctx.beginPath();
        if (p < 1) {
          ctx.save();
          ctx.shadowColor = "#a7f3d0";
          ctx.shadowBlur = 30;
          ctx.fillStyle = "#ecfeff";
          ctx.beginPath();
          ctx.arc(head[0], head[1], 7 + Math.sin(f / 4) * 1.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        ctx.save();
        ctx.shadowColor = "#6366f1";
        ctx.shadowBlur = 20;
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(pts[0]![0] - 6, pts[0]![1] - 6, 12, 12);
        if (p >= 1) {
          ctx.fillStyle = "#6366f1";
          const e = pts[pts.length - 1]!;
          ctx.fillRect(e[0] - 8, e[1] - 8, 16, 16);
        }
        ctx.restore();
      }

      if (f >= STATS_AT) drawStats(ctx, run, (f - STATS_AT) / 30);

      frameRef.current = f + 1 > TOTAL ? 0 : f + 1;
      raf = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(raf);
  }, [run, nonce]);

  const record = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (typeof MediaRecorder === "undefined" || !canvas.captureStream) {
      toast.error("Video recording isn't supported on this device");
      return;
    }
    const mime = ["video/mp4", "video/webm;codecs=vp9", "video/webm"].find((m) =>
      MediaRecorder.isTypeSupported?.(m),
    );
    if (!mime) {
      toast.error("Video recording isn't supported on this device");
      return;
    }
    setRecording(true);
    frameRef.current = 0;
    const rec = new MediaRecorder(canvas.captureStream(60), { mimeType: mime });
    const chunks: BlobPart[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const done = new Promise<Blob>((resolve) => {
      rec.onstop = () => resolve(new Blob(chunks, { type: mime }));
    });
    rec.start();
    await new Promise((r) => setTimeout(r, ((TOTAL + 20) / 60) * 1000));
    rec.stop();
    const blob = await done;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `8bit-route-reveal-${run.date}.${mime.startsWith("video/mp4") ? "mp4" : "webm"}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    setRecording(false);
    playSfx("complete");
    toast.success("Route reveal saved", {
      description: "Ready for your camera roll, Strava or Instagram.",
    });
  };

  return (
    <div className="space-y-2.5">
      <div className="relative mx-auto w-full max-w-[260px] overflow-hidden rounded-3xl border border-border bg-black">
        <canvas
          ref={canvasRef}
          className="block size-full object-contain"
          style={{ aspectRatio: "9 / 16" }}
          role="img"
          aria-label={`Animated neon route reveal for ${run.title}`}
        />
      </div>

      <div className="flex gap-2.5">
        <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-border bg-surface py-3 text-[13px] font-medium text-foreground transition-colors hover:bg-elevated">
          <ImagePlus className="size-4" />
          {photoName ? "Change photo" : "Upload photo"}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                playSfx("tap");
                onUpload(file);
              }
            }}
          />
        </label>
        <button
          type="button"
          onClick={() => {
            playSfx("tap");
            frameRef.current = 0;
          }}
          className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 text-[13px] font-medium text-foreground transition-colors hover:bg-elevated"
        >
          <RotateCcw className="size-4" />
          Replay
        </button>
      </div>

      <button
        type="button"
        onClick={record}
        disabled={recording}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-[14px] font-semibold text-primary-foreground transition-opacity disabled:opacity-60"
      >
        <Film className="size-4" />
        {recording ? "Recording reveal…" : "Record & save video"}
      </button>
      <p className="text-[12px] text-muted-foreground">
        {photoName
          ? `'80s analog grade applied to ${photoName} — route draws on top.`
          : "Upload a run photo to get the warm '80s camcorder grade behind your route."}
      </p>
    </div>
  );
}
