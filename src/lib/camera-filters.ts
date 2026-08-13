import { drawAnalogGrade, applyVhsPostProcess } from "@/lib/vhs-effects";

export type VideoFilterId = "filter-fuji" | "filter-kodak";
export type PhotoBoothId = "booth-fuji" | "booth-kodak";

export const VIDEO_FILTERS: { id: VideoFilterId; name: string; hint: string }[] = [
  { id: "filter-fuji", name: "Cine SF", hint: "Cool greens · soft grain" },
  { id: "filter-kodak", name: "Gold Portra", hint: "Golden hour · heavy bleed" },
];

export const PHOTO_BOOTHS: { id: PhotoBoothId; name: string; hint: string }[] = [
  { id: "booth-fuji", name: "Insta SQ", hint: "Matte instant warmth" },
  { id: "booth-kodak", name: "DQS Classic", hint: "Saturated gold & magenta" },
];

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  x: number,
  y: number,
  w: number,
  h: number,
  cssFilter: string,
) {
  const iw = (img as HTMLImageElement).naturalWidth || (img as HTMLVideoElement).videoWidth || w;
  const ih = (img as HTMLImageElement).naturalHeight || (img as HTMLVideoElement).videoHeight || h;
  const scale = Math.max(w / iw, h / ih);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.filter = cssFilter;
  ctx.drawImage(img, x + (w - iw * scale) / 2, y + (h - ih * scale) / 2, iw * scale, ih * scale);
  ctx.filter = "none";
  ctx.restore();
}

/** Dazz Cam–style video frame — cool cine vs warm portra grading. */
export function drawVideoFilterFrame(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  img: CanvasImageSource,
  x: number,
  y: number,
  w: number,
  h: number,
  filter: VideoFilterId,
  tick: number,
) {
  const isFuji = filter === "filter-fuji";
  drawCoverImage(
    ctx,
    img,
    x,
    y,
    w,
    h,
    isFuji
      ? "sepia(0.22) saturate(1.05) contrast(1.05) hue-rotate(-8deg) brightness(1.02)"
      : "sepia(0.48) saturate(1.35) contrast(1.12) hue-rotate(12deg) brightness(1.06)",
  );

  if (isFuji) {
    ctx.save();
    ctx.globalCompositeOperation = "soft-light";
    const cool = ctx.createLinearGradient(x, y, x + w, y + h);
    cool.addColorStop(0, "rgba(120,200,160,0.28)");
    cool.addColorStop(1, "rgba(40,80,120,0.35)");
    ctx.fillStyle = cool;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  } else {
    drawAnalogGrade(ctx, x, y, w, h);
    ctx.save();
    ctx.globalCompositeOperation = "overlay";
    ctx.fillStyle = "rgba(255,180,60,0.22)";
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }

  applyVhsPostProcess(ctx, canvas, x, y, w, h, {
    tick,
    rec: true,
    chromaShift: isFuji ? 3 : 7,
  });
}

/** Still photo booth grade for hero cards and exports. */
export function drawPhotoBoothGrade(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  booth: PhotoBoothId,
) {
  const isFuji = booth === "booth-fuji";
  ctx.save();
  ctx.globalCompositeOperation = isFuji ? "soft-light" : "overlay";
  const g = ctx.createLinearGradient(x, y, x, y + h);
  if (isFuji) {
    g.addColorStop(0, "rgba(180,220,200,0.35)");
    g.addColorStop(0.5, "rgba(255,240,220,0.2)");
    g.addColorStop(1, "rgba(60,100,140,0.3)");
  } else {
    g.addColorStop(0, "rgba(255,200,80,0.35)");
    g.addColorStop(0.5, "rgba(255,120,140,0.22)");
    g.addColorStop(1, "rgba(80,40,120,0.28)");
  }
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.restore();

  applyVhsPostProcess(ctx, ctx.canvas, x, y, w, h, {
    tick: 0,
    rec: false,
    chromaShift: isFuji ? 2 : 6,
  });
}
