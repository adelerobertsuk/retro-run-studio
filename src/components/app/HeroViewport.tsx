import { useCallback, useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import {
  DEFAULT_PALETTE,
  drawGround,
  drawRunner,
  drawSky,
  drawSkyline,
} from "./pixel-scene";
import { useLocationLabel } from "@/lib/use-location-label";

const W = 320;
const H = 160;
const GROUND_Y = H - 26;
const SPEED = 2.2;
const GRAVITY = 0.62;
const JUMP_V = 8.4;
const RUNNER_X = 40;
const RUNNER_W = 40;

type Obstacle = { x: number; w: number; h: number };

export function HeroViewport({ level = 4 }: { level?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const jumpRef = useRef(false);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const city = useLocationLabel();

  const jump = useCallback(() => {
    jumpRef.current = true;
  }, []);

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

    let raf = 0;
    let distance = 0;
    let y = 0; // height above ground
    let vy = 0;
    let obstacles: Obstacle[] = [{ x: W + 60, w: 10, h: 14 }];
    let hitFlash = 0;
    let cleared = 0;

    const spawn = (fromX: number) => {
      const gap = 130 + Math.random() * 120;
      obstacles.push({
        x: fromX + gap,
        w: 8 + Math.round(Math.random() * 6),
        h: 12 + Math.round(Math.random() * 10),
      });
    };

    const render = () => {
      distance += SPEED;

      // physics
      if (jumpRef.current) {
        jumpRef.current = false;
        if (y === 0) vy = JUMP_V;
      }
      if (vy !== 0 || y > 0) {
        y += vy;
        vy -= GRAVITY;
        if (y <= 0) {
          y = 0;
          vy = 0;
        }
      }

      // obstacles
      obstacles = obstacles.filter((o) => o.x + o.w > -10);
      const last = obstacles[obstacles.length - 1];
      if (!last || last.x < W - 40) spawn(last ? last.x : W);
      for (const o of obstacles) {
        o.x -= SPEED;
        const overlapX = o.x < RUNNER_X + RUNNER_W - 8 && o.x + o.w > RUNNER_X + 8;
        if (overlapX && y < o.h && hitFlash === 0) {
          hitFlash = 24;
          cleared = 0;
          setScore(0);
        }
        if (!overlapX && o.x + o.w < RUNNER_X + 8 && !(o as Obstacle & { done?: boolean }).done) {
          (o as Obstacle & { done?: boolean }).done = true;
          cleared += 1;
          setScore(cleared);
          setBest((b) => Math.max(b, cleared));
        }
      }
      if (hitFlash > 0) hitFlash--;

      // scene
      drawSky(ctx, W, H, true);
      drawSkyline(ctx, W, GROUND_Y, distance, 0);
      drawSkyline(ctx, W, GROUND_Y, distance, 1);
      drawGround(ctx, W, H, GROUND_Y, distance);

      // hurdles
      for (const o of obstacles) {
        const x = Math.floor(o.x);
        ctx.fillStyle = "#6366f1";
        ctx.fillRect(x, GROUND_Y - o.h, o.w, o.h);
        ctx.fillStyle = "#a5b4fc";
        ctx.fillRect(x, GROUND_Y - o.h, o.w, 2);
      }

      const frame = y > 0 ? 0 : Math.floor(distance / 6);
      drawRunner(ctx, RUNNER_X, GROUND_Y - Math.floor(y), 4, frame, DEFAULT_PALETTE);

      if (hitFlash > 0 && hitFlash % 6 < 3) {
        ctx.fillStyle = "rgba(244,63,94,0.28)";
        ctx.fillRect(0, 0, W, H);
      }

      raf = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(raf);
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
        aria-label="Tap to jump over hurdles"
        className="block w-full cursor-pointer"
      >
        <canvas
          ref={canvasRef}
          className="pixelated block h-auto w-full"
          style={{ aspectRatio: `${W} / ${H}` }}
          aria-label="8-bit runner sprite jumping hurdles past an animated city skyline"
          role="img"
        />
      </button>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3">
        <span className="flex items-center gap-1.5 rounded-full bg-background/70 px-2.5 py-1 font-pixel text-[8px] leading-none text-primary backdrop-blur">
          <MapPin className="size-3" />
          {city} · LEVEL {level}
        </span>
        <span className="rounded-full bg-background/70 px-2.5 py-1 font-pixel text-[8px] leading-none text-hud backdrop-blur">
          {score} / BEST {best}
        </span>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between p-3">
        <span className="rounded-full bg-background/70 px-3 py-1 text-[11px] font-medium tracking-wide text-foreground backdrop-blur">
          Tap to jump
        </span>
        <span className="rounded-full bg-primary/15 px-3 py-1 text-[11px] font-semibold text-primary">
          JUMPMAN
        </span>
      </div>
    </div>
  );
}
