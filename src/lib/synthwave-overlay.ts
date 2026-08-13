import { formatPace, type RunEntry } from "@/lib/game-state";
import { routePoints } from "@/lib/route-path";

export type MediaExportMode = "gamer" | "aesthetic";

export const EXPORT_PLAYBACK_SPEED = 1.85;

const NEON_CYAN = "#22d3ee";
const NEON_MAGENTA = "#ec4899";
const NEON_VIOLET = "#a78bfa";

export function drawSynthwaveBackdrop(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#0c0418");
  sky.addColorStop(0.35, "#16082a");
  sky.addColorStop(0.72, "#1a0f35");
  sky.addColorStop(1, "#06040f");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  const horizon = h * 0.58;
  const sun = ctx.createRadialGradient(w / 2, horizon - 8, 0, w / 2, horizon - 8, w * 0.42);
  sun.addColorStop(0, "rgba(251,191,36,0.55)");
  sun.addColorStop(0.35, "rgba(236,72,153,0.35)");
  sun.addColorStop(0.7, "rgba(139,92,246,0.12)");
  sun.addColorStop(1, "transparent");
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, w, h);

  drawSynthwaveGrid(ctx, w, h, horizon);
}

export function drawSynthwaveGrid(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  horizonY: number,
) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, horizonY, w, h - horizonY);
  ctx.clip();

  const vanishX = w / 2;
  const vanishY = horizonY - h * 0.08;

  for (let i = -14; i <= 14; i++) {
    const x0 = vanishX + i * w * 0.09;
    ctx.strokeStyle = i % 2 === 0 ? "rgba(34,211,238,0.45)" : "rgba(236,72,153,0.32)";
    ctx.lineWidth = i === 0 ? 2 : 1;
    ctx.shadowColor = ctx.strokeStyle as string;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(x0, horizonY);
    ctx.lineTo(vanishX + i * w * 0.55, h + 40);
    ctx.stroke();
  }

  for (let row = 0; row < 12; row++) {
    const t = row / 12;
    const y = horizonY + (h - horizonY) * t * t;
    const spread = 0.15 + t * 0.85;
    ctx.strokeStyle = `rgba(34,211,238,${0.12 + t * 0.28})`;
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(w * (0.5 - spread), y);
    ctx.lineTo(w * (0.5 + spread), y);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawChromeTitle(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  align: CanvasTextAlign = "center",
) {
  ctx.save();
  ctx.textAlign = align;
  ctx.font = `700 ${size}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  const metrics = ctx.measureText(text);
  const left = align === "center" ? x - metrics.width / 2 : align === "right" ? x - metrics.width : x;
  const grad = ctx.createLinearGradient(left, y - size, left + metrics.width, y);
  grad.addColorStop(0, "#cbd5e1");
  grad.addColorStop(0.45, "#ffffff");
  grad.addColorStop(1, "#64748b");
  ctx.fillStyle = grad;
  ctx.shadowColor = "rgba(255,255,255,0.35)";
  ctx.shadowBlur = 10;
  ctx.fillText(text, x, y);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(15,23,42,0.65)";
  ctx.lineWidth = 1;
  ctx.strokeText(text, x, y);
  ctx.restore();
}

export function drawNeonRoutePath(
  ctx: CanvasRenderingContext2D,
  run: RunEntry,
  box: { x: number; y: number; w: number; h: number },
  progress = 1,
) {
  const pad = 28;
  const points = routePoints(run, box.w - pad * 2, box.h - pad * 2).map(
    ([px, py]) => [box.x + pad + px, box.y + pad + py] as [number, number],
  );
  if (points.length < 2) return;

  const total = points.length - 1;
  const end = Math.max(1, Math.floor(total * progress));

  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  ctx.strokeStyle = "rgba(34,211,238,0.25)";
  ctx.lineWidth = 14;
  ctx.shadowColor = NEON_CYAN;
  ctx.shadowBlur = 24;
  ctx.beginPath();
  points.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
  ctx.stroke();

  ctx.strokeStyle = NEON_MAGENTA;
  ctx.lineWidth = 4;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  for (let i = 0; i <= end; i++) {
    const [px, py] = points[i]!;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  const [hx, hy] = points[end]!;
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#fde047";
  ctx.beginPath();
  ctx.arc(hx, hy, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawAestheticStatsPanel(
  ctx: CanvasRenderingContext2D,
  run: RunEntry,
  x: number,
  y: number,
  w: number,
) {
  ctx.save();
  ctx.fillStyle = "rgba(8,6,20,0.72)";
  ctx.strokeStyle = "rgba(34,211,238,0.45)";
  ctx.lineWidth = 1.5;
  ctx.shadowColor = NEON_VIOLET;
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.roundRect(x, y, w, 88, 14);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;

  const cols = [
    { label: "DISTANCE", value: `${run.miles.toFixed(2)} MI` },
    { label: "PACE", value: formatPace(run.paceSeconds) },
    { label: "TOP", value: `${run.topSpeed.toFixed(1)} MPH` },
  ];
  const colW = w / 3;
  cols.forEach((col, i) => {
    const cx = x + colW * i + colW / 2;
    ctx.textAlign = "center";
    ctx.font = "600 11px system-ui, sans-serif";
    ctx.fillStyle = "rgba(148,163,184,0.9)";
    ctx.fillText(col.label, cx, y + 28);
    drawChromeTitle(ctx, col.value, cx, y + 58, 18);
  });
  ctx.restore();
}

export function drawAestheticPhotoVignette(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, "rgba(12,4,24,0.15)");
  g.addColorStop(0.55, "transparent");
  g.addColorStop(1, "rgba(6,4,15,0.82)");
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = "rgba(34,211,238,0.55)";
  ctx.lineWidth = 2;
  ctx.shadowColor = NEON_CYAN;
  ctx.shadowBlur = 14;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  ctx.shadowBlur = 0;
}
