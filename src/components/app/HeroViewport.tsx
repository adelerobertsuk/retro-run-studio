import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ChevronRight, MapPin } from "lucide-react";
import { DEFAULT_PALETTE, drawGround, drawRunner, drawSky, drawSkyline } from "./pixel-scene";
import { cityLevel, drawLandmark, getCity } from "@/lib/cities";
import { playSfx } from "@/lib/audio";
import { useGameState } from "@/lib/game-state";

const W = 320;
const H = 160;
const GROUND_Y = H - 26;
const RUNNER_PX = 4;
const RUNNER_W = 12 * RUNNER_PX;
const RUNNER_H = 16 * RUNNER_PX;
const MIN_X = 8;
const MAX_X = W - RUNNER_W - 8;

const GRAVITY = 0.9; // px per frame^2 (at 60fps)
const JUMP_V = -13; // fixed-arc jump
const WALK_SPEED = 0.9;

const BLOCK_W = 74;
const BLOCK_H = 20;
const BLOCK_Y = 44;

const BLOCKS = [
  { to: "/quest", label: "QUEST", x: 16 },
  { to: "/media", label: "MEDIA", x: 123 },
  { to: "/arcade", label: "ARCADE", x: 230 },
] as const;

type Props = { cityId: string; onOpenCities: () => void };

/**
 * Interactive 8-bit "Jumpman" viewport: parabolic jump physics plus real
 * horizontal movement (arrow keys or the on-screen pads). The scene stays
 * still until the player starts, so nothing flashes on load.
 */
