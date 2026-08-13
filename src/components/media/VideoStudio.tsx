import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { BootTerminal } from "./BootTerminal";
import { ExportModeToggle } from "./ExportModeToggle";
import { MediaFilterRow } from "./MediaFilterRow";
import { MediaUploadStage } from "./MediaUploadStage";
import { CineSFCameraIcon, GoldPortraCameraIcon } from "./VintageCameraIcons";
import { useGameState } from "@/lib/game-state";
import { playSfx } from "@/lib/audio";
import { isFilterUnlocked } from "@/lib/arcade-store";
import { VIDEO_FILTERS, drawVideoFilterFrame, type VideoFilterId } from "@/lib/camera-filters";
import { ROUTE_TOTAL_FRAMES, drawGamerMediaOverlay } from "@/lib/route-reveal";
import { getGladiatorStatusFromActivity } from "@/lib/gladiator-titles";
import { shareToInstagramTikTok } from "@/lib/save-asset";
import { ShareToSocialButton } from "./ShareToSocialButton";
import { EXPORT_PLAYBACK_SPEED, type MediaExportMode } from "@/lib/synthwave-overlay";
import type { RunEntry } from "@/lib/game-state";

const W = 270;
const H = 480;
const SCALE = 4;
const AESTHETIC_EXPORT_MS = 4500;

type Props = { run: RunEntry };

export function VideoStudio({ run }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const photoRef = useRef<HTMLImageElement | null>(null);
  const tickRef = useRef(0);
  const exportingRef = useRef(false);
  const { state } = useGameState();
  const gladiator = getGladiatorStatusFromActivity(state);

  const [filterId, setFilterId] = useState<VideoFilterId>(state.loadout.videoFilter);
  const [exportMode, setExportMode] = useState<MediaExportMode>("gamer");
  const [hasMedia, setHasMedia] = useState(false);
  const [booting, setBooting] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [previewRoute, setPreviewRoute] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setFilterId(state.loadout.videoFilter);
  }, [state.loadout.videoFilter]);

  const onUpload = useCallback(async (file: File) => {
    setHasMedia(true);
    if (file.type.startsWith("image/")) {
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
    }
    setPlaying(false);
    setPreviewRoute(true);
  }, []);

  const recordAndSave = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || exportingRef.current) return;
    if (typeof MediaRecorder === "undefined" || !canvas.captureStream) {
      toast.error("Video export isn't supported on this device");
      return;
    }
    const mime = ["video/mp4", "video/webm;codecs=vp9", "video/webm"].find((m) =>
      MediaRecorder.isTypeSupported?.(m),
    );
    if (!mime) {
      toast.error("Video export isn't supported on this device");
      return;
    }

    exportingRef.current = true;
    setBusy(true);
    tickRef.current = 0;
    setPreviewRoute(exportMode === "gamer");
    setPlaying(true);

    try {
      const stream = canvas.captureStream(30);
      const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6_000_000 });
      const chunks: BlobPart[] = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const blobPromise = new Promise<Blob>((resolve, reject) => {
        rec.onstop = () => resolve(new Blob(chunks, { type: mime }));
        rec.onerror = () => reject(new Error("Record failed"));
      });

      rec.start(250);

      const exportMs =
        exportMode === "aesthetic"
          ? AESTHETIC_EXPORT_MS
          : (ROUTE_TOTAL_FRAMES / 24 / EXPORT_PLAYBACK_SPEED) * 1000 + 250;
      await new Promise((r) => setTimeout(r, exportMs));

      if (rec.state !== "inactive") rec.stop();
      const blob = await blobPromise;

      if (!blob.size) {
        toast.error("Nothing to share — upload a video or photo first");
        return;
      }

      const ext = mime.startsWith("video/mp4") ? "mp4" : "webm";
      const shared = await shareToInstagramTikTok(blob, `8bit-runner-reel-${run.date}.${ext}`);
      if (shared) playSfx("complete");
    } catch {
      toast.error("Could not export video");
    } finally {
      setPlaying(false);
      setPreviewRoute(true);
      setBusy(false);
      exportingRef.current = false;
    }
  }, [run.date, exportMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = W * SCALE * dpr;
    canvas.height = H * SCALE * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = exportMode === "aesthetic";
    ctx.setTransform(SCALE * dpr, 0, 0, SCALE * dpr, 0, 0);

    let raf = 0;
    const fullBox = { x: 0, y: 0, w: W, h: H };

    const render = () => {
      const frame = Math.floor(tickRef.current);
      const source = videoRef.current ?? photoRef.current;

      if (source) {
        if (videoRef.current?.paused) void videoRef.current.play().catch(() => undefined);
        drawVideoFilterFrame(ctx, canvas, source, 0, 0, W, H, filterId, frame);
      } else if (exportMode === "aesthetic") {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, "#12061f");
        g.addColorStop(1, "#06040f");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      } else {
        ctx.fillStyle = "#05060f";
        ctx.fillRect(0, 0, W, H);
      }

      if (exportMode === "gamer") {
        const overlayFrame = playing
          ? frame % ROUTE_TOTAL_FRAMES
          : previewRoute
            ? ROUTE_TOTAL_FRAMES - 1
            : -1;
        if (overlayFrame >= 0) {
          drawGamerMediaOverlay(ctx, run, fullBox, overlayFrame, gladiator);
        }
      }

      if (playing && exportMode === "gamer") tickRef.current += EXPORT_PLAYBACK_SPEED;
      raf = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(raf);
  }, [run, filterId, playing, previewRoute, exportMode, gladiator]);

  const generate = () => {
    if (!isFilterUnlocked(state.unlocked, filterId)) {
      toast.error("Filter locked");
      return;
    }
    playSfx("tap");
    setBooting(true);
    tickRef.current = 0;
  };

  const onBootDone = () => {
    setBooting(false);
    void recordAndSave();
  };

  const filterItems = VIDEO_FILTERS.map((f) => ({
    id: f.id,
    name: f.name,
    icon:
      f.id === "filter-fuji" ? (
        <CineSFCameraIcon className="size-10" />
      ) : (
        <GoldPortraCameraIcon className="size-10" />
      ),
  }));

  return (
    <div className="space-y-3">
      <MediaFilterRow items={filterItems} activeId={filterId} onSelect={(id) => setFilterId(id as VideoFilterId)} />

      <ExportModeToggle mode={exportMode} onChange={setExportMode} />

      <MediaUploadStage
        hasMedia={hasMedia}
        accept="image/*,video/*"
        onFile={(file) => void onUpload(file)}
        emptyLabel="Tap to upload video"
      >
        <canvas
          ref={canvasRef}
          className="pixelated block size-full object-contain"
          role="img"
          aria-label="9:16 video route reveal preview"
        />
        {booting && (
          <BootTerminal
            muted={!state.settings.audio}
            duration={1400}
            lines={[
              "> SYNCING ROUTE DATA...",
              exportMode === "aesthetic"
                ? "> APPLYING CINEMATIC FILM GRADE..."
                : "> RENDERING NEON GRID OVERLAY...",
              "> COMPOSITING FINAL REEL...",
            ]}
            onDone={onBootDone}
          />
        )}
      </MediaUploadStage>

      <ShareToSocialButton
        onClick={generate}
        disabled={booting || busy}
        busy={busy || booting}
        className="w-full"
      />
    </div>
  );
}
