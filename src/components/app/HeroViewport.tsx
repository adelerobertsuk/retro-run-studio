import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronRight, MapPin } from "lucide-react";
import { DEFAULT_PALETTE, drawGround, drawRunner, drawSky, drawSkyline } from "./pixel-scene";
import { cityLevel, drawLandmark, getCity } from "@/lib/cities";

const W = 320;
const H = 160;
const GROUND_Y = H - 26;
const RUNNER_X = 54;
const HURDLE_X = 150;
const HURDLE_W = 10;
const HURDLE_H = 16;
const JUMP_MS = 720;
const JUMP_HEIGHT = 42;
const TRAVEL = HURDLE_X - RUNNER_X + 34;

type Props = { cityId: string; onOpenCities: () => void };

/**
 * Static 8-bit city viewport. Nothing animates until the user taps: one
 * controlled, time-based jump arc plays and the scene settles again.
 */
export function HeroViewport({ cityId, onOpenCities }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef<(progress: number) => void>(() => {});
  const rafRef = useRef(0);
  const jumpingRef = useRef(false);
  const [jumps, setJumps] = useState(0);
  const city = getCity(cityId);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = W * 3 * dpr;
    canvas.height = H * 3 * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.setTransform(3 * dpr, 0, 0, 3 * dpr, 0, 0);

    // `progress` is 0 when idle and 0→1 across a single tap-triggered jump.
    const draw = (progress: number) => {
      drawSky(ctx, W, H, true);
      drawSkyline(ctx, W, GROUND_Y, 0, 0);
      drawSkyline(ctx, W, GROUND_Y, 0, 1);
      drawLandmark(ctx, cityId, W * 0.72, GROUND_Y);
      drawGround(ctx, W, H, GROUND_Y, 0);

      ctx.fillStyle = "#6366f1";
      ctx.fillRect(HURDLE_X, GROUND_Y - HURDLE_H, HURDLE_W, HURDLE_H);
      ctx.fillStyle = "#a5b4fc";
      ctx.fillRect(HURDLE_X, GROUND_Y - HURDLE_H, HURDLE_W, 2);

      const arc = Math.sin(Math.PI * progress);
      const lift = Math.round(arc * JUMP_HEIGHT);
      const forward = Math.round(arc * TRAVEL);
      const frame = progress > 0 ? 0 : 1;
      drawRunner(ctx, RUNNER_X + forward, GROUND_Y - lift, 4, frame, DEFAULT_PALETTE);
    };

    drawRef.current = draw;
    draw(0);
    return () => cancelAnimationFrame(rafRef.current);
  }, [cityId]);

  const jump = useCallback(() => {
    if (jumpingRef.current) return;
    jumpingRef.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      jumpingRef.current = false;
      setJumps((j) => j + 1);
      return;
    }
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / JUMP_MS);
      drawRef.current(p);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        drawRef.current(0);
        jumpingRef.current = false;
        setJumps((j) => j + 1);
      }
    };
    rafRef.current = requestAnimationFrame(step);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-elevated shadow-[var(--shadow-card)]">
      <button
        type="button"
        onClick={jump}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "ArrowUp") {
            e.preventDefault();
            jump();
          }
        }}
        aria-label="Tap to make your runner jump the hurdle"
        className="block w-full cursor-pointer"
      >
        <canvas
          ref={canvasRef}
          className="pixelated block h-auto w-full"
          style={{ aspectRatio: `${W} / ${H}` }}
          aria-label={`8-bit runner standing in front of the ${city.landmark} in ${city.name}`}
          role="img"
        />
      </button>

      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
        <button
          type="button"
          onClick={onOpenCities}
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

      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center p-3 transition-opacity duration-500 ${jumps > 0 ? "opacity-0" : "opacity-100"}`}
      >
        <span className="rounded-full bg-background/70 px-3 py-1 text-[11px] font-medium tracking-wide text-foreground backdrop-blur">
          Tap to jump
        </span>
      </div>
    </div>
  );
}
