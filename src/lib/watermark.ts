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

/** Vector brand stamp for trading cards and social shares. */
export function drawOfficialLogo(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale = 1,
  align: LogoAlign = "left",
) {
  const w = 280 * scale;
  const h = 56 * scale;
  const left = align === "center" ? x - w / 2 : x;

  ctx.save();
  ctx.globalAlpha = 0.94;
  ctx.fillStyle = "rgba(5,6,15,0.78)";
  ctx.beginPath();
  ctx.roundRect(left, y, w, h, 12 * scale);
  ctx.fill();
  ctx.strokeStyle = "rgba(34,211,238,0.5)";
  ctx.lineWidth = 2 * scale;
  ctx.stroke();

  const grad = ctx.createLinearGradient(left, y, left + w, y + h);
  grad.addColorStop(0, "#22d3ee");
  grad.addColorStop(0.5, "#a78bfa");
  grad.addColorStop(1, "#ec4899");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(left + 22 * scale, y + h / 2, 10 * scale, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = `800 ${14 * scale}px system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = "#f8fafc";
  ctx.fillText("8-BIT RUNNER", left + 40 * scale, y + h / 2);
  ctx.restore();
  ctx.textBaseline = "alphabetic";
}