export function HeroViewport({ cityId, onOpenCities }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const dirRef = useRef(1);
  const playerRef = useRef({ x: 54, y: 0, vy: 0, air: false, frame: 0 });
  const hitRef = useRef<{ index: number; until: number } | null>(null);
  const navigatingRef = useRef(false);
  const [jumps, setJumps] = useState(0);
  const city = getCity(cityId);
  const navigate = useNavigate();
  const { claimDailyBonus } = useGameState();

  // Static background, rendered once per city into an offscreen canvas.
  useEffect(() => {
    const bg = document.createElement("canvas");
    bg.width = W;
    bg.height = H;
    const ctx = bg.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    drawSky(ctx, W, H, true);
    drawSkyline(ctx, W, GROUND_Y, 0, 0);
    drawSkyline(ctx, W, GROUND_Y, 0, 1);
    drawLandmark(ctx, cityId, W * 0.72, GROUND_Y);
    bgRef.current = bg;
    paint();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityId]);

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const bg = bgRef.current;
    if (!canvas || !ctx || !bg) return;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(bg, 0, 0);
    drawGround(ctx, W, H, GROUND_Y, 0);

    const hit = hitRef.current;
    BLOCKS.forEach((b, i) => {
      const lit = hit && hit.index === i && performance.now() < hit.until;
      const y = BLOCK_Y - (lit ? 3 : 0);
      ctx.fillStyle = lit ? "#fbbf24" : "#6366f1";
      ctx.fillRect(b.x, y, BLOCK_W, BLOCK_H);
      ctx.fillStyle = lit ? "#fde68a" : "#a5b4fc";
      ctx.fillRect(b.x, y, BLOCK_W, 2);
      ctx.fillStyle = lit ? "#3b2a06" : "#e0e7ff";
      ctx.font = '7px "Press Start 2P", ui-monospace, Menlo, monospace';
      ctx.textAlign = "center";
      ctx.fillText(b.label, b.x + BLOCK_W / 2, y + 13);
      ctx.textAlign = "left";
    });

    const p = playerRef.current;
    drawRunner(ctx, Math.round(p.x), GROUND_Y + Math.round(p.y), RUNNER_PX, p.frame, DEFAULT_PALETTE);
  }, []);

  // Size the canvas for the device pixel ratio.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = W * 3 * dpr;
    canvas.height = H * 3 * dpr;
    canvas.getContext("2d")?.setTransform(3 * dpr, 0, 0, 3 * dpr, 0, 0);
    paint();
  }, [paint]);

  const jump = useCallback(() => {
    const p = playerRef.current;
    if (p.air) return;
    p.vy = JUMP_V;
    p.air = true;
    playSfx("jump");
    setJumps((j) => j + 1);
  }, []);

  // Continuous walk-cycle loop.
  useEffect(() => {
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(2.5, (now - last) / 16.6667);
      last = now;
      const p = playerRef.current;

      // stable horizontal walk cycle, bouncing between the viewport edges
      p.x += WALK_SPEED * dirRef.current * dt;
      if (p.x <= MIN_X) {
        p.x = MIN_X;
        dirRef.current = 1;
      } else if (p.x >= MAX_X) {
        p.x = MAX_X;
        dirRef.current = -1;
      }

      p.vy += GRAVITY * dt;
      p.y += p.vy * dt;
      if (p.y >= 0) {
        p.y = 0;
        p.vy = 0;
        p.air = false;
      }
      p.frame += dt * 0.35;

      // Head strike against the menu blocks above.
      if (p.vy < 0 && !navigatingRef.current) {
        const headTop = GROUND_Y + p.y - RUNNER_H;
        const index = BLOCKS.findIndex(
          (b) =>
            p.x + RUNNER_W - 8 > b.x &&
            p.x + 8 < b.x + BLOCK_W &&
            headTop <= BLOCK_Y + BLOCK_H &&
            headTop >= BLOCK_Y - 14,
        );
        if (index >= 0) {
          const block = BLOCKS[index]!;
          navigatingRef.current = true;
          hitRef.current = { index, until: performance.now() + 400 };
          p.vy = 2;
          playSfx("complete");
          if (claimDailyBonus(5)) {
            toast.success("+5 Arcade Tokens", { description: "Daily block bonus claimed." });
          }
          window.setTimeout(() => {
            void navigate({ to: block.to });
          }, 260);
        }
      }

      paint();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [paint, navigate, claimDailyBonus]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "ArrowUp") {
        e.preventDefault();
        jump();
      }
      if (e.key === "ArrowLeft") dirRef.current = -1;
      if (e.key === "ArrowRight") dirRef.current = 1;
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [jump]);

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        onClick={jump}
        onKeyDown={(e) => {
          if (e.key === "Enter") jump();
        }}
        aria-label="Tap to make your runner jump and strike the menu blocks"
        className="relative cursor-pointer overflow-hidden rounded-3xl border border-border bg-elevated shadow-[var(--shadow-card)]"
      >
        <canvas
          ref={canvasRef}
          className="pixelated block h-auto w-full"
          style={{ aspectRatio: `${W} / ${H}` }}
          aria-label={`8-bit runner in front of the ${city.landmark} in ${city.name}`}
          role="img"
        />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenCities();
            }}
            className="flex items-center gap-1.5 rounded-full bg-background/75 px-2.5 py-1.5 font-pixel text-[8px] leading-none text-primary backdrop-blur transition-colors hover:bg-background"
          >
            <MapPin className="size-3" />
            {city.name.toUpperCase()} — LEVEL {cityLevel(city.id)}
            <ChevronRight className="size-3" />
          </button>
          <span className="pointer-events-none rounded-full bg-background/70 px-2.5 py-1 font-pixel text-[8px] leading-none text-hud backdrop-blur">
            JUMPS {jumps}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        <PadButton
          label="Move left"
          glyph="◀"
          onDown={() => {
            dirRef.current = -1;
          }}
          onUp={() => {}}
        />
        <button
          type="button"
          onClick={jump}
          className="rounded-xl border border-border bg-surface px-6 py-2 text-[13px] font-semibold text-primary transition-colors hover:bg-elevated"
        >
          Jump
        </button>
        <PadButton
          label="Move right"
          glyph="▶"
          onDown={() => {
            dirRef.current = 1;
          }}
          onUp={() => {}}
        />
      </div>
      <p className="text-center text-[12px] text-muted-foreground">
        Jump into a block to hop to Quest, Media Lab or Arcade — first strike each day pays a
        bonus token.
      </p>
    </div>
  );
}

function PadButton({
  label,
  glyph,
  onDown,
  onUp,
}: {
  label: string;
  glyph: string;
  onDown: () => void;
  onUp: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={onDown}
      onPointerUp={onUp}
      onPointerLeave={onUp}
      onPointerCancel={onUp}
      className="rounded-xl border border-border bg-surface px-5 py-2 text-[13px] text-accent-glow transition-colors hover:bg-elevated"
    >
      {glyph}
    </button>
  );
}
