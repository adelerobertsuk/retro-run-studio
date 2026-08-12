import { useEffect, useRef } from "react";
import {
  DEFAULT_PALETTE,
  drawGround,
  drawRunner,
  drawSky,
  drawSkyline,
} from "./pixel-scene";

const W = 320;
const H = 160;

export function HeroViewport({ label }: { label: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = W * 3 * dpr;
    canvas.height = H * 3 * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.scale(3 * dpr, 3 * dpr);

    let raf = 0;
    let tick = 0;
    const render = () => {
      tick++;
      const groundY = H - 26;
      drawSky(ctx, W, H, true);
      drawSkyline(ctx, W, groundY, tick, 0);
      drawSkyline(ctx, W, groundY, tick, 1);
      drawGround(ctx, W, H, groundY, tick);
      drawRunner(ctx, 44, groundY, 3, Math.floor(tick / 5), DEFAULT_PALETTE);
      raf = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-elevated shadow-[var(--shadow-card)]">
      <canvas
        ref={canvasRef}
        className="pixelated block h-auto w-full"
        style={{ aspectRatio: `${W} / ${H}` }}
        aria-label="8-bit runner sprite jogging past an animated city skyline"
        role="img"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between p-3">
        <span className="rounded-full bg-background/70 px-3 py-1 text-[11px] font-medium tracking-wide text-foreground backdrop-blur">
          {label}
        </span>
        <span className="rounded-full bg-primary/15 px-3 py-1 text-[11px] font-semibold text-primary">
          LIVE
        </span>
      </div>
    </div>
  );
}
