import {
  DEFAULT_PALETTE,
  drawGround,
  drawRunner,
  drawSky,
  drawSkyline,
  type Palette,
} from "@/components/app/pixel-scene";
import { drawStamp } from "@/lib/card-art";
import { formatPace, type RunEntry } from "@/lib/game-state";
import { drawFilteredPhoto } from "@/lib/vhs-effects";
import { drawOfficialLogo } from "@/lib/watermark";

export const HERO_CARD_W = 1080;
export const HERO_CARD_H = 1620;

function pixelFont(size: number) {
  return `${size}px "Press Start 2P", ui-monospace, SFMono-Regular, Menlo, monospace`;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.crossOrigin = "anonymous";
    img.src = src;
  });
}

export type HeroCardComposeOptions = {
  run: RunEntry;
  palette?: Palette;
  /** Workout photo from Strava upload (optional). */
  photoSrc?: string | null;
  notes?: string;
  vhsTick?: number;
};

/** Compose the share-ready 8-Bit Runner hero trading card. */
export async function composeHeroCard(
  canvas: HTMLCanvasElement,
  { run, palette = DEFAULT_PALETTE, photoSrc, notes, vhsTick = 0 }: HeroCardComposeOptions,
): Promise<string> {
  canvas.width = HERO_CARD_W;
  canvas.height = HERO_CARD_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const bg = ctx.createLinearGradient(0, 0, 0, HERO_CARD_H);
  bg.addColorStop(0, "#1a1438");
  bg.addColorStop(0.45, "#0f1228");
  bg.addColorStop(1, "#060812");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, HERO_CARD_W, HERO_CARD_H);

  // Trading-card double frame
  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.roundRect(24, 24, HERO_CARD_W - 48, HERO_CARD_H - 48, 36);
  ctx.stroke();
  ctx.strokeStyle = "rgba(16,185,129,0.65)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(36, 36, HERO_CARD_W - 72, HERO_CARD_H - 72, 28);
  ctx.stroke();

  drawOfficialLogo(ctx, HERO_CARD_W / 2, 78, 1.15, "center");

  const artBox = { x: 56, y: 148, w: HERO_CARD_W - 112, h: 820 };

  if (photoSrc) {
    const photo = await loadImage(photoSrc);
    drawFilteredPhoto(ctx, canvas, photo, artBox.x, artBox.y, artBox.w, artBox.h, {
      tick: vhsTick,
      rec: true,
    });
  } else {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(artBox.x, artBox.y, artBox.w, artBox.h, 24);
    ctx.clip();
    const sceneH = artBox.h;
    drawSky(ctx, artBox.w, sceneH, true);
    drawSkyline(ctx, artBox.w, sceneH - 90, 30, 0);
    drawSkyline(ctx, artBox.w, sceneH - 90, 30, 1);
    drawGround(ctx, artBox.w, sceneH, sceneH - 90, 30);
    ctx.translate(artBox.x, artBox.y);
    ctx.restore();
  }

  // Prominent pixel avatar — foreground hero
  const avatarW = 280;
  const avatarH = 340;
  const avatarX = artBox.x + artBox.w / 2 - avatarW / 2;
  const avatarY = artBox.y + artBox.h - avatarH - 24;

  ctx.save();
  ctx.fillStyle = "rgba(5,6,15,0.72)";
  ctx.beginPath();
  ctx.roundRect(avatarX - 16, avatarY - 16, avatarW + 32, avatarH + 32, 20);
  ctx.fill();
  ctx.strokeStyle = "#10b981";
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.beginPath();
  ctx.rect(avatarX, avatarY, avatarW, avatarH);
  ctx.clip();
  ctx.translate(avatarX, avatarY);
  drawSky(ctx, avatarW, avatarH, true);
  drawSkyline(ctx, avatarW, avatarH - 56, 0, 0);
  drawSkyline(ctx, avatarW, avatarH - 56, 0, 1);
  drawGround(ctx, avatarW, avatarH, avatarH - 56, 0);
  drawRunner(ctx, avatarW / 2 - 36, avatarH - 56, 7, 2, palette);
  ctx.restore();

  ctx.strokeStyle = "rgba(251,191,36,0.55)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(artBox.x, artBox.y, artBox.w, artBox.h, 24);
  ctx.stroke();

  // Run title plate
  ctx.fillStyle = "rgba(5,6,15,0.88)";
  ctx.beginPath();
  ctx.roundRect(56, artBox.y + artBox.h + 20, HERO_CARD_W - 112, 72, 16);
  ctx.fill();
  ctx.textAlign = "center";
  ctx.fillStyle = "#fbbf24";
  ctx.font = pixelFont(18);
  ctx.fillText(run.title.toUpperCase().slice(0, 22), HERO_CARD_W / 2, artBox.y + artBox.h + 68);

  // Arcade stat panels
  const stats: [string, string][] = [
    ["DISTANCE", `${run.miles.toFixed(2)} MI`],
    ["PACE", `${formatPace(run.paceSeconds)}/MI`],
    ["TOP SPD", `${run.topSpeed.toFixed(1)} MPH`],
  ];
  const panelW = (HERO_CARD_W - 112 - 24) / 3;
  stats.forEach(([label, value], i) => {
    const px = 56 + i * (panelW + 12);
    const py = artBox.y + artBox.h + 108;
    ctx.fillStyle = "#0b1020";
    ctx.beginPath();
    ctx.roundRect(px, py, panelW, 130, 14);
    ctx.fill();
    ctx.strokeStyle = "rgba(16,185,129,0.45)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.fillStyle = "#64748b";
    ctx.font = pixelFont(11);
    ctx.fillText(label, px + panelW / 2, py + 36);
    ctx.fillStyle = "#fde047";
    ctx.font = pixelFont(15);
    ctx.fillText(value, px + panelW / 2, py + 78);
  });

  if (notes?.trim()) {
    ctx.fillStyle = "rgba(15,23,42,0.92)";
    ctx.beginPath();
    ctx.roundRect(56, artBox.y + artBox.h + 258, HERO_CARD_W - 112, 140, 16);
    ctx.fill();
    ctx.textAlign = "left";
    ctx.fillStyle = "#64748b";
    ctx.font = pixelFont(10);
    ctx.fillText("ADVENTURER NOTES", 80, artBox.y + artBox.h + 296);
    ctx.fillStyle = "#e2e8f0";
    ctx.font = '28px ui-sans-serif, system-ui, sans-serif';
    const words = notes.trim().split(" ");
    let line = "";
    let ly = artBox.y + artBox.h + 336;
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > HERO_CARD_W - 160) {
        ctx.fillText(line, 80, ly);
        line = word;
        ly += 36;
        if (ly > artBox.y + artBox.h + 380) break;
      } else {
        line = test;
      }
    }
    if (ly <= artBox.y + artBox.h + 380) ctx.fillText(line, 80, ly);
  }

  drawStamp(ctx, HERO_CARD_W - 130, HERO_CARD_H - 150, 58, "VERIFIED", "STRAVA");
  drawOfficialLogo(ctx, 56, HERO_CARD_H - 118, 0.95, "left");

  return canvas.toDataURL("image/png");
}

/** Render a compact preview (used in Quest drawer). */
export async function composeHeroCardPreview(
  canvas: HTMLCanvasElement,
  run: RunEntry,
  palette: Palette = DEFAULT_PALETTE,
): Promise<void> {
  const scale = 0.24;
  const W = Math.round(HERO_CARD_W * scale);
  const H = Math.round(HERO_CARD_H * scale);
  const off = document.createElement("canvas");
  await composeHeroCard(off, { run, palette });
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(off, 0, 0, W, H);
}
