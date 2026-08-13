import { drawStamp } from "@/lib/card-art";
import { drawPhotoBoothGrade, type PhotoBoothId } from "@/lib/camera-filters";
import type { CardBorderId } from "@/lib/card-borders";
import { drawTradingCardBorder } from "@/lib/card-borders";
import type { RunEntry } from "@/lib/game-state";
import { drawGamerMediaOverlay } from "@/lib/route-reveal";
import { drawOfficialLogo } from "@/lib/watermark";
import type { GladiatorStatus } from "@/lib/gladiator-titles";
import { drawChromeTitle, drawSynthwaveBackdrop, type MediaExportMode } from "@/lib/synthwave-overlay";

export const PHOTO_BOOTH_W = 1080;
export const PHOTO_BOOTH_H = 1620;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.crossOrigin = "anonymous";
    img.src = src;
  });
}

function drawCoverPhoto(
  ctx: CanvasRenderingContext2D,
  photo: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const scale = Math.max(w / photo.width, h / photo.height);
  ctx.drawImage(
    photo,
    x + (w - photo.width * scale) / 2,
    y + (h - photo.height * scale) / 2,
    photo.width * scale,
    photo.height * scale,
  );
}

export type PhotoBoothOptions = {
  run: RunEntry;
  booth: PhotoBoothId;
  border: CardBorderId;
  avatarStyle?: string;
  photoSrc?: string | null;
  palette?: never;
  gladiator?: GladiatorStatus;
  exportMode?: MediaExportMode;
};

/** Still photo booth export — aesthetic is pure film grade; gamer adds Tron overlay. */
export async function composePhotoBooth(
  canvas: HTMLCanvasElement,
  {
    run,
    booth,
    border,
    photoSrc,
    gladiator,
    exportMode = "gamer",
  }: PhotoBoothOptions,
): Promise<string> {
  canvas.width = PHOTO_BOOTH_W;
  canvas.height = PHOTO_BOOTH_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const artBox = { x: 56, y: 140, w: PHOTO_BOOTH_W - 112, h: 860 };

  if (exportMode === "aesthetic") {
    if (photoSrc) {
      try {
        const photo = await loadImage(photoSrc);
        drawCoverPhoto(ctx, photo, 0, 0, PHOTO_BOOTH_W, PHOTO_BOOTH_H);
        drawPhotoBoothGrade(ctx, 0, 0, PHOTO_BOOTH_W, PHOTO_BOOTH_H, booth);
      } catch {
        drawSynthwaveBackdrop(ctx, PHOTO_BOOTH_W, PHOTO_BOOTH_H);
      }
    } else {
      drawSynthwaveBackdrop(ctx, PHOTO_BOOTH_W, PHOTO_BOOTH_H);
    }
    return canvas.toDataURL("image/png");
  }

  const bg = ctx.createLinearGradient(0, 0, 0, PHOTO_BOOTH_H);
  bg.addColorStop(0, "#1a1438");
  bg.addColorStop(0.5, "#0f1228");
  bg.addColorStop(1, "#060812");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, PHOTO_BOOTH_W, PHOTO_BOOTH_H);

  drawTradingCardBorder(ctx, PHOTO_BOOTH_W, PHOTO_BOOTH_H, border, 0);
  drawOfficialLogo(ctx, PHOTO_BOOTH_W / 2, 78, 1.1, "center");

  if (photoSrc) {
    try {
      const photo = await loadImage(photoSrc);
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(artBox.x, artBox.y, artBox.w, artBox.h, 24);
      ctx.clip();
      drawCoverPhoto(ctx, photo, artBox.x, artBox.y, artBox.w, artBox.h);
      ctx.restore();
      drawPhotoBoothGrade(ctx, artBox.x, artBox.y, artBox.w, artBox.h, booth);
      drawGamerMediaOverlay(ctx, run, artBox, 479, gladiator);
    } catch {
      ctx.save();
      ctx.translate(artBox.x, artBox.y);
      drawSynthwaveBackdrop(ctx, artBox.w, artBox.h);
      ctx.restore();
      drawGamerMediaOverlay(ctx, run, artBox, 479, gladiator);
    }
  } else {
    ctx.save();
    ctx.translate(artBox.x, artBox.y);
    drawSynthwaveBackdrop(ctx, artBox.w, artBox.h);
    ctx.restore();
    drawGamerMediaOverlay(ctx, run, artBox, 479, gladiator);
  }

  ctx.fillStyle = "rgba(5,6,15,0.88)";
  ctx.beginPath();
  ctx.roundRect(56, artBox.y + artBox.h + 20, PHOTO_BOOTH_W - 112, 64, 14);
  ctx.fill();
  ctx.textAlign = "center";
  drawChromeTitle(
    ctx,
    run.title.toUpperCase().slice(0, 22),
    PHOTO_BOOTH_W / 2,
    artBox.y + artBox.h + 62,
    16,
  );

  if (gladiator) {
    ctx.textAlign = "center";
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.fillStyle = "rgba(236,72,153,0.95)";
    ctx.fillText(gladiator.title.toUpperCase(), PHOTO_BOOTH_W / 2, artBox.y + artBox.h + 100);
  }

  drawStamp(ctx, PHOTO_BOOTH_W - 120, PHOTO_BOOTH_H - 130, 50, "PHOTO", "BOOTH");
  drawOfficialLogo(ctx, 56, PHOTO_BOOTH_H - 100, 0.85, "left");

  return canvas.toDataURL("image/png");
}

export async function composePhotoBoothPreview(
  canvas: HTMLCanvasElement,
  options: PhotoBoothOptions,
): Promise<void> {
  const scale = 0.24;
  const W = Math.round(PHOTO_BOOTH_W * scale);
  const H = Math.round(PHOTO_BOOTH_H * scale);
  const off = document.createElement("canvas");
  await composePhotoBooth(off, options);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = options.exportMode === "aesthetic";
  ctx.drawImage(off, 0, 0, W, H);
}
