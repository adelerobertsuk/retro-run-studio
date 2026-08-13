import type { GladiatorStatus } from "@/lib/gladiator-titles";
import type { RunEntry } from "@/lib/game-state";
import { routePoints, tracePath } from "@/lib/route-path";
import {
  drawAestheticStatsPanel,
  drawChromeTitle,
  drawNeonRoutePath,
  drawSynthwaveGrid,
  type MediaExportMode,
} from "@/lib/synthwave-overlay";
import { drawOfficialLogo } from "@/lib/watermark";

export const ROUTE_TRACE_FRAMES = 300;
export const ROUTE_VICTORY_FRAMES = 180;
export const ROUTE_TOTAL_FRAMES = ROUTE_TRACE_FRAMES + ROUTE_VICTORY_FRAMES;

export function draw8BitRunnerBadge(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale = 1,
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.fillStyle = "rgba(5,6,15,0.82)";
  ctx.beginPath();
  ctx.roundRect(-52, -18, 104, 36, 10);
  ctx.fill();
  ctx.strokeStyle = "rgba(34,211,238,0.55)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = '800 11px system-ui, sans-serif';
  ctx.fillStyle = "#f8fafc";
  ctx.fillText("8-BIT RUNNER", 0, 1);
  ctx.textBaseline = "alphabetic";
  ctx.restore();
}

export function drawPixelGrid(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  step = 12,
) {
  ctx.fillStyle = "#0b1020";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 1;
  for (let gx = x; gx <= x + w; gx += step) {
    ctx.beginPath();
    ctx.moveTo(gx + 0.5, y);
    ctx.lineTo(gx + 0.5, y + h);
    ctx.stroke();
  }
  for (let gy = y; gy <= y + h; gy += step) {
    ctx.beginPath();
    ctx.moveTo(x, gy + 0.5);
    ctx.lineTo(x + w, gy + 0.5);
    ctx.stroke();
  }
}

export function pixelRoutePoints(run: RunEntry, W: number, H: number, step = 14) {
  const pad = 24;
  const raw = routePoints(run, W - pad * 2, H - pad * 2);
  return raw.map(([px, py]) => [
    pad + Math.round(px / step) * step,
    pad + Math.round(py / step) * step,
  ]) as [number, number][];
}

export type RouteRevealPhase = "trace" | "victory";

export function routeRevealPhase(frame: number): RouteRevealPhase {
  return frame < ROUTE_TRACE_FRAMES ? "trace" : "victory";
}

export function routeTraceProgress(frame: number): number {
  return Math.min(1, frame / ROUTE_TRACE_FRAMES);
}

export function drawPixelRouteTrace(
  ctx: CanvasRenderingContext2D,
  run: RunEntry,
  box: { x: number; y: number; w: number; h: number },
  progress: number,
) {
  const points = pixelRoutePoints(run, box.w, box.h);
  ctx.save();
  ctx.translate(box.x, box.y);
  drawPixelGrid(ctx, 0, 0, box.w, box.h);

  ctx.strokeStyle = "rgba(16,185,129,0.25)";
  ctx.lineWidth = 10;
  ctx.lineJoin = "miter";
  ctx.lineCap = "square";
  ctx.beginPath();
  points.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
  ctx.stroke();

  ctx.strokeStyle = "#10b981";
  ctx.lineWidth = 5;
  ctx.shadowColor = "#10b981";
  ctx.shadowBlur = 8;
  const head = tracePath(ctx, points, progress);
  ctx.stroke();
  ctx.shadowBlur = 0;

  const [hx, hy] = head;
  ctx.fillStyle = "#fde047";
  ctx.fillRect(hx - 5, hy - 5, 10, 10);
  ctx.fillStyle = "#6366f1";
  ctx.fillRect(hx - 3, hy - 3, 6, 6);

  ctx.restore();
  return head;
}

export function drawRouteStatsBar(
  ctx: CanvasRenderingContext2D,
  run: RunEntry,
  x: number,
  y: number,
  w: number,
) {
  drawAestheticStatsPanel(ctx, run, x, y, w);
}

export type VictoryMode = "photo" | "video";

/**
 * Semi-transparent Tron-grid overlay composited over user media.
 * Grid and stats sit in the lower third so the focal point stays clear.
 */
