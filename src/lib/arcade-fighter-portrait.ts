/**
 * High-detail unisex 80s arcade-fighter animal portrait (fox courier).
 * Drawn on canvas — classic bust pose with headband and gi collar.
 */
export function drawArcadeFighterPortrait(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
) {
  const px = size / 14;
  ctx.save();
  ctx.translate(x, y);

  const p = (cx: number, cy: number, color: string, w = 1, h = 1) => {
    ctx.fillStyle = color;
    ctx.fillRect(cx * px, cy * px, w * px, h * px);
  };

  // Background burst — arcade select screen
  ctx.fillStyle = "#1a1438";
  ctx.fillRect(0, 0, 14 * px, 14 * px);
  ctx.strokeStyle = "#6366f1";
  ctx.lineWidth = px;
  ctx.strokeRect(px * 0.5, px * 0.5, 13 * px, 13 * px);
  ctx.strokeStyle = "#fbbf24";
  ctx.strokeRect(px * 1.5, px * 1.5, 11 * px, 11 * px);

  // Ears
  p(3, 1, "#c2410c", 2, 2);
  p(9, 1, "#c2410c", 2, 2);
  p(3.5, 1.5, "#fdba74", 1, 1);
  p(9.5, 1.5, "#fdba74", 1, 1);

  // Head fur
  p(4, 3, "#ea580c", 6, 5);
  p(5, 2, "#ea580c", 4, 1);
  // Face mask (lighter muzzle — universal friendly fighter look)
  p(5, 5, "#fed7aa", 4, 3);
  p(6, 8, "#fed7aa", 2, 1);

  // Headband
  p(3, 4, "#dc2626", 8, 1);
  p(2, 4, "#ef4444", 1, 1);
  p(11, 4, "#ef4444", 1, 1);
  p(1, 3.5, "#fca5a5", 1, 2);

  // Eyes — fierce arcade fighter
  p(5, 5.5, "#1e1b4b", 1, 1);
  p(8, 5.5, "#1e1b4b", 1, 1);
  p(5.5, 5.5, "#fef3c7", 1, 1);
  p(8.5, 5.5, "#fef3c7", 1, 1);
  p(6, 6.5, "#0f172a", 1, 1);
  p(8, 6.5, "#0f172a", 1, 1);

  // Nose
  p(6.5, 7, "#1e293b", 1, 1);

  // Gi / collar
  p(3, 9, "#64748b", 8, 3);
  p(4, 9, "#94a3b8", 6, 1);
  p(6, 10, "#334155", 2, 2);
  p(5, 11, "#475569", 4, 1);

  // Gold champion trim
  p(3, 9, "#fbbf24", 8, 1);
  p(2, 10, "#f59e0b", 1, 2);
  p(11, 10, "#f59e0b", 1, 2);

  ctx.restore();
}
