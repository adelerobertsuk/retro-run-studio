/** Shared "8-Bit Runner" watermark badge stamped onto every export. */
export function drawWatermark(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale = 1,
) {
  const w = 250 * scale;
  const h = 56 * scale;
  ctx.save();
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = "rgba(5,6,15,0.55)";
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 14 * scale);
  ctx.fill();
  ctx.strokeStyle = "rgba(16,185,129,0.7)";
  ctx.lineWidth = 2 * scale;
  ctx.stroke();
  ctx.fillStyle = "#10b981";
  ctx.fillRect(x + 16 * scale, y + h / 2 - 6 * scale, 12 * scale, 12 * scale);
  ctx.fillStyle = "#e2e8f0";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = `${16 * scale}px "Press Start 2P", ui-monospace, Menlo, monospace`;
  ctx.fillText("8-BIT RUNNER", x + 40 * scale, y + h / 2 + 1 * scale);
  ctx.restore();
  ctx.textBaseline = "alphabetic";
}
