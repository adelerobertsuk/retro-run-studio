import { drawWatermark } from "@/lib/watermark";
import { drawAnalogGrade, applyVhsPostProcess } from "@/lib/vhs-effects";

const pixel = (s: number) =>
  `${s}px "Press Start 2P", ui-monospace, SFMono-Regular, Menlo, monospace`;

/** Warm '80s analog camera grade applied locally to an uploaded photo. */
export function drawAnalogPhoto(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  img: CanvasImageSource | null,
  w: number,
  h: number,
  stamp: string,
  tick = 0,
) {
  if (img) {
    const iw = (img as HTMLImageElement).naturalWidth || (img as HTMLVideoElement).videoWidth || w;
    const ih = (img as HTMLImageElement).naturalHeight || (img as HTMLVideoElement).videoHeight || h;
    const scale = Math.max(w / iw, h / ih);
    ctx.save();
    ctx.filter = "sepia(0.42) saturate(1.35) contrast(1.12) brightness(1.03)";
    ctx.drawImage(img, (w - iw * scale) / 2, (h - ih * scale) / 2, iw * scale, ih * scale);
    ctx.filter = "none";
    ctx.restore();
    drawAnalogGrade(ctx, 0, 0, w, h);
    applyVhsPostProcess(ctx, canvas, 0, 0, w, h, { tick, rec: true, chromaShift: 4 });
  } else {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#1c1533");
    g.addColorStop(1, "#0b1020");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

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
