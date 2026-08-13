/** Shared "8-Bit Runner" watermark badge stamped onto every export. */
export function drawWatermark(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale = 1,
) {
  drawOfficialLogo(ctx, x, y, scale, "left");
}

type LogoAlign = "left" | "center";

/** Prominent official logo stamp for trading cards and social shares. */
export function drawOfficialLogo(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale = 1,
  align: LogoAlign = "left",
) {
  const w = 280 * scale;
  const h = 62 * scale;
  const left = align === "center" ? x - w / 2 : x;

  ctx.save();
  ctx.globalAlpha = 0.94;
  ctx.fillStyle = "rgba(5,6,15,0.78)";
  ctx.beginPath();
  ctx.roundRect(left, y, w, h, 14 * scale);
  ctx.fill();
  ctx.strokeStyle = "rgba(251,191,36,0.75)";
  ctx.lineWidth = 2.5 * scale;
  ctx.stroke();
  ctx.strokeStyle = "rgba(16,185,129,0.55)";
  ctx.lineWidth = 1.5 * scale;
  ctx.strokeRect(left + 6 * scale, y + 6 * scale, w - 12 * scale, h - 12 * scale);

  ctx.fillStyle = "#10b981";
  ctx.fillRect(left + 16 * scale, y + h / 2 - 7 * scale, 14 * scale, 14 * scale);
  ctx.fillStyle = "#6366f1";
  ctx.fillRect(left + 20 * scale, y + h / 2 - 3 * scale, 6 * scale, 6 * scale);

  ctx.fillStyle = "#f8fafc";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = `${15 * scale}px "Press Start 2P", ui-monospace, Menlo, monospace`;
  ctx.fillText("8-BIT", left + 42 * scale, y + h / 2 - 5 * scale);
  ctx.fillStyle = "#10b981";
  ctx.font = `${11 * scale}px "Press Start 2P", ui-monospace, Menlo, monospace`;
  ctx.fillText("RUNNER", left + 42 * scale, y + h / 2 + 14 * scale);
  ctx.restore();
  ctx.textBaseline = "alphabetic";
}
