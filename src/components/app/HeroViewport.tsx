import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ChevronRight, MapPin } from "lucide-react";
import { drawGround, drawRunner, drawSky, drawSkyline } from "./pixel-scene";
import { TypingText } from "./TypingText";
import { getAvatarPalette } from "@/lib/arcade-store";
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

type Props = {
  cityId: string;
  playerName: string;
  onOpenCities: () => void;
};

const HOME_X = 54;
const ENTER_START_X = -RUNNER_W - 4;
const PIXEL_FONT = '"Press Start 2P", ui-monospace, Menlo, monospace';

function formatCityLevel(cityName: string, level: number) {
  return `${cityName} - Level ${level}`;
}

/**
 * Interactive 8-bit "Jumpman" viewport: the runner makes one entrance pass,
 * settles into place, then idles until the player jumps or uses the pads.
 */
export function HeroViewport({ cityId, playerName, onOpenCities }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const playerRef = useRef({ x: ENTER_START_X, y: 0, vy: 0, air: false, frame: 0 });
  const introRef = useRef<"entering" | "idle">("entering");
  const moveRef = useRef(0);
  const hitRef = useRef<{ index: number; until: number } | null>(null);
  const navigatingRef = useRef(false);
  const city = getCity(cityId);
  const navigate = useNavigate();
  const { claimDailyBonus, state } = useGameState();
  const avatarPalette = getAvatarPalette(state.loadout.avatarStyle);
  const displayName = (playerName.trim().split(" ")[0] || "RUNNER").toUpperCase();
  const playerTag = `READY PLAYER ONE — ${displayName}`;

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
    playerRef.current = { x: ENTER_START_X, y: 0, vy: 0, air: false, frame: 0 };
    introRef.current = "entering";
    moveRef.current = 0;
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
      ctx.font = `7px ${PIXEL_FONT}`;
      ctx.textAlign = "center";
      ctx.fillText(b.label, b.x + BLOCK_W / 2, y + 13);
      ctx.textAlign = "left";
    });

    const p = playerRef.current;
    const runnerX = Math.round(p.x);
    drawRunner(ctx, runnerX, GROUND_Y + Math.round(p.y), RUNNER_PX, p.frame, avatarPalette);
  }, [avatarPalette]);

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
  }, []);

  // Physics loop — entrance pass once, then idle until the player moves or jumps.
  useEffect(() => {
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(2.5, (now - last) / 16.6667);
      last = now;
      const p = playerRef.current;

      if (introRef.current === "entering") {
        p.x += WALK_SPEED * dt;
        p.frame += dt * 0.4;
        if (p.x >= HOME_X) {
          p.x = HOME_X;
          introRef.current = "idle";
        }
      } else {
        const move = moveRef.current;
        if (move !== 0) {
          p.x += WALK_SPEED * move * dt;
          if (p.x <= MIN_X) p.x = MIN_X;
          else if (p.x >= MAX_X) p.x = MAX_X;
          p.frame += dt * 0.4;
        } else if (!p.air) {
          p.frame += dt * 0.08;
        }
      }

      p.vy += GRAVITY * dt;
      p.y += p.vy * dt;
      if (p.y >= 0) {
        p.y = 0;
        p.vy = 0;
        p.air = false;
      }

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
      if (e.key === "ArrowLeft") moveRef.current = -1;
      if (e.key === "ArrowRight") moveRef.current = 1;
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") moveRef.current = 0;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [jump]);

  const cityProgressLabel = formatCityLevel(city.name, cityLevel(city.id));

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

        <div
          className="pointer-events-none absolute bottom-[14%] left-3 z-10 max-w-[62%] rounded-md bg-[#05060f]/78 px-2 py-1 shadow-[0_2px_10px_rgba(0,0,0,0.55)] backdrop-blur-[2px]"
          aria-live="polite"
        >
          <p className="font-pixel text-[7px] leading-relaxed tracking-[0.04em] text-[#fde047]">
            <TypingText text={playerTag} speed={72} />
          </p>
        </div>

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
            {cityProgressLabel}
            <ChevronRight className="size-3" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        <PadButton
          label="Move left"
          glyph="◀"
          onDown={() => {
            moveRef.current = -1;
          }}
          onUp={() => {
            if (moveRef.current === -1) moveRef.current = 0;
          }}
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
            moveRef.current = 1;
          }}
          onUp={() => {
            if (moveRef.current === 1) moveRef.current = 0;
          }}
        />
      </div>
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
