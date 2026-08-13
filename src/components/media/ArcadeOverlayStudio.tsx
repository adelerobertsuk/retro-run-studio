import { useCallback, useEffect, useRef, useState } from "react";
import { Lock, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  ARCADE_OVERLAYS,
  getOverlaysByKind,
  renderArcadeOverlay,
  renderArcadeOverlaySync,
  type OverlayId,
  type OverlayKind,
} from "@/lib/arcade-overlays";
import { shareDataUrlToInstagramTikTok } from "@/lib/save-asset";
import { playSfx } from "@/lib/audio";
import { useGameState } from "@/lib/game-state";
import { getGladiatorStatusFromActivity } from "@/lib/gladiator-titles";
import { getStoreItem, isOverlayUnlocked } from "@/lib/arcade-store";
import { ArcadeCoinIcon } from "@/components/app/ArcadeCoinIcon";
import { ShareToSocialButton } from "./ShareToSocialButton";

function OverlayPreview({
  id,
  active,
  gladiator,
  locked,
}: {
  id: OverlayId;
  active: boolean;
  gladiator?: ReturnType<typeof getGladiatorStatusFromActivity>;
  locked: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (locked) return;
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = 120;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    renderArcadeOverlaySync(canvas, id, gladiator);
  }, [id, gladiator, locked]);

  if (locked) {
    return (
      <span className="flex size-[72px] items-center justify-center rounded-xl border border-border/60 bg-elevated/80">
        <Lock className="size-5 text-muted-foreground" />
      </span>
    );
  }

  return (
    <canvas
      ref={ref}
      className={`size-[72px] rounded-xl border border-border/40 ${active ? "ring-2 ring-primary" : ""}`}
      style={{
        backgroundImage:
          "linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)",
        backgroundSize: "12px 12px",
        backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0",
        backgroundColor: "#0f172a",
      }}
      aria-hidden
    />
  );
}

export function ArcadeOverlayStudio() {
  const { state, purchaseStoreItem } = useGameState();
  const gladiator = getGladiatorStatusFromActivity(state);
  const [filter, setFilter] = useState<OverlayKind | "all">("all");
  const [selected, setSelected] = useState<OverlayId>("victory-banner");
  const [photoSrc, setPhotoSrc] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visible = getOverlaysByKind(filter);
  const def = ARCADE_OVERLAYS.find((o) => o.id === selected)!;
  const selectedLocked = !isOverlayUnlocked(state.unlocked, selected);

  const refreshPreview = useCallback(async () => {
    if (selectedLocked) {
      setPreviewUrl(null);
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = await renderArcadeOverlay(canvas, selected, gladiator, photoSrc);
    setPreviewUrl(url);
  }, [selected, gladiator, photoSrc, selectedLocked]);

  useEffect(() => {
    void refreshPreview();
  }, [refreshPreview]);

  const trySelect = (id: OverlayId) => {
    const locked = !isOverlayUnlocked(state.unlocked, id);
    if (locked) {
      const item = getStoreItem(id);
      const cost = item?.tokens ?? 0;
      if (item && state.tokens >= cost && cost > 0) {
        const result = purchaseStoreItem(id);
        if (result) {
          playSfx("complete");
          toast.success(`${item.name} unlocked!`);
          setSelected(id);
          return;
        }
      }
      playSfx("tap");
      toast.message(cost > 0 ? `Unlock for ${cost} tokens` : "Locked");
      return;
    }
    playSfx("tap");
    setSelected(id);
  };

  const share = async () => {
    if (selectedLocked) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    setBusy(true);
    playSfx("tap");
    try {
      const url = await renderArcadeOverlay(canvas, selected, gladiator, photoSrc);
      await shareDataUrlToInstagramTikTok(url, `8bit-overlay-${selected}.png`);
      playSfx("complete");
    } catch {
      toast.error("Couldn't prepare share");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-1 rounded-2xl border border-border bg-surface p-1">
        {(
          [
            { id: "all" as const, label: "All" },
            { id: "sticker" as const, label: "Stickers" },
            { id: "quote" as const, label: "Quotes" },
          ] as const
        ).map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              playSfx("tap");
              setFilter(id);
              const first = getOverlaysByKind(id).find((o) =>
                isOverlayUnlocked(state.unlocked, o.id),
              );
              if (first) setSelected(first.id);
            }}
            className={`rounded-xl py-2 text-[12px] font-semibold transition-colors ${
              filter === id
                ? "bg-elevated text-foreground shadow-[var(--shadow-card)]"
                : "text-muted-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="-mx-5 flex gap-2.5 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {visible.map((overlay) => {
          const active = overlay.id === selected;
          const locked = !isOverlayUnlocked(state.unlocked, overlay.id);
          const cost = getStoreItem(overlay.id)?.tokens ?? 0;
          return (
            <button
              key={overlay.id}
              type="button"
              onClick={() => trySelect(overlay.id)}
              className={`flex min-w-[100px] shrink-0 flex-col items-center gap-2 rounded-2xl border p-2.5 transition-colors ${
                active
                  ? "border-primary/60 bg-primary/10"
                  : locked
                    ? "border-border/50 bg-surface/60 opacity-85"
                    : "border-border bg-surface hover:bg-elevated"
              }`}
            >
              <OverlayPreview
                id={overlay.id}
                active={active}
                gladiator={gladiator}
                locked={locked}
              />
              <span className="text-center text-[10px] font-semibold leading-tight text-foreground">
                {overlay.name}
              </span>
              {locked && cost > 0 ? (
                <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
                  <Lock className="size-2.5" />
                  <ArcadeCoinIcon className="size-2.5" />
                  {cost}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-3xl border border-border bg-black shadow-[var(--shadow-card)]">
        <label className="relative flex aspect-square w-full cursor-pointer items-center justify-center">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)",
              backgroundSize: "24px 24px",
              backgroundPosition: "0 0, 0 12px, 12px -12px, -12px 0",
              backgroundColor: "#0f172a",
            }}
          />
          {selectedLocked ? (
            <div className="relative z-10 px-6 text-center">
              <Lock className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 text-[14px] font-semibold text-foreground">Locked</p>
            </div>
          ) : previewUrl ? (
            <img
              src={previewUrl}
              alt={`${def.name} overlay preview`}
              className="relative z-10 max-h-full max-w-full object-contain"
            />
          ) : null}

          {!photoSrc && !selectedLocked && (
            <span className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-[#05060f]/80 backdrop-blur-[2px] transition-colors hover:bg-[#05060f]/70">
              <span className="flex size-14 items-center justify-center rounded-2xl border border-primary/35 bg-primary/10 text-primary">
                <Upload className="size-6" />
              </span>
              <span className="text-[13px] font-medium text-muted-foreground">
                Tap to upload photo
              </span>
            </span>
          )}

          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              playSfx("tap");
              const reader = new FileReader();
              reader.onload = () => setPhotoSrc(reader.result as string);
              reader.readAsDataURL(file);
            }}
          />
        </label>

        {photoSrc && !selectedLocked && (
          <div className="border-t border-border bg-surface px-4 py-2 text-center">
            <button
              type="button"
              onClick={() => setPhotoSrc(null)}
              className="text-[12px] font-medium text-primary"
            >
              Remove photo
            </button>
          </div>
        )}
      </div>

      <ShareToSocialButton onClick={share} disabled={selectedLocked} busy={busy} />

      <canvas ref={canvasRef} className="hidden" aria-hidden />
    </div>
  );
}
