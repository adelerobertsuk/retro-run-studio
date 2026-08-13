import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Share2, Sparkles, Upload } from "lucide-react";
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
import { playSfx } from "@/lib/audio";
import { paletteFromImage } from "@/lib/avatar-palette";
import { getAvatarPalette } from "@/lib/arcade-store";
import { drawFilteredPhoto } from "@/lib/vhs-effects";
import { drawOfficialLogo } from "@/lib/watermark";

type StudioTab = "arcade" | "workout";
type ArcadeMode = "maze" | "beat";

const ARCADE_MODES: { id: ArcadeMode; label: string; hint: string }[] = [
  { id: "maze", label: "Maze Runner", hint: "Pac-Man route replay" },
  { id: "beat", label: "Beat-'Em-Up", hint: "Side-scrolling runner" },
];

const W = 270;
const H = 480;
const SCALE = 4;
const TIME_SCALE = 0.4;

type Props = { run: RunEntry };

export function VideoStudio({ run }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const photoRef = useRef<HTMLImageElement | null>(null);
  const { state } = useGameState();
  const avatarPalette = getAvatarPalette(state.loadout.avatarStyle);
  const [tab, setTab] = useState<StudioTab>("workout");
  const [arcadeMode, setArcadeMode] = useState<ArcadeMode>("maze");
  const [palette, setPalette] = useState<Palette>(avatarPalette);
  const [mediaName, setMediaName] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [booting, setBooting] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [exporting, setExporting] = useState(false);
  const tickRef = useRef(0);

  useEffect(() => {
    setPalette(avatarPalette);
  }, [avatarPalette]);

  const onUpload = useCallback(async (file: File) => {
    setMediaName(file.name);
    setIsVideo(file.type.startsWith("video/"));
    if (file.type.startsWith("image/")) {
      try {
        setPalette(await paletteFromImage(file));
      } catch {
        setPalette(DEFAULT_PALETTE);
      }
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await new Promise<void>((r) => {
        img.onload = () => r();
      });
      photoRef.current = img;
      videoRef.current = null;
    } else {
      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.loop = true;
      video.src = URL.createObjectURL(file);
      await new Promise<void>((r, j) => {
        video.onloadeddata = () => r();
        video.onerror = () => j();
      });
      videoRef.current = video;
      photoRef.current = null;
      try {
        setPalette(await paletteFromImage(file));
      } catch {
        setPalette(DEFAULT_PALETTE);
      }
    }
    setGenerated(false);
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
      `${size}px "Press Start 2P", ui-monospace, SFMono-Regular, Menlo, monospace`;

    const drawHud = () => {
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(9,10,26,0.72)";
      ctx.fillRect(8, 10, W - 16, 38);
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 1;
      ctx.strokeRect(8.5, 10.5, W - 17, 37);
      ctx.font = pixelFont(7);
      ctx.fillStyle = "#94a3b8";
      ctx.fillText("DIST", 14, 22);
      ctx.fillText("PACE", 98, 22);
      ctx.fillText("SPD", 182, 22);
      ctx.fillStyle = "#fde047";
      ctx.font = pixelFont(9);
      ctx.fillText(`${run.miles.toFixed(2)}`, 14, 38);
      ctx.fillText(formatPace(run.paceSeconds), 98, 38);
      ctx.fillText(`${run.topSpeed.toFixed(1)}`, 182, 38);
    };

    const drawAvatarBadge = (tick: number) => {
      const bx = 12;
      const by = H - 118;
      const bw = 88;
      const bh = 100;
      ctx.fillStyle = "rgba(5,6,15,0.82)";
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 10);
      ctx.fill();
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.save();
      ctx.beginPath();
      ctx.rect(bx + 4, by + 4, bw - 8, bh - 28);
      ctx.clip();
      ctx.translate(bx + 4, by + 4);
      drawSky(ctx, bw - 8, bh - 32, true);
      drawGround(ctx, bw - 8, bh - 32, bh - 52, tick);
      drawRunner(ctx, 24, bh - 52, 4, Math.floor(tick / 5), palette);
      ctx.restore();
      ctx.textAlign = "center";
      ctx.fillStyle = "#fbbf24";
      ctx.font = pixelFont(6);
      ctx.fillText("YOU", bx + bw / 2, by + bh - 8);
    };

    if (!generated) {
      ctx.fillStyle = "#05060f";
      ctx.fillRect(0, 0, W, H);
      drawSky(ctx, W, H, true);
      drawRunner(ctx, W / 2 - 30, H - 90, 5, 0, palette);
      ctx.fillStyle = "rgba(5,6,15,0.75)";
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = "center";
      ctx.fillStyle = "#10b981";
      ctx.font = pixelFont(10);
      ctx.fillText("WORKOUT CAM READY", W / 2, H / 2 - 10);
      ctx.fillStyle = "#94a3b8";
      ctx.font = pixelFont(7);
      ctx.fillText("UPLOAD & TAP GENERATE", W / 2, H / 2 + 12);
      return;
    }

    const render = () => {
      tickRef.current += TIME_SCALE;
      const t = tickRef.current;

      if (tab === "workout") {
        const source = videoRef.current ?? photoRef.current;
        if (source) {
          if (videoRef.current) {
            const v = videoRef.current;
            if (v.paused) void v.play().catch(() => undefined);
          }
          drawFilteredPhoto(ctx, canvas, source, 0, 0, W, H, {
            tick: Math.floor(t),
            rec: true,
            chromaShift: 4,
          });
        } else {
          ctx.fillStyle = "#0b1020";
          ctx.fillRect(0, 0, W, H);
        }
        drawHud();
        drawAvatarBadge(t);
        drawOfficialLogo(ctx, W / 2, H - 52, 0.42, "center");
        raf = requestAnimationFrame(render);
        return;
      }

      const loop = t % 900;
      const groundY = H - 74;

      if (arcadeMode === "maze") {
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
          ctx.font = pixelFont(12);
          ctx.fillText("ROUTE CLEARED", W / 2, H * 0.36);
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
        drawRunner(ctx, 56, groundY, 5, Math.floor(t / 5), palette);
      } else if (loop < 720) {
        const approach = Math.max(0, 200 - (loop - 480));
        drawBoss(ctx, 150 + approach, groundY, 5, Math.floor(t / 6));
        drawRunner(ctx, 56, groundY, 5, Math.floor(t / 4), palette);
      } else {
        ctx.fillStyle = "rgba(9,10,26,0.86)";
        ctx.fillRect(0, 0, W, H);
        drawFireworks(ctx, W, H, loop - 720);
        ctx.textAlign = "center";
        ctx.fillStyle = "#10b981";
        ctx.font = pixelFont(14);
        ctx.fillText("LEVEL COMPLETE", W / 2, H * 0.38);
      }

      drawHud();
      drawAvatarBadge(t);
      raf = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(raf);
  }, [palette, run, tab, arcadeMode, generated, isVideo]);

  const recordClip = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    if (typeof MediaRecorder === "undefined" || !canvas.captureStream) return null;
    const mime = ["video/mp4", "video/webm;codecs=vp9", "video/webm"].find((m) =>
      MediaRecorder.isTypeSupported?.(m),
    );
    if (!mime) return null;
    const stream = canvas.captureStream(30);
    const rec = new MediaRecorder(stream, { mimeType: mime });
    const chunks: BlobPart[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const done = new Promise<{ blob: Blob; ext: string }>((resolve) => {
      rec.onstop = () =>
        resolve({
          blob: new Blob(chunks, { type: mime }),
          ext: mime.startsWith("video/mp4") ? "mp4" : "webm",
        });
    });
    rec.start();
    await new Promise((r) => setTimeout(r, tab === "workout" ? 6000 : 4000));
    rec.stop();
    return done;
  }, [tab]);

  const saveClip = async () => {
    setExporting(true);
    try {
      const result = await recordClip();
      if (!result) throw new Error("unsupported");
      const { blob, ext } = result;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `8bit-runner-${tab}-reel.${ext}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      playSfx("complete");
      toast.success("Reel exported with VHS filters");
    } catch {
      toast.error("Video export isn't supported on this device");
    } finally {
      setExporting(false);
    }
  };

  const shareClip = async () => {
    try {
      const result = await recordClip();
      if (!result) throw new Error("unsupported");
      const file = new File([result.blob], `8bit-runner-reel.${result.ext}`, {
        type: result.blob.type,
      });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "8-Bit Runner" });
      } else {
        await saveClip();
      }
    } catch {
      /* dismissed */
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-1 rounded-2xl border border-border bg-surface p-1">
        {(
          [
            { id: "workout" as const, label: "Workout Cam", hint: "Strava photo / video + VHS" },
            { id: "arcade" as const, label: "Arcade Reel", hint: "8-bit game animation" },
          ] as const
        ).map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              if (m.id !== tab) {
                playSfx("tap");
                setTab(m.id);
                tickRef.current = 0;
                setGenerated(false);
              }
            }}
            className={`rounded-xl px-2 py-2 text-left transition-colors ${
              tab === m.id
                ? "bg-elevated text-foreground shadow-[var(--shadow-card)]"
                : "text-muted-foreground"
            }`}
          >
            <span className="block text-[13px] font-medium">{m.label}</span>
            <span className="block text-[11px] text-muted-foreground">{m.hint}</span>
          </button>
        ))}
      </div>

      {tab === "arcade" && (
        <div className="grid grid-cols-2 gap-1 rounded-2xl border border-border bg-surface p-1">
          {ARCADE_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                if (m.id !== arcadeMode) {
                  playSfx("tap");
                  setArcadeMode(m.id);
                  tickRef.current = 0;
                  setGenerated(false);
                }
              }}
              className={`rounded-xl px-2 py-2 text-left transition-colors ${
                arcadeMode === m.id
                  ? "bg-elevated text-foreground shadow-[var(--shadow-card)]"
                  : "text-muted-foreground"
              }`}
            >
              <span className="block text-[13px] font-medium">{m.label}</span>
              <span className="block text-[11px] text-muted-foreground">{m.hint}</span>
            </button>
          ))}
        </div>
      )}

      <div className="relative mx-auto aspect-[9/16] w-full max-w-[300px] overflow-hidden rounded-3xl border border-border bg-black shadow-[var(--shadow-card)]">
        <canvas
          ref={canvasRef}
          className="pixelated block size-full object-contain"
          role="img"
          aria-label="9:16 VHS workout preview"
        />
        {booting && (
          <BootTerminal
            muted={!state.settings.audio}
            lines={[
              "> IMPORTING STRAVA WORKOUT MEDIA...",
              "> APPLYING TAPE GRAIN & CHROMA ABERRATION...",
              "> MATCHING PIXEL AVATAR OUTFIT...",
              tab === "workout"
                ? "> RENDERING DAZZ CAM VHS PREVIEW..."
                : "> RENDERING 8-BIT ARCADE REEL...",
            ]}
            onDone={() => setBooting(false)}
          />
        )}
      </div>

      <div className="flex gap-2.5">
        <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-border bg-surface py-3 text-[14px] font-medium text-foreground transition-colors hover:bg-elevated">
          <Upload className="size-4" />
          {mediaName ? "Change media" : "Upload photo / video"}
          <input
            type="file"
            accept="image/*,video/*"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onUpload(file);
            }}
          />
        </label>
        <button
          type="button"
          onClick={() => {
            playSfx("tap");
            tickRef.current = 0;
            setBooting(true);
            setGenerated(true);
          }}
          disabled={booting || (tab === "workout" && !mediaName)}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-[14px] font-semibold text-primary-foreground transition-opacity disabled:opacity-60"
        >
          <Sparkles className="size-4" />
          {booting ? "Rendering…" : generated ? "Generate again" : "Generate"}
        </button>
      </div>

      {generated && !booting && (
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={saveClip}
            disabled={exporting}
            className="flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-[14px] font-semibold text-primary-foreground disabled:opacity-60"
          >
            <Download className="size-4" />
            {exporting ? "Capturing…" : "Save reel"}
          </button>
          <button
            type="button"
            onClick={() => void shareClip()}
            disabled={exporting}
            className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-surface py-3.5 text-[14px] font-semibold text-foreground disabled:opacity-60"
          >
            <Share2 className="size-4" />
            Share
          </button>
        </div>
      )}
      <p className="text-[12px] text-muted-foreground">
        {mediaName
          ? `${isVideo ? "Video" : "Photo"} "${mediaName}" — VHS grain, chroma bleed, and pixel avatar applied locally.`
          : "Upload a Strava workout photo or video for Dazz Cam–style analog filters."}
      </p>
    </div>
  );
}
