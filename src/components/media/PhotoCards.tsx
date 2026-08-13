import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { InstaSQCameraIcon, DQSClassicCameraIcon } from "./VintageCameraIcons";
import { toast } from "sonner";
import { PHOTO_BOOTHS, type PhotoBoothId } from "@/lib/camera-filters";
import { composePhotoBooth, composePhotoBoothPreview } from "@/lib/photo-booth";
import { shareDataUrlToInstagramTikTok } from "@/lib/save-asset";
import { ShareToSocialButton } from "./ShareToSocialButton";
import { useGameState, type RunEntry } from "@/lib/game-state";
import { playSfx } from "@/lib/audio";
import { BootTerminal } from "./BootTerminal";
import { ExportModeToggle } from "./ExportModeToggle";
import { MediaFilterRow } from "./MediaFilterRow";
import { MediaUploadStage } from "./MediaUploadStage";
import { isFilterUnlocked } from "@/lib/arcade-store";
import { getGladiatorStatusFromActivity } from "@/lib/gladiator-titles";
import { workoutMediaToImageUrl } from "@/lib/media-upload";
import type { MediaExportMode } from "@/lib/synthwave-overlay";

export function PhotoCards({ run }: { run: RunEntry }) {
  const { state } = useGameState();
  const [boothId, setBoothId] = useState<PhotoBoothId>(state.loadout.photoBooth);
  const [exportMode, setExportMode] = useState<MediaExportMode>("gamer");
  const [workoutFile, setWorkoutFile] = useState<File | null>(null);
  const [workoutUrl, setWorkoutUrl] = useState<string | null>(null);
  const [booting, setBooting] = useState(false);
  const [busy, setBusy] = useState(false);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const exportRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setBoothId(state.loadout.photoBooth);
  }, [state.loadout.photoBooth]);

  useEffect(() => {
    if (!workoutFile) {
      setWorkoutUrl(null);
      return;
    }
    let revoked: string | null = null;
    let cancelled = false;
    void (async () => {
      try {
        const url = await workoutMediaToImageUrl(workoutFile);
        if (cancelled) return;
        if (!workoutFile.type.startsWith("video/")) revoked = url;
        setWorkoutUrl(url);
      } catch {
        if (!cancelled) toast.error("Couldn't read that file");
      }
    })();
    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [workoutFile]);

  const gladiator = getGladiatorStatusFromActivity(state);
  const boothOptions = useMemo(
    () => ({
      run,
      booth: boothId,
      border: state.loadout.cardBorder,
      avatarStyle: state.loadout.avatarStyle,
      photoSrc: workoutUrl,
      gladiator,
      exportMode,
    }),
    [
      run,
      boothId,
      state.loadout.cardBorder,
      state.loadout.avatarStyle,
      workoutUrl,
      gladiator,
      exportMode,
    ],
  );

  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas) return;
    let cancelled = false;
    void composePhotoBoothPreview(canvas, boothOptions).catch(() => {
      if (!cancelled) {
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.fillStyle = "#0a0618";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boothOptions]);

  const generate = useCallback(async () => {
    if (!isFilterUnlocked(state.unlocked, boothId)) {
      toast.error("Booth style locked");
      return;
    }
    const canvas = exportRef.current;
    if (!canvas) return;

    setBusy(true);
    setBooting(true);
    playSfx("tap");

    try {
      const url = await composePhotoBooth(canvas, boothOptions);
      const shared = await shareDataUrlToInstagramTikTok(url, `8bit-runner-photo-${run.date}.png`);
      if (shared) playSfx("complete");
    } catch {
      toast.error("Couldn't render photo booth export");
    } finally {
      setBooting(false);
      setBusy(false);
    }
  }, [boothId, boothOptions, run.date, state.unlocked]);

  const filterItems = PHOTO_BOOTHS.map((b) => ({
    id: b.id,
    name: b.name,
    icon:
      b.id === "booth-fuji" ? (
        <InstaSQCameraIcon className="size-10" />
      ) : (
        <DQSClassicCameraIcon className="size-10" />
      ),
  }));

  return (
    <div className="space-y-4">
      <MediaFilterRow items={filterItems} activeId={boothId} onSelect={(id) => setBoothId(id as PhotoBoothId)} />

      <ExportModeToggle mode={exportMode} onChange={setExportMode} />

      <MediaUploadStage
        hasMedia={!!workoutUrl}
        accept="image/*,video/*"
        onFile={(file) => setWorkoutFile(file)}
        emptyLabel="Tap to upload photo"
      >
        <canvas
          ref={previewRef}
          className="block size-full object-contain"
          style={{ aspectRatio: "2 / 3" }}
          role="img"
          aria-label={`Photo booth preview for ${run.title}`}
        />
        {booting && (
          <BootTerminal
            muted={!state.settings.audio}
            duration={1200}
            lines={[
              "> PULLING ROUTE MAP...",
              exportMode === "aesthetic"
                ? "> APPLYING NEON CHROME OVERLAY..."
                : "> STAMPING 8-BIT VICTORY PANEL...",
              "> SAVING TO CAMERA ROLL...",
            ]}
            onDone={() => setBooting(false)}
          />
        )}
      </MediaUploadStage>

      <ShareToSocialButton onClick={generate} disabled={busy} busy={busy} />

      <canvas ref={exportRef} className="hidden" />
    </div>
  );
}
