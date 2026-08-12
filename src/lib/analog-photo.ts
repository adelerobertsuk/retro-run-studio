import { drawWatermark } from "@/lib/watermark";

const pixel = (s: number) =>
  `${s}px "Press Start 2P", ui-monospace, SFMono-Regular, Menlo, monospace`;

/** Warm '80s analog camera grade applied locally to an uploaded photo. */
export function drawAnalogPhoto(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource | null,
  w: number,
  h: number,
  stamp: string,
) {
  ctx.save();
  if (img) {
    const iw = (img as HTMLImageElement).width || w;
    const ih = (img as HTMLImageElement).height || h;
    const scale = Math.max(w / iw, h / ih);
    ctx.filter = "sepia(0.42) saturate(1.35) contrast(1.12) brightness(1.03)";
    ctx.drawImage(img, (w - iw * scale) / 2, (h - ih * scale) / 2, iw * scale, ih * scale);
    ctx.filter = "none";
  } else {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#1c1533");
    g.addColorStop(1, "#0b1020");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "soft-light";
  const warm = ctx.createLinearGradient(0, 0, 0, h);
  warm.addColorStop(0, "rgba(255,176,92,0.55)");
  warm.addColorStop(0.6, "rgba(255,120,80,0.22)");
  warm.addColorStop(1, "rgba(30,90,120,0.45)");
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.25, w / 2, h / 2, h * 0.72);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(3,4,12,0.72)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = "#000";
  for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
  ctx.restore();

  ctx.save();
  ctx.textAlign = "right";
  ctx.shadowColor = "#fbbf24";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#fde68a";
  ctx.font = pixel(Math.round(w / 34));
  ctx.fillText(stamp, w - 24, h - 28);
  ctx.restore();

  drawWatermark(ctx, 24, h - 92, w / 700);
}
