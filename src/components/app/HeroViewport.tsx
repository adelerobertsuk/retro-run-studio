import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronRight, MapPin } from "lucide-react";
import { DEFAULT_PALETTE, drawGround, drawRunner, drawSky, drawSkyline } from "./pixel-scene";
import { cityLevel, drawLandmark, getCity } from "@/lib/cities";
import { playSfx } from "@/lib/audio";

const W = 320;
const H = 160;
const GROUND_Y = H - 26;
const RUNNER_PX = 4;
const RUNNER_W = 12 * RUNNER_PX;
const RUNNER_H = 16 * RUNNER_PX;
const MIN_X = 8;
const MAX_X = W - RUNNER_W - 8;
const HURDLE_W = 10;
const HURDLE_H = 16;

const GRAVITY = 0.9; // px per frame^2 (at 60fps)
const JUMP_V = -12.6;
const MOVE_A = 0.75;
const MOVE_MAX = 3.2;
const FRICTION = 0.86;

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
  const heldRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });
  const playerRef = useRef({ x: 54, vx: 0, y: 0, vy: 0, air: false, frame: 0 });
  const hurdlesRef = useRef<number[]>([]);
  const scrollRef = useRef(0);
  const scoreRef = useRef(0);
  const [score, setScore] = useState(0);
  const [jumps, setJumps] = useState(0);
  const [playing, setPlaying] = useState(false);
  const city = getCity(cityId);

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
    drawGround(ctx, W, H, GROUND_Y, scrollRef.current);

    ctx.fillStyle = "#6366f1";
    hurdlesRef.current.forEach((hx) => {
      ctx.fillStyle = "#6366f1";
      ctx.fillRect(Math.round(hx), GROUND_Y - HURDLE_H, HURDLE_W, HURDLE_H);
      ctx.fillStyle = "#a5b4fc";
      ctx.fillRect(Math.round(hx), GROUND_Y - HURDLE_H, HURDLE_W, 2);
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

  const start = useCallback(() => {
    if (playing) {
      jump();
      return;
    }
    playerRef.current = { x: 54, vx: 0, y: 0, vy: 0, air: false, frame: 0 };
    hurdlesRef.current = [W + 40, W + 220];
    scoreRef.current = 0;
    setScore(0);
    setPlaying(true);
    jump();
  }, [playing, jump]);

  // Game loop — only alive while playing.
  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(2.5, (now - last) / 16.6667);
      last = now;
      const p = playerRef.current;
      const held = heldRef.current;

      if (held.left) p.vx -= MOVE_A * dt;
      if (held.right) p.vx += MOVE_A * dt;
      if (!held.left && !held.right) p.vx *= FRICTION;
      p.vx = Math.max(-MOVE_MAX, Math.min(MOVE_MAX, p.vx));
      p.x = Math.max(MIN_X, Math.min(MAX_X, p.x + p.vx * dt));

      p.vy += GRAVITY * dt;
      p.y += p.vy * dt;
      if (p.y >= 0) {
        p.y = 0;
        p.vy = 0;
        p.air = false;
      }
      p.frame += dt * 0.35;

      const speed = 2.1 * dt;
      scrollRef.current += speed;
      hurdlesRef.current = hurdlesRef.current.map((hx) => hx - speed);
      if (hurdlesRef.current[0]! < -HURDLE_W) {
        hurdlesRef.current.shift();
        scoreRef.current += 1;
        setScore(scoreRef.current);
      }
      const lastHurdle = hurdlesRef.current[hurdlesRef.current.length - 1] ?? 0;
      if (lastHurdle < W - 60) {
        hurdlesRef.current.push(lastHurdle + 150 + Math.random() * 120);
      }

      // Collision: overlap in x while the runner's feet are low.
      const footY = p.y;
      const hit = hurdlesRef.current.some(
        (hx) =>
          p.x + RUNNER_W - 6 > hx &&
          p.x + 6 < hx + HURDLE_W &&
          footY > -HURDLE_H + 2,
      );
      if (hit) {
        p.x = Math.max(MIN_X, p.x - 14);
        p.vx = 0;
        hurdlesRef.current = hurdlesRef.current.filter((hx) => hx > p.x + RUNNER_W + 20);
        scoreRef.current = Math.max(0, scoreRef.current - 1);
        setScore(scoreRef.current);
        playSfx("tap");
      }

      paint();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [playing, paint]);

  useEffect(() => {
    const set = (key: string, value: boolean) => {
      if (key === "ArrowLeft") heldRef.current.left = value;
      if (key === "ArrowRight") heldRef.current.right = value;
    };
    const down = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "ArrowUp") {
        e.preventDefault();
        start();
      }
      set(e.key, true);
    };
    const up = (e: KeyboardEvent) => set(e.key, false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [start]);

  const hold = (dir: "left" | "right", value: boolean) => () => {
    heldRef.current[dir] = value;
  };

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        onClick={start}
        onKeyDown={(e) => {
          if (e.key === "Enter") start();
        }}
        aria-label="Tap to make your runner jump the hurdle"
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
            JUMPS {jumps} · CLEARED {score}
          </span>
        </div>

        {!playing && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center p-3">
            <span className="rounded-full bg-background/70 px-3 py-1 text-[11px] font-medium tracking-wide text-foreground backdrop-blur">
              Tap to jump
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-2">
        <PadButton
          label="Move left"
          glyph="◀"
          onDown={hold("left", true)}
          onUp={hold("left", false)}
        />
        <button
          type="button"
          onClick={start}
          className="rounded-xl border border-border bg-surface px-6 py-2 text-[13px] font-semibold text-primary transition-colors hover:bg-elevated"
        >
          Jump
        </button>
        <PadButton
          label="Move right"
          glyph="▶"
          onDown={hold("right", true)}
          onUp={hold("right", false)}
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
