import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronRight, MapPin } from "lucide-react";
import { DEFAULT_PALETTE, drawGround, drawRunner, drawSky, drawSkyline } from "./pixel-scene";
import { cityLevel, drawLandmark, getCity } from "@/lib/cities";
import { playSfx } from "@/lib/audio";

const W = 320;
const H = 160;
const GROUND_Y = H - 26;
const RUNNER_X = 54;
const HURDLE_X = 150;
const HURDLE_W = 10;
const HURDLE_H = 16;

const RUNNER_W = 12;
const RUNNER_H = 16;
const RUNNER_PX = 4;

const JUMP_MS = 500;

const RUNNER_LEFT = (RUNNER_X / W) * 100;
const RUNNER_TOP = ((GROUND_Y - RUNNER_H * RUNNER_PX) / H) * 100;
const RUNNER_WIDTH = ((RUNNER_W * RUNNER_PX) / W) * 100;

/**
 * Interactive 8-bit Home viewport. The scene is static until the user taps
 * the container, which triggers a CSS keyframe jump on the runner sprite and
 * increments the jump counter.
 */
export function HeroViewport({ cityId, onOpenCities }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runnerRef = useRef<HTMLCanvasElement>(null);
  const [jumps, setJumps] = useState(0);
  const [jumping, setJumping] = useState(false);
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

    drawSky(ctx, W, H, true);
    drawSkyline(ctx, W, GROUND_Y, 0, 0);
    drawSkyline(ctx, W, GROUND_Y, 0, 1);
    drawLandmark(ctx, cityId, W * 0.72, GROUND_Y);
    drawGround(ctx, W, H, GROUND_Y, 0);

    ctx.fillStyle = "#6366f1";
    ctx.fillRect(HURDLE_X, GROUND_Y - HURDLE_H, HURDLE_W, HURDLE_H);
    ctx.fillStyle = "#a5b4fc";
    ctx.fillRect(HURDLE_X, GROUND_Y - HURDLE_H, HURDLE_W, 2);
  }, [cityId]);

  useEffect(() => {
    const runner = runnerRef.current;
    if (!runner) return;
    const ctx = runner.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, runner.width, runner.height);
    drawRunner(ctx, 0, RUNNER_H, 1, 0, DEFAULT_PALETTE);
  }, [cityId]);

  const jump = useCallback(() => {
    if (jumping) return;
    playSfx("jump");
    setJumping(true);
    setJumps((j) => j + 1);
    window.setTimeout(() => setJumping(false), JUMP_MS);
  }, [jumping]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === " " || e.key === "ArrowUp") {
        e.preventDefault();
        jump();
      }
    },
    [jump],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={jump}
      onKeyDown={handleKeyDown}
      aria-label="Tap to make your runner jump the hurdle"
      className="pointer-events-auto relative cursor-pointer overflow-hidden rounded-3xl border border-border bg-elevated shadow-[var(--shadow-card)]"
    >
      <canvas
        ref={canvasRef}
        className="pixelated block h-auto w-full"
        style={{ aspectRatio: `${W} / ${H}` }}
        aria-label={`8-bit runner standing in front of the ${city.landmark} in ${city.name}`}
        role="img"
      />
      <canvas
        ref={runnerRef}
        width={RUNNER_W}
        height={RUNNER_H}
        className={`pixelated pointer-events-none absolute ${jumping ? "runner-jump" : ""}`}
        style={{
          left: `${RUNNER_LEFT}%`,
          top: `${RUNNER_TOP}%`,
          width: `${RUNNER_WIDTH}%`,
          aspectRatio: `${RUNNER_W} / ${RUNNER_H}`,
        }}
        aria-hidden="true"
      />

      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenCities();
          }}
          className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-background/75 px-2.5 py-1.5 font-pixel text-[8px] leading-none text-primary backdrop-blur transition-colors hover:bg-background"
        >
          <MapPin className="size-3" />
          {city.name.toUpperCase()} — LEVEL {cityLevel(city.id)}
          <ChevronRight className="size-3" />
        </button>
        <span className="pointer-events-none rounded-full bg-background/70 px-2.5 py-1 font-pixel text-[8px] leading-none text-hud backdrop-blur">
          JUMPS {jumps}
        </span>
      </div>

      {jumps === 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center p-3">
          <span className="rounded-full bg-background/70 px-3 py-1 text-[11px] font-medium tracking-wide text-foreground backdrop-blur">
            Tap to jump
          </span>
        </div>
      )}
    </div>
  );
}

type Props = { cityId: string; onOpenCities: () => void };
