import { drawStamp } from "@/lib/card-art";
import { drawTradingCardBorder, type CardBorderId } from "@/lib/card-borders";
import type { GladiatorStatus } from "@/lib/gladiator-titles";
import { drawGladiatorPlaque } from "@/lib/gladiator-titles";
import type { RunEntry } from "@/lib/game-state";
import { drawAestheticStatsPanel, drawChromeTitle, drawSynthwaveBackdrop } from "@/lib/synthwave-overlay";
import { drawFilteredPhoto } from "@/lib/vhs-effects";
import { drawOfficialLogo } from "@/lib/watermark";

export const HERO_CARD_W = 1080;
export const HERO_CARD_H = 1620;

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
  /** @deprecated Palette no longer used — kept for API compatibility. */
  palette?: unknown;
  photoSrc?: string | null;
  notes?: string;
  vhsTick?: number;
  border?: CardBorderId;
  gladiator?: GladiatorStatus;
};

/** Compose the share-ready 8-Bit Runner hero trading card. */
export async function composeHeroCard(
  canvas: HTMLCanvasElement,
  {
    run,
    photoSrc,
    notes,
    vhsTick = 0,
    border = "border-classic",
    gladiator,
  }: HeroCardComposeOptions,
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

  // Trading-card frame from Arcade Shop
  drawTradingCardBorder(ctx, HERO_CARD_W, HERO_CARD_H, border, vhsTick);

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
    ctx.translate(artBox.x, artBox.y);
    drawSynthwaveBackdrop(ctx, artBox.w, artBox.h);
    ctx.restore();
  }

  ctx.strokeStyle = "rgba(34,211,238,0.55)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(artBox.x, artBox.y, artBox.w, artBox.h, 24);
  ctx.stroke();

  drawChromeTitle(
    ctx,
    run.title.toUpperCase().slice(0, 22),
    HERO_CARD_W / 2,
    artBox.y + artBox.h + 58,
    22,
  );

  if (gladiator) {
    drawGladiatorPlaque(ctx, HERO_CARD_W / 2, artBox.y + artBox.h + 108, gladiator, {
      width: HERO_CARD_W - 160,
    });
  }

  const statsYOffset = gladiator ? 68 : 0;
  drawAestheticStatsPanel(
    ctx,
    run,
    56,
    artBox.y + artBox.h + 108 + statsYOffset,
    HERO_CARD_W - 112,
  );

  if (notes?.trim()) {
    ctx.fillStyle = "rgba(15,23,42,0.92)";
    ctx.beginPath();
    ctx.roundRect(56, artBox.y + artBox.h + 258, HERO_CARD_W - 112, 140, 16);
    ctx.fill();
    ctx.textAlign = "left";
    ctx.font = '600 11px system-ui, sans-serif';
    ctx.fillStyle = "#64748b";
    ctx.fillText("NOTES", 80, artBox.y + artBox.h + 296);
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
): Promise<void> {
  const scale = 0.24;
  const W = Math.round(HERO_CARD_W * scale);
  const H = Math.round(HERO_CARD_H * scale);
  const off = document.createElement("canvas");
  await composeHeroCard(off, { run });
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(off, 0, 0, W, H);
}
