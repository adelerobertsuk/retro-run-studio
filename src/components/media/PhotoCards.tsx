import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Loader2, Lock, Share2, Sparkles, Upload, Zap } from "lucide-react";
import { toast } from "sonner";
import { RIGS } from "@/lib/rigs";
import { editImage, streamImage } from "@/lib/stream-image";
import { useGameState, type RunEntry } from "@/lib/game-state";
import { playSfx } from "@/lib/audio";
import { BootTerminal } from "./BootTerminal";
import { paletteFromImage, paletteFromUrl } from "@/lib/avatar-palette";
import { composeHeroCard } from "@/lib/hero-card";
import { workoutMediaToImageUrl } from "@/lib/media-upload";
import { getAvatarPalette } from "@/lib/arcade-store";
import type { Palette } from "@/components/app/pixel-scene";
import { DEFAULT_PALETTE } from "@/components/app/pixel-scene";

export function PhotoCards({ run }: { run: RunEntry }) {
  const { state, setNotes } = useGameState();
  const [rigId, setRigId] = useState(RIGS[0]!.id);
  const [workoutFile, setWorkoutFile] = useState<File | null>(null);
  const [workoutUrl, setWorkoutUrl] = useState<string | null>(null);
  const [palette, setPalette] = useState<Palette>(DEFAULT_PALETTE);
  const [art, setArt] = useState<string | null>(null);
  const [isFinal, setIsFinal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [booting, setBooting] = useState(false);
  const [bootDone, setBootDone] = useState(false);
  const [cardUrl, setCardUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const rig = RIGS.find((r) => r.id === rigId)!;
  const locked = !state.unlocked.includes(rig.id);

  useEffect(() => {
    if (!workoutFile) return;
    let revoked: string | null = null;
    void (async () => {
      try {
        const url = await workoutMediaToImageUrl(workoutFile);
        if (!workoutFile.type.startsWith("video/")) revoked = url;
        setWorkoutUrl(url);
        if (workoutFile.type.startsWith("image/")) {
          setPalette(await paletteFromImage(workoutFile));
        }
      } catch {
        toast.error("Couldn't read that workout file");
      }
    })();
    return () => {
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [workoutFile]);

  const compose = useCallback(
    async (photoSrc: string | null) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      let pal = palette;
      if (photoSrc && palette === DEFAULT_PALETTE) {
        try {
          pal = await paletteFromUrl(photoSrc);
          setPalette(pal);
        } catch {
          /* keep default */
        }
      }
      const avatarPal = getAvatarPalette(state.loadout.avatarStyle);
      const url = await composeHeroCard(canvas, {
        run,
        palette: photoSrc ? pal : avatarPal,
        photoSrc,
        notes: state.adventurerNotes,
      });
      setCardUrl(url);
    },
    [palette, run, state.adventurerNotes, state.loadout.avatarStyle],
  );

  const generate = useCallback(async () => {
    if (locked) {
      toast.error(`${rig.name} is locked`, {
        description: `Unlock it in the Arcade for ${rig.tokens} tokens.`,
      });
      return;
    }
    const localOnly = rig.id === "rig-rpg" || rig.id === "rig-vhs";
    if (localOnly) {
      setBooting(true);
      setBootDone(false);
      setArt(null);
      setIsFinal(false);
      await compose(workoutUrl);
      return;
    }
    if (!state.settings.avatarConsent) {
      if (workoutUrl) {
        setBooting(true);
        setBootDone(false);
        await compose(workoutUrl);
        toast.info("AI avatar consent is off", {
          description: "Card rendered with your workout photo and pixel avatar.",
        });
        return;
      }
      toast.error("AI avatar consent is off", {
        description: "Enable it in Settings or upload a workout photo.",
      });
      return;
    }
    setBusy(true);
    setBooting(true);
    setBootDone(false);
    setArt(null);
    setIsFinal(false);
    setCardUrl(null);
    try {
      const onFrame = (dataUrl: string, final: boolean) => {
        setArt(dataUrl);
        setIsFinal(final);
      };
      if (workoutFile?.type.startsWith("image/")) {
        await editImage(
          workoutFile,
          `Transform this person into ${rig.prompt("the runner in this photo")} Keep their hair, skin tone and outfit colors recognizable.`,
          onFrame,
        );
      } else {
        await streamImage(rig.prompt("a determined distance runner"), onFrame);
      }
    } catch (err) {
      if (workoutUrl) {
        await compose(workoutUrl);
        toast.warning("AI art unavailable — used your workout photo", {
          description: "Card rendered with VHS filter and pixel avatar.",
        });
      } else {
        toast.error("Render failed", {
          description: err instanceof Error ? err.message : "Try again in a moment.",
        });
      }
    } finally {
      setBusy(false);
    }
  }, [locked, rig, workoutFile, workoutUrl, compose, state.settings.avatarConsent]);

  useEffect(() => {
    if (bootDone && !busy) {
      setBooting(false);
      playSfx("complete");
    }
  }, [bootDone, busy]);

  useEffect(() => {
    if (art && isFinal) void compose(art);
  }, [art, isFinal, compose]);

  const download = () => {
    if (!cardUrl) return;
    const a = document.createElement("a");
    a.href = cardUrl;
    a.download = `8bit-runner-hero-${run.date}.png`;
    a.click();
    toast.success("Hero card saved");
  };

  const share = async () => {
    if (!cardUrl) return;
    try {
      const blob = await (await fetch(cardUrl)).blob();
      const file = new File([blob], "8bit-runner-hero-card.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "8-Bit Runner" });
      } else {
        download();
      }
    } catch {
      /* dismissed */
    }
  };

  return (
    <div className="space-y-4">
      <div className="-mx-5 flex gap-2.5 overflow-x-auto px-5 pb-1 scrollbar-none">
        {RIGS.map((r) => {
          const isLocked = !state.unlocked.includes(r.id);
          const active = r.id === rigId;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => setRigId(r.id)}
              className={`min-w-[168px] shrink-0 rounded-2xl border p-3 text-left transition-colors ${
                active
                  ? "border-primary/60 bg-primary/10"
                  : "border-border bg-surface hover:bg-elevated"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: r.accent }}
                  aria-hidden
                />
                {isLocked && <Lock className="size-3.5 text-muted-foreground" />}
              </div>
              <p className="mt-2 text-[13px] font-semibold text-foreground">{r.name}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{r.tagline}</p>
            </button>
          );
        })}
      </div>

      <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-border bg-surface p-3.5 transition-colors hover:bg-elevated">
        {workoutUrl ? (
          <img
            src={workoutUrl}
            alt="Uploaded Strava workout"
            className="size-12 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-elevated text-muted-foreground">
            <Upload className="size-5" />
          </span>
        )}
        <span className="min-w-0">
          <span className="block text-[14px] font-medium text-foreground">
            {workoutFile ? "Change workout media" : "Upload Strava photo or video"}
          </span>
          <span className="block truncate text-[12px] text-muted-foreground">
            {workoutFile
              ? workoutFile.name
              : "JPG, PNG, or MP4 — Dazz Cam VHS grain & chroma applied locally."}
          </span>
        </span>
        <input
          type="file"
          accept="image/*,video/*"
          className="sr-only"
          onChange={(e) => setWorkoutFile(e.target.files?.[0] ?? null)}
        />
      </label>

      <div className="relative overflow-hidden rounded-3xl border border-border bg-elevated">
        <div className="aspect-[2/3] w-full">
          {cardUrl ? (
            <img
              src={cardUrl}
              alt={`Hero card for ${run.title}`}
              className="pixelated size-full object-contain"
            />
          ) : art ? (
            <img
              src={art}
              alt="Rendering preview"
              className={`size-full object-cover transition-[filter] duration-300 ${isFinal ? "blur-0" : "blur-2xl"}`}
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-2 p-6 text-center">
              <Sparkles className="size-7 text-muted-foreground" />
              <p className="text-[13px] text-muted-foreground">
                Upload a workout snap, pick a filter style, then render your hero card.
              </p>
            </div>
          )}
        </div>
        {booting && (
          <BootTerminal
            muted={!state.settings.audio}
            lines={[
              "> IMPORTING STRAVA WORKOUT MEDIA...",
              "> APPLYING VHS TAPE GRAIN & CHROMA BLEED...",
              "> SYNTHESIZING PIXEL AVATAR FROM OUTFIT...",
              `> STAMPING ${rig.name.toUpperCase()} HERO CARD...`,
            ]}
            onDone={() => setBootDone(true)}
          />
        )}
        {busy && !booting && (
          <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-background/80 px-4 py-2.5 backdrop-blur">
            <Loader2 className="size-4 animate-spin text-primary" />
            <span className="text-[12px] text-foreground">Rendering hero card…</span>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => {
          playSfx("tap");
          void generate();
        }}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-[15px] font-semibold text-primary-foreground transition-opacity disabled:opacity-60"
      >
        {locked ? <Lock className="size-4" /> : <Zap className="size-4" />}
        {locked ? `Unlock for ${rig.tokens} tokens` : "Render Hero Card"}
      </button>

      <div className="rounded-2xl border border-border bg-surface p-4">
        <label
          htmlFor="notes"
          className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground"
        >
          Adventurer notes
        </label>
        <textarea
          id="notes"
          value={state.adventurerNotes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mt-2 w-full resize-none rounded-xl border border-border bg-elevated p-3 text-[14px] text-foreground outline-none focus:border-primary/60"
          placeholder="What happened out there?"
        />
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <button
          type="button"
          onClick={download}
          disabled={!cardUrl}
          className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-surface py-3 text-[11px] font-medium text-foreground transition-colors enabled:hover:bg-elevated disabled:opacity-45"
        >
          <Download className="size-4" />
          Camera Roll
        </button>
        <button
          type="button"
          onClick={() => void share()}
          disabled={!cardUrl}
          className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-surface py-3 text-[11px] font-medium text-foreground transition-colors enabled:hover:bg-elevated disabled:opacity-45"
        >
          <Share2 className="size-4" />
          Share Card
        </button>
        <button
          type="button"
          onClick={() =>
            toast("Strava attach coming soon", {
              description: "Connect your account in Settings to post directly.",
            })
          }
          className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-surface py-3 text-[11px] font-medium text-foreground transition-colors hover:bg-elevated"
        >
          <Zap className="size-4" />
          Strava
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
