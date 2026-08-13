/** Dazz Cam–style VHS / analog post-process — tape grain, chroma bleed, scanlines. */

export type VhsOptions = {
  /** Animation seed for animated grain (e.g. frame tick). */
  tick?: number;
  /** Draw a REC dot + label in the top-left of the region. */
  rec?: boolean;
  /** Chromatic offset in px. */
  chromaShift?: number;
};

function pixelFont(size: number) {
  return `${size}px "Press Start 2P", ui-monospace, SFMono-Regular, Menlo, monospace`;
}

/** Warm analog grade before VHS overlays. */
export function drawAnalogGrade(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.save();
  ctx.globalCompositeOperation = "soft-light";
  const warm = ctx.createLinearGradient(x, y, x, y + h);
  warm.addColorStop(0, "rgba(255,176,92,0.45)");
  warm.addColorStop(0.55, "rgba(255,120,80,0.18)");
  warm.addColorStop(1, "rgba(30,90,120,0.38)");
  ctx.fillStyle = warm;
  ctx.fillRect(x, y, w, h);
  ctx.restore();

  const vig = ctx.createRadialGradient(x + w / 2, y + h / 2, h * 0.2, x + w / 2, y + h / 2, h * 0.75);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(3,4,12,0.65)");
  ctx.fillStyle = vig;
  ctx.fillRect(x, y, w, h);
}

/** Chromatic aberration + tape grain + scanlines over existing canvas pixels. */
export function applyVhsPostProcess(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: VhsOptions = {},
) {
  const { tick = 0, rec = false, chromaShift = 5 } = opts;

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  // Ghost frame / chroma bleed
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = 0.2;
  ctx.drawImage(canvas, x + chromaShift, y, w, h, x, y, w, h);
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = "#ff00c8";
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = "#00e5ff";
  ctx.fillRect(x - chromaShift * 0.6, y, w, h);
  ctx.globalCompositeOperation = "source-over";

  // Horizontal scanlines
  ctx.globalAlpha = 0.32;
  ctx.fillStyle = "#0b1020";
  for (let row = y; row < y + h; row += 4) {
    ctx.fillRect(x, row, w, 1);
  }

  // Tape grain
  ctx.globalAlpha = 0.22;
  for (let i = 0; i < Math.floor((w * h) / 900); i++) {
    const gx = x + ((tick * 17 + i * 7919) % w);
    const gy = y + ((tick * 31 + i * 6271) % h);
    const bright = ((tick + i * 13) % 5) === 0;
    ctx.fillStyle = bright ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.85)";
    ctx.fillRect(gx, gy, 1, 1);
  }

  // Occasional tracking bar
  if (tick % 120 < 3) {
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    const barY = y + ((tick * 7) % h);
    ctx.fillRect(x, barY, w, 6);
  }

  ctx.globalAlpha = 1;
  ctx.restore();

  if (rec) {
    ctx.fillStyle = "#f87171";
    ctx.beginPath();
    ctx.arc(x + 36, y + 36, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f8fafc";
    ctx.font = pixelFont(Math.max(8, Math.round(w / 42)));
    ctx.textAlign = "left";
    ctx.fillText("REC", x + 54, y + 42);
  }
}

/** Draw an image with sepia analog grade + full VHS stack. */
export function drawFilteredPhoto(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  img: CanvasImageSource,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: VhsOptions = {},
) {
  const iw = (img as HTMLImageElement).naturalWidth || (img as HTMLVideoElement).videoWidth || w;
  const ih = (img as HTMLImageElement).naturalHeight || (img as HTMLVideoElement).videoHeight || h;
  const scale = Math.max(w / iw, h / ih);

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.filter = "sepia(0.38) saturate(1.28) contrast(1.1) brightness(1.04)";
  ctx.drawImage(img, x + (w - iw * scale) / 2, y + (h - ih * scale) / 2, iw * scale, ih * scale);
  ctx.filter = "none";
  ctx.restore();

  drawAnalogGrade(ctx, x, y, w, h);
  applyVhsPostProcess(ctx, canvas, x, y, w, h, opts);
}
