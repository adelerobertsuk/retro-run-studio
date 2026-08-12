import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Loader2, Lock, Share2, Sparkles, Upload, Zap } from "lucide-react";
import { toast } from "sonner";
import { RIGS } from "@/lib/rigs";
import { editImage, streamImage } from "@/lib/stream-image";
import { formatPace, useGameState, type RunEntry } from "@/lib/game-state";
import { playSfx } from "@/lib/audio";
import { BootTerminal } from "./BootTerminal";
import { drawQrBadge, drawStamp, pixelateInto } from "@/lib/card-art";

const CARD_W = 1080;
const CARD_H = 1620;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function PhotoCards({ run }: { run: RunEntry }) {
  const { state, setNotes } = useGameState();
  const [rigId, setRigId] = useState(RIGS[0]!.id);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
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
    if (!selfie) return;
    const url = URL.createObjectURL(selfie);
    setSelfieUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selfie]);

  const compose = useCallback(
    async (artSrc: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = CARD_W;
      canvas.height = CARD_H;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const bg = ctx.createLinearGradient(0, 0, 0, CARD_H);
      bg.addColorStop(0, "#131a33");
      bg.addColorStop(1, "#090c1c");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, CARD_W, CARD_H);

      const img = await loadImage(artSrc);
      const artBox = { x: 60, y: 190, w: CARD_W - 120, h: 900 };
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(artBox.x, artBox.y, artBox.w, artBox.h, 28);
      ctx.clip();
      pixelateInto(
        ctx,
        img,
        img.width,
        img.height,
        artBox.x,
        artBox.y,
        artBox.w,
        artBox.h,
        160,
      );
      // header scanline sheen keeps the photo reading as 8-bit art
      ctx.fillStyle = "rgba(5,6,15,0.16)";
      for (let y = artBox.y; y < artBox.y + artBox.h; y += 6) {
        ctx.fillRect(artBox.x, y, artBox.w, 2);
      }
      ctx.restore();
      ctx.strokeStyle = "rgba(16,185,129,0.55)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(artBox.x, artBox.y, artBox.w, artBox.h, 28);
      ctx.stroke();

      // Character title plate over the bottom of the portrait
      ctx.fillStyle = "rgba(5,6,15,0.82)";
      ctx.beginPath();
      ctx.roundRect(artBox.x + 24, artBox.y + artBox.h - 130, artBox.w - 48, 100, 18);
      ctx.fill();
      ctx.fillStyle = "#f8fafc";
      ctx.font = "700 44px ui-sans-serif, system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`${run.title.toUpperCase()}`, artBox.x + 48, artBox.y + artBox.h - 78);
      ctx.fillStyle = "#10b981";
      ctx.font = "600 26px ui-monospace, Menlo, monospace";
      ctx.fillText(
        `LV ${Math.max(1, Math.round(run.miles))} · ROAD ADVENTURER`,
        artBox.x + 48,
        artBox.y + artBox.h - 44,
      );

      // QR badge
      drawQrBadge(ctx, CARD_W - 210, 1130, 120, `${run.title}-${run.miles}`);

      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.roundRect(30, 30, CARD_W - 60, CARD_H - 60, 40);
      ctx.stroke();

      ctx.fillStyle = "#e2e8f0";
      ctx.font = "600 58px ui-sans-serif, system-ui, sans-serif";
      ctx.fillText(rig.name.toUpperCase(), 66, 130);
      ctx.fillStyle = "#6366f1";
      ctx.font = "500 30px ui-sans-serif, system-ui, sans-serif";
      ctx.fillText(run.title.toUpperCase(), 66, 172);

      const stats: [string, string][] = [
        ["DISTANCE", `${run.miles.toFixed(2)} mi`],
        ["PACE", `${formatPace(run.paceSeconds)} /mi`],
        ["TOP SPEED", `${run.topSpeed.toFixed(1)} mph`],
      ];
      stats.forEach(([label, value], i) => {
        const x = 70 + i * 260;
        ctx.fillStyle = "#94a3b8";
        ctx.font = "500 26px ui-sans-serif, system-ui, sans-serif";
        ctx.fillText(label, x, 1170);
        ctx.fillStyle = "#fbbf24";
        ctx.font = "700 40px ui-monospace, Menlo, monospace";
        ctx.fillText(value, x, 1225);
      });

      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.roundRect(60, 1270, CARD_W - 120, 260, 24);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#94a3b8";
      ctx.font = "600 26px ui-sans-serif, system-ui, sans-serif";
      ctx.fillText("ADVENTURER NOTES", 90, 1325);
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "400 32px ui-sans-serif, system-ui, sans-serif";
      const words = (state.adventurerNotes || "No notes recorded.").split(" ");
      let line = "";
      let y = 1380;
      for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > CARD_W - 200) {
          ctx.fillText(line, 90, y);
          line = word;
          y += 44;
          if (y > 1500) break;
        } else {
          line = test;
        }
      }
      if (y <= 1500) ctx.fillText(line, 90, y);

      drawStamp(ctx, CARD_W - 150, CARD_H - 110, 66, "VERIFIED", "STRAVA");

      ctx.fillStyle = "#64748b";
      ctx.font = "500 24px ui-sans-serif, system-ui, sans-serif";
      ctx.fillText("8-BIT RUNNER · POWERED BY STRAVA", 66, CARD_H - 60);

      setCardUrl(canvas.toDataURL("image/png"));
    },
    [rig.name, run, state.adventurerNotes],
  );

  const generate = useCallback(async () => {
    if (locked) {
      toast.error(`${rig.name} is locked`, {
        description: `Unlock it in the Arcade for ${rig.tokens} tokens.`,
      });
      return;
    }
    if (!state.settings.avatarConsent) {
      if (selfieUrl) {
        setBooting(true);
        setBootDone(false);
        await compose(selfieUrl);
        toast.info("AI avatar consent is off", {
          description: "Card rendered with the pixel filter on your photo.",
        });
        return;
      }
      toast.error("AI avatar consent is off", {
        description: "Enable it in Settings to render your character art.",
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
      if (selfie) {
        await editImage(
          selfie,
          `Transform this person into ${rig.prompt("the runner in this photo")} Keep their hair, skin tone and outfit colors recognizable.`,
          onFrame,
        );
      } else {
        await streamImage(rig.prompt("a determined distance runner"), onFrame);
      }
    } catch (err) {
      if (selfieUrl) {
        // Fall back to a pixel-filtered version of the uploaded photo so the
        // card always renders in the full RPG trading-card format.
        await compose(selfieUrl);
        toast.warning("AI art unavailable — used your photo", {
          description: "Card rendered with the pixel filter instead.",
        });
      } else {
        toast.error("Render failed", {
          description: err instanceof Error ? err.message : "Try again in a moment.",
        });
      }
    } finally {
      setBusy(false);
    }
  }, [locked, rig, selfie, selfieUrl, compose, state.settings.avatarConsent]);

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
    a.download = `8bit-runner-${rig.id}.png`;
    a.click();
    toast.success("Saved to your camera roll");
  };

  const share = async () => {
    if (!cardUrl) return;
    try {
      const blob = await (await fetch(cardUrl)).blob();
      const file = new File([blob], "8bit-runner-card.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "8-Bit Runner" });
      } else {
        download();
      }
    } catch {
      /* user dismissed the share sheet */
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
        {selfieUrl ? (
          <img
            src={selfieUrl}
            alt="Your uploaded selfie"
            className="size-12 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-elevated text-muted-foreground">
            <Upload className="size-5" />
          </span>
        )}
        <span className="min-w-0">
          <span className="block text-[14px] font-medium text-foreground">
            {selfie ? "Change selfie" : "Upload selfie"}
          </span>
          <span className="block truncate text-[12px] text-muted-foreground">
            {selfie ? selfie.name : "JPG or PNG — pixel-filtered into your card art."}
          </span>
        </span>
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => setSelfie(e.target.files?.[0] ?? null)}
        />
      </label>

      <div className="relative overflow-hidden rounded-3xl border border-border bg-elevated">
        <div className="aspect-[2/3] w-full">
          {cardUrl ? (
            <img
              src={cardUrl}
              alt={`${rig.name} card for ${run.title}`}
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
                Pick a style above, then tap Render Card.
              </p>
            </div>
          )}
        </div>
        {booting && (
          <BootTerminal
            muted={!state.settings.audio}
            lines={[
              "> CONNECTING STRAVA ENGINE...",
              "> ANALYZING GPS ROUTE & TELEMETRY...",
              "> SPRITE SYNTHESIS: MATCHING OUTFITS & AVATARS...",
              `> RENDERING ${rig.name.toUpperCase()} CARD...`,
            ]}
            onDone={() => setBootDone(true)}
          />
        )}
        {busy && !booting && (
          <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-background/80 px-4 py-2.5 backdrop-blur">
            <Loader2 className="size-4 animate-spin text-primary" />
            <span className="text-[12px] text-foreground">Rendering 8-bit artwork…</span>
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
        {locked ? `Unlock for ${rig.tokens} tokens` : "Render Card"}
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
          TikTok / Reels
        </button>
        <button
          type="button"
          onClick={() =>
            toast("Strava attach coming soon", {
              description: "Connect your account in Settings to enable uploads.",
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
