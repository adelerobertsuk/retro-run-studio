import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Pause, Play, RotateCcw, Share2, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  DEFAULT_PALETTE,
  drawBoss,
  drawFireworks,
  drawGround,
  drawRunner,
  drawSky,
  drawSkyline,
  type Palette,
} from "@/components/app/pixel-scene";
import { formatPace, type RunEntry } from "@/lib/game-state";
import { drawMaze } from "./maze-scene";
import { BootTerminal } from "./BootTerminal";
import { useGameState } from "@/lib/game-state";

type Mode = "maze" | "beat";

const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: "maze", label: "Maze Runner", hint: "Pac-Man route replay" },
  { id: "beat", label: "Beat-'Em-Up", hint: "Side-scrolling runner" },
];

const W = 270; // 9:16 logical canvas
const H = 480;
const SCALE = 4;
const TIME_SCALE = 0.4; // run everything 60% slower for a calm, stable preview


/** Pull a rough outfit palette out of the uploaded photo. */
async function paletteFromImage(file: File): Promise<Palette> {
  const bitmap = await createImageBitmap(file);
  const c = document.createElement("canvas");
  c.width = 32;
  c.height = 32;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, 32, 32);
  const sample = (x: number, y: number, w: number, h: number) => {
    const { data } = ctx.getImageData(x, y, w, h);
    let r = 0;
    let g = 0;
    let b = 0;
    const n = data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
      r += data[i]!;
      g += data[i + 1]!;
      b += data[i + 2]!;
    }
    return `rgb(${Math.round(r / n)}, ${Math.round(g / n)}, ${Math.round(b / n)})`;
  };
  return {
    hair: sample(10, 2, 12, 6),
    skinTone: sample(12, 10, 8, 6),
    shirt: sample(6, 18, 20, 8),
    shorts: sample(8, 26, 16, 5),
    shoes: "#f8fafc",
  };
}

type Props = { run: RunEntry; totalMiles: number };