export function drawGamerMediaOverlay(
  ctx: CanvasRenderingContext2D,
  run: RunEntry,
  box: { x: number; y: number; w: number; h: number },
  frame: number,
  gladiator?: GladiatorStatus,
) {
  const { x, y, w, h } = box;
  const progress = frame < ROUTE_TRACE_FRAMES ? routeTraceProgress(frame) : 1;
  const victory = frame >= ROUTE_TRACE_FRAMES;

  const topVignette = ctx.createLinearGradient(x, y, x, y + h * 0.38);
  topVignette.addColorStop(0, "rgba(6,4,15,0.32)");
  topVignette.addColorStop(1, "transparent");
  ctx.fillStyle = topVignette;
  ctx.fillRect(x, y, w, h * 0.38);

  const gridTop = y + h * 0.46;
  const gridH = h - (gridTop - y);

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, gridTop, w, gridH);
  ctx.clip();

  const baseGrad = ctx.createLinearGradient(x, gridTop, x, y + h);
  baseGrad.addColorStop(0, "transparent");
  baseGrad.addColorStop(0.1, "rgba(12,4,24,0.42)");
  baseGrad.addColorStop(0.5, "rgba(12,4,24,0.68)");
  baseGrad.addColorStop(1, "rgba(6,4,15,0.78)");
  ctx.fillStyle = baseGrad;
  ctx.fillRect(x, gridTop, w, gridH);

  const horizonLocal = gridH * 0.1;
  const sun = ctx.createRadialGradient(
    x + w / 2,
    gridTop + horizonLocal,
    0,
    x + w / 2,
    gridTop + horizonLocal,
    w * 0.42,
  );
  sun.addColorStop(0, "rgba(251,191,36,0.38)");
  sun.addColorStop(0.35, "rgba(236,72,153,0.22)");
  sun.addColorStop(1, "transparent");
  ctx.fillStyle = sun;
  ctx.fillRect(x, gridTop, w, gridH);

  ctx.save();
  ctx.translate(x, gridTop);
  drawSynthwaveGrid(ctx, w, gridH, horizonLocal);
  ctx.restore();
  ctx.restore();

  const routeBox = { x: x + 16, y: y + h * 0.1, w: w - 32, h: h * 0.78 };
  drawNeonRoutePath(ctx, run, routeBox, progress);

  if (victory) {
    drawChromeTitle(
      ctx,
      "ROUTE LOCKED",
      x + w / 2,
      y + h * 0.08,
      Math.max(11, Math.round(w * 0.048)),
    );
  }

  const statsH = Math.min(88, h * 0.16);
  drawAestheticStatsPanel(ctx, run, x + 12, y + h - statsH - 10, w - 24);

  draw8BitRunnerBadge(ctx, x + w - 54, y + 24, Math.min(1, w / 270));
  drawOfficialLogo(ctx, x + 14, y + 18, Math.min(0.32, w / 840), "left");

  if (gladiator) {
    ctx.textAlign = "right";
    ctx.font = '600 10px system-ui, sans-serif';
    ctx.fillStyle = "rgba(167,139,250,0.92)";
    ctx.fillText(gladiator.title.toUpperCase(), x + w - 14, y + h - statsH - 18);
  }
}

/** @deprecated Use drawGamerMediaOverlay for compositing over media. */
export function drawRouteVictory(
  ctx: CanvasRenderingContext2D,
  run: RunEntry,
  box: { x: number; y: number; w: number; h: number },
  victoryFrame: number,
  mode: VictoryMode,
  gladiator?: GladiatorStatus,
  exportMode: MediaExportMode = "gamer",
) {
  if (exportMode === "aesthetic") return;
  drawGamerMediaOverlay(ctx, run, box, ROUTE_TRACE_FRAMES + victoryFrame, gladiator);
}

/** Render one frame of the gamer route overlay sequence over existing media. */
export function drawRouteRevealFrame(
  ctx: CanvasRenderingContext2D,
  run: RunEntry,
  box: { x: number; y: number; w: number; h: number },
  frame: number,
  _mode: VictoryMode,
  gladiator?: GladiatorStatus,
  exportMode: MediaExportMode = "gamer",
) {
  if (exportMode === "aesthetic") return;
  drawGamerMediaOverlay(ctx, run, box, frame, gladiator);
}