export function VideoStudio({ run, totalMiles }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playing, setPlaying] = useState(true);
  const [mode, setMode] = useState<Mode>("maze");
  const [palette, setPalette] = useState<Palette>(DEFAULT_PALETTE);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [booting, setBooting] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { state } = useGameState();
  const tickRef = useRef(0);

  const onUpload = useCallback(async (file: File) => {
    setPhotoName(file.name);
    try {
      setPalette(await paletteFromImage(file));
    } catch {
      setPalette(DEFAULT_PALETTE);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = W * SCALE * dpr;
    canvas.height = H * SCALE * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.setTransform(SCALE * dpr, 0, 0, SCALE * dpr, 0, 0);

    let raf = 0;
    const pixelFont = (size: number) =>
      `${size}px ui-monospace, "SFMono-Regular", Menlo, monospace`;

    if (!generated) {
      // Static placeholder until the user generates a reel
      ctx.fillStyle = "#05060f";
      ctx.fillRect(0, 0, W, H);
      drawSky(ctx, W, H, true);
      drawSkyline(ctx, W, H - 74, 0, 0);
      drawSkyline(ctx, W, H - 74, 0, 1);
      drawGround(ctx, W, H, H - 74, 0);
      drawRunner(ctx, 56, H - 74, 5, 0, palette);
      ctx.fillStyle = "rgba(5,6,15,0.7)";
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = "center";
      ctx.fillStyle = "#10b981";
      ctx.font = pixelFont(13);
      ctx.fillText("READY TO RENDER", W / 2, H / 2 - 8);
      ctx.fillStyle = "#94a3b8";
      ctx.font = pixelFont(10);
      ctx.fillText("TAP GENERATE VIDEO", W / 2, H / 2 + 14);
      return;
    }

    const drawHud = () => {
      // Strava-style HUD overlay
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(9,10,26,0.6)";
      ctx.fillRect(10, 12, W - 20, 34);
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 1;
      ctx.strokeRect(10.5, 12.5, W - 21, 33);
      ctx.font = pixelFont(9);
      ctx.fillStyle = "#94a3b8";
      ctx.fillText("DIST", 18, 25);
      ctx.fillText("PACE", 106, 25);
      ctx.fillText("SPD", 194, 25);
      ctx.fillStyle = "#fbbf24";
      ctx.font = pixelFont(12);
      ctx.fillText(`${run.miles.toFixed(2)}mi`, 18, 39);
      ctx.fillText(`${formatPace(run.paceSeconds)}`, 106, 39);
      ctx.fillText(`${run.topSpeed.toFixed(1)}`, 194, 39);
    };

    const render = () => {
      if (playing) tickRef.current += TIME_SCALE;
      const t = tickRef.current;
      const loop = t % 900; // ~37.5s at 60fps with TIME_SCALE = 0.4
      const groundY = H - 74;


      if (mode === "maze") {
        const cycle = t % 780;
        if (cycle < 660) {
          drawMaze(ctx, W, H, t, cycle / 660);
        } else {
          drawMaze(ctx, W, H, t, 1);
          ctx.fillStyle = "rgba(5,6,15,0.88)";
          ctx.fillRect(0, 0, W, H);
          drawFireworks(ctx, W, H, cycle - 660);
          ctx.textAlign = "center";
          ctx.fillStyle = "#fde047";
          ctx.font = pixelFont(16);
          ctx.fillText("ROUTE CLEARED", W / 2, H * 0.36);
          ctx.font = pixelFont(11);
          ctx.fillStyle = "#e2e8f0";
          [
            `DISTANCE   ${run.miles.toFixed(2)} MI`,
            `PACE       ${formatPace(run.paceSeconds)} /MI`,
            `PELLETS    ${Math.round(run.miles * 120)}`,
            `SEASON     ${totalMiles.toFixed(0)} MI`,
          ].forEach((line, i) => ctx.fillText(line, W / 2, H * 0.46 + i * 22));
        }
        drawHud();
        raf = requestAnimationFrame(render);
        return;
      }

      drawSky(ctx, W, H, true);
      drawSkyline(ctx, W, groundY, t, 0);
      drawSkyline(ctx, W, groundY, t, 1);
      drawGround(ctx, W, H, groundY, t);

      if (loop < 480) {
        // Act 1 — side-scrolling run
        drawRunner(ctx, 56, groundY, 5, Math.floor(t / 5), palette);
      } else if (loop < 720) {
        // Act 2 — boss encounter
        const approach = Math.max(0, 200 - (loop - 480));
        drawBoss(ctx, 150 + approach, groundY, 5, Math.floor(t / 6));
        drawRunner(ctx, 56, groundY, 5, Math.floor(t / 4), palette);
        ctx.fillStyle = "#f43f5e";
        ctx.font = pixelFont(11);
        ctx.textAlign = "center";
        ctx.fillText("!! BOSS: THE WALL !!", W / 2, 60);
        if (loop > 620 && Math.floor(t / 4) % 2 === 0) {
          ctx.fillStyle = "#fbbf24";
          ctx.fillRect(110, groundY - 46, 34, 6);
          ctx.fillRect(126, groundY - 60, 6, 34);
        }
      } else {
        // Act 3 — LEVEL COMPLETE stat screen
        ctx.fillStyle = "rgba(9,10,26,0.86)";
        ctx.fillRect(0, 0, W, H);
        drawFireworks(ctx, W, H, loop - 720);
        ctx.textAlign = "center";
        ctx.fillStyle = "#10b981";
        ctx.font = pixelFont(18);
        ctx.fillText("LEVEL COMPLETE", W / 2, H * 0.34);
        ctx.font = pixelFont(11);
        ctx.fillStyle = "#e2e8f0";
        const lines = [
          `DISTANCE   ${run.miles.toFixed(2)} MI`,
          `PACE       ${formatPace(run.paceSeconds)} /MI`,
          `TOP SPEED  ${run.topSpeed.toFixed(1)} MPH`,
          `SEASON     ${totalMiles.toFixed(0)} MI`,
        ];
        lines.forEach((line, i) => ctx.fillText(line, W / 2, H * 0.44 + i * 22));
        ctx.fillStyle = "#6366f1";
        ctx.fillText("PRESS SHARE TO CONTINUE", W / 2, H * 0.72);
      }

      drawHud();
      raf = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(raf);
  }, [playing, palette, run, totalMiles, mode, generated]);

  const recordClip = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    if (typeof MediaRecorder === "undefined" || !canvas.captureStream) return null;
    const stream = canvas.captureStream(30);
    const rec = new MediaRecorder(stream, { mimeType: "video/webm" });
    const chunks: BlobPart[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const done = new Promise<Blob>((resolve) => {
      rec.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
    });
    rec.start();
    await new Promise((r) => setTimeout(r, 4000));
    rec.stop();
    return done;
  }, []);

  const saveClip = async () => {
    setExporting(true);
    try {
      const blob = await recordClip();
      if (!blob) throw new Error("unsupported");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `8bit-runner-${mode}-reel.webm`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      toast.success("Saved to your camera roll");
    } catch {
      toast.error("Video export isn't supported on this device");
    } finally {
      setExporting(false);
    }
  };

  const shareClip = async () => {
    setExporting(true);
    try {
      const blob = await recordClip();
      if (!blob) throw new Error("unsupported");
      const file = new File([blob], "8bit-runner-reel.webm", { type: "video/webm" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "8-Bit Runner",
          text: `${run.miles.toFixed(2)} mi at ${formatPace(run.paceSeconds)}/mi`,
        });
      } else {
        toast.info("Sharing isn't available here — saving instead");
        await saveClip();
      }
    } catch {
      /* dismissed */
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-1 rounded-2xl border border-border bg-surface p-1">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              if (m.id !== mode) {
                setMode(m.id);
                tickRef.current = 0;
                setGenerated(false);
              }
            }}
            className={`rounded-xl px-2 py-2 text-left transition-colors ${
              mode === m.id
                ? "bg-elevated text-foreground shadow-[var(--shadow-card)]"
                : "text-muted-foreground"
            }`}
          >
            <span className="block text-[13px] font-medium">{m.label}</span>
            <span className="block text-[11px] text-muted-foreground">{m.hint}</span>
          </button>
        ))}
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-border bg-black shadow-[var(--shadow-card)]">
        <canvas
          ref={canvasRef}
          className="pixelated block h-auto w-full"
          style={{ aspectRatio: "9 / 16" }}
          role="img"
          aria-label="Vertical 9:16 preview of an 8-bit beat-em-up run video"
        />
        <span className="absolute right-3 top-3 rounded-full bg-background/70 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-foreground backdrop-blur">
          9:16
        </span>
        {booting && (
          <BootTerminal
            muted={!state.settings.audio}
            lines={[
              "> CONNECTING STRAVA ENGINE...",
              "> ANALYZING GPS ROUTE & TELEMETRY...",
              "> SPRITE SYNTHESIS: MATCHING OUTFITS & AVATARS...",
              mode === "maze"
                ? "> RENDERING PAC-MAN MAZE REEL..."
                : "> RENDERING 8-BIT ARCADE REEL...",
            ]}
            onDone={() => setBooting(false)}
          />
        )}
      </div>

      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={() => {
            tickRef.current = 0;
            setPlaying(true);
            setBooting(true);
            setGenerated(true);
          }}
          disabled={booting}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-[14px] font-semibold text-primary-foreground transition-opacity disabled:opacity-60"
        >
          <Sparkles className="size-4" />
          {booting ? "Rendering…" : generated ? "Regenerate" : "Generate video"}
        </button>
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          disabled={!generated || booting}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border bg-surface py-3 text-[14px] font-medium text-foreground transition-colors hover:bg-elevated"
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
          {playing ? "Pause" : "Play"}
        </button>
        <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-border bg-surface py-3 text-[14px] font-medium text-foreground transition-colors hover:bg-elevated">
          <Upload className="size-4" />
          {photoName ? "Change photo" : "Sync photo"}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onUpload(file);
            }}
          />
        </label>
      </div>

      {generated && !booting && (
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={saveClip}
            disabled={exporting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-[15px] font-semibold text-primary-foreground transition-opacity disabled:opacity-60"
          >
            <Download className="size-4" />
            {exporting ? "Capturing reel…" : "Save to Camera Roll"}
          </button>
          <button
            type="button"
            onClick={shareClip}
            disabled={exporting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-primary/40 bg-primary/10 py-3.5 text-[15px] font-semibold text-foreground transition-colors hover:bg-primary/15 disabled:opacity-60"
          >
            <Share2 className="size-4" />
            Share to Instagram / TikTok / Strava
          </button>
          <button
            type="button"
            onClick={() => {
              tickRef.current = 0;
              setPlaying(true);
              setBooting(true);
            }}
            disabled={exporting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-surface py-3 text-[14px] font-medium text-muted-foreground transition-colors hover:bg-elevated disabled:opacity-60"
          >
            <RotateCcw className="size-4" />
            Retry / switch style
          </button>
        </div>
      )}
      <p className="text-[12px] text-muted-foreground">
        {photoName
          ? `Avatar outfit matched from ${photoName}.`
          : "Sync a run photo and your pixel avatar's outfit will match it."}
      </p>
    </div>
  );
}
