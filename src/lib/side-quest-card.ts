import { drawOfficialLogo } from "@/lib/watermark";
import type { GladiatorStatus } from "@/lib/gladiator-titles";
import { ERRAND_TOKEN_REWARD, type ErrandEntry } from "@/lib/game-state";

export const SIDE_QUEST_CARD_W = 1080;
export const SIDE_QUEST_CARD_H = 1620;

const QUIRKY_TITLES = [
  "Mayor of Greggs",
  "Conqueror of the Cereal Aisle",
  "Duke of the Dog Park",
  "Baron of Bedtime Stretching",
  "Knight of the Kettle Boil",
  "Sovereign of Side Streets",
  "Champion of the Corner Shop",
  "Guardian of the Green Cross Code",
  "Earl of Early Lunch",
  "High Priest of Hydration",
  "Warden of the Washing Line",
  "Captain of the Commute Detour",
];

type CardTheme = {
  frame: string;
  photoBg: string;
  banner: string;
  cream: string;
  headerInk: string;
  bubble: string;
};

const CARD_THEMES: CardTheme[] = [
  {
    frame: "#65a30d",
    photoBg: "#a21caf",
    banner: "#38bdf8",
    cream: "#f3ede0",
    headerInk: "#1c1917",
    bubble: "#fde047",
  },
  {
    frame: "#ea580c",
    photoBg: "#1d4ed8",
    banner: "#facc15",
    cream: "#faf5eb",
    headerInk: "#1c1917",
    bubble: "#fef08a",
  },
  {
    frame: "#166534",
    photoBg: "#ca8a04",
    banner: "#f472b6",
    cream: "#f5f0e6",
    headerInk: "#14532d",
    bubble: "#fef9c3",
  },
  {
    frame: "#be123c",
    photoBg: "#0e7490",
    banner: "#fde047",
    cream: "#f8f2ea",
    headerInk: "#1c1917",
    bubble: "#fecdd3",
  },
  {
    frame: "#4338ca",
    photoBg: "#c2410c",
    banner: "#a3e635",
    cream: "#f0ebe3",
    headerInk: "#1e1b4b",
    bubble: "#c7d2fe",
  },
];

const BUBBLE_FONT = '900 72px "Arial Black", "Helvetica Neue", Arial, sans-serif';
const SERIF_FONT = '800 34px Georgia, "Times New Roman", serif';
const SANS_FONT = '700 26px ui-sans-serif, system-ui, sans-serif';
const SANS_MED = '600 22px ui-sans-serif, system-ui, sans-serif';

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
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

function getCardTheme(errand: ErrandEntry): CardTheme {
  const h = hashString(`${errand.id}-${errand.date}`);
  return CARD_THEMES[h % CARD_THEMES.length]!;
}

function getCardNumber(errand: ErrandEntry): number {
  return (hashString(`${errand.id}-${errand.text}`) % 50) + 1;
}

function drawPaperTexture(ctx: CanvasRenderingContext2D, w: number, h: number, cream: string) {
  ctx.fillStyle = cream;
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.globalAlpha = 0.04;
  for (let y = 0; y < h; y += 6) {
    ctx.fillStyle = y % 12 === 0 ? "#1c1917" : "#78716c";
    ctx.fillRect(0, y, w, 1);
  }
  ctx.restore();
}

function drawBubbleText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  fill: string,
  outline: string,
) {
  ctx.font = BUBBLE_FONT;
  ctx.textBaseline = "alphabetic";
  const chars = text.split("");
  const spacing = 6;
  const totalW =
    chars.reduce((sum, ch) => sum + ctx.measureText(ch).width, 0) +
    spacing * (chars.length - 1);
  let x = cx - totalW / 2;

  for (const ch of chars) {
    ctx.lineJoin = "round";
    ctx.strokeStyle = outline;
    ctx.lineWidth = 10;
    ctx.strokeText(ch, x, y);
    ctx.fillStyle = fill;
    ctx.fillText(ch, x, y);
    x += ctx.measureText(ch).width + spacing;
  }
}

function drawPhotoCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = img.width * scale;
  const sh = img.height * scale;
  const ox = x + (w - sw) / 2;
  const oy = y + (h - sh) / 2;
  ctx.drawImage(img, ox, oy, sw, sh);
}

function drawDuotonePortrait(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  x: number,
  y: number,
  w: number,
  h: number,
  photoBg: string,
) {
  ctx.fillStyle = photoBg;
  ctx.fillRect(x, y, w, h);

  if (!img) {
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 0) {
          ctx.fillRect(x + col * (w / 8), y + row * (h / 10), w / 16, h / 20);
        }
      }
    }
    return;
  }

  const off = document.createElement("canvas");
  off.width = w;
  off.height = h;
  const octx = off.getContext("2d");
  if (!octx) return;

  octx.filter = "grayscale(100%) contrast(1.2)";
  drawPhotoCover(octx, img, 0, 0, w, h);
  octx.filter = "none";

  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.drawImage(off, x, y);
  ctx.fillStyle = photoBg;
  ctx.globalAlpha = 0.55;
  ctx.fillRect(x, y, w, h);
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = 0.18;
  ctx.drawImage(off, x, y);
  ctx.restore();
}

function drawArchedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  baseY: number,
  radius: number,
  fontSize: number,
) {
  ctx.save();
  ctx.font = `900 ${fontSize}px Georgia, "Times New Roman", serif`;
  ctx.fillStyle = "#1c1917";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const chars = text.split("");
  const angleSpan = Math.min(0.9, chars.length * 0.065);
  const startAngle = -Math.PI / 2 - angleSpan / 2;
  const step = chars.length > 1 ? angleSpan / (chars.length - 1) : 0;
  chars.forEach((ch, i) => {
    const angle = startAngle + step * i;
    const x = cx + Math.cos(angle) * radius;
    const y = baseY + Math.sin(angle) * radius;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  });
  ctx.restore();
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  fill: string,
) {
  ctx.save();
  ctx.fillStyle = fill;
  ctx.strokeStyle = "#1c1917";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawCurvedBanner(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.35);
  ctx.quadraticCurveTo(x + w / 2, y - h * 0.15, x + w, y + h * 0.35);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.18)";
  ctx.lineWidth = 3;
  ctx.stroke();
}

function drawRunnerBadge(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  gladiator: GladiatorStatus,
  frameColor: string,
) {
  ctx.save();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = frameColor;
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.strokeStyle = "#1c1917";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 8, 0, Math.PI * 2);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = frameColor;
  ctx.font = '800 20px ui-sans-serif, system-ui, sans-serif';
  ctx.fillText("RUNNER", cx, cy - 10);
  ctx.fillStyle = "#1c1917";
  ctx.font = '900 30px ui-sans-serif, system-ui, sans-serif';
  ctx.fillText(`LV ${gladiator.level}`, cx, cy + 22);
  ctx.restore();
}

export function rollSideQuestTitle(
  errand: Partial<Pick<ErrandEntry, "text" | "date" | "id">>,
): string {
  const id = errand.id ?? "quest";
  const text = (errand.text ?? "").trim() || "Side quest";
  const date = errand.date ?? new Date().toISOString().slice(0, 10);
  const h = hashString(`${id}-${text}-${date}`);
  return QUIRKY_TITLES[h % QUIRKY_TITLES.length]!;
}

export function coerceErrandEntry(raw: Partial<ErrandEntry> | null | undefined): ErrandEntry {
  const completed = raw?.completed ?? Boolean(raw?.completedAt);
  return {
    id: raw?.id ?? `legacy-${Date.now()}`,
    date: raw?.date ?? new Date().toISOString().slice(0, 10),
    text: (raw?.text ?? "").trim() || "Side quest",
    completed,
    completedAt: completed ? (raw?.completedAt ?? new Date().toISOString()) : null,
    tokens: completed ? (raw?.tokens ?? ERRAND_TOKEN_REWARD) : 0,
    heroTitle: raw?.heroTitle,
    photoSrc: raw?.photoSrc,
  };
}

export function errandDisplayTitle(errand: Partial<ErrandEntry>): string {
  const safe = coerceErrandEntry(errand);
  return safe.heroTitle ?? rollSideQuestTitle(safe);
}

export function errandTokenReward(errand: Partial<ErrandEntry>): number {
  const safe = coerceErrandEntry(errand);
  return safe.completed ? safe.tokens || ERRAND_TOKEN_REWARD : 0;
}

export type SideQuestStats = {
  vibe: number;
  grit: number;
  snack: number;
};

export function sideQuestStats(
  text: string | null | undefined,
  completedAt: string | null = null,
): SideQuestStats {
  const safeText = (text ?? "").trim() || "side quest";
  const h = hashString(safeText);
  const words = safeText.split(/\s+/).length;
  const hour = completedAt ? new Date(completedAt).getHours() : new Date().getHours();
  const vibe = 55 + (h % 35) + Math.min(words * 3, 12);
  const grit = 48 + (words % 8) * 5 + (hour < 9 ? 8 : hour > 20 ? 4 : 0);
  const snack = 40 + (h % 45) + (safeText.toLowerCase().includes("shop") ? 15 : 0);
  return {
    vibe: Math.min(99, vibe),
    grit: Math.min(99, grit),
    snack: Math.min(99, snack),
  };
}

/** Vintage 70s/80s trading-card export for a completed side quest. */
export async function composeSideQuestCard(
  canvas: HTMLCanvasElement,
  errand: ErrandEntry,
  photoSrc?: string | null,
  gladiator?: GladiatorStatus,
): Promise<string> {
  const safe = coerceErrandEntry(errand);
  canvas.width = SIDE_QUEST_CARD_W;
  canvas.height = SIDE_QUEST_CARD_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const theme = getCardTheme(safe);
  const title = errandDisplayTitle(safe);
  const completedAt = safe.completedAt ?? new Date().toISOString();
  const questText = safe.text;
  const cardNo = getCardNumber(safe);
  const tokens = errandTokenReward(safe);

  drawPaperTexture(ctx, SIDE_QUEST_CARD_W, SIDE_QUEST_CARD_H, theme.cream);

  ctx.strokeStyle = "#1c1917";
  ctx.lineWidth = 3;
  ctx.strokeRect(18, 18, SIDE_QUEST_CARD_W - 36, SIDE_QUEST_CARD_H - 36);

  const frame = { x: 44, y: 44, w: SIDE_QUEST_CARD_W - 88, h: SIDE_QUEST_CARD_H - 120 };
  ctx.fillStyle = theme.frame;
  ctx.beginPath();
  ctx.roundRect(frame.x, frame.y, frame.w, frame.h, 48);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.28)";
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.strokeStyle = theme.bubble;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.roundRect(frame.x + 10, frame.y + 10, frame.w - 20, frame.h - 20, 40);
  ctx.stroke();

  const inner = { x: frame.x + 28, y: frame.y + 28, w: frame.w - 56, h: frame.h - 56 };

  drawBubbleText(ctx, "8-BIT RUNNER", SIDE_QUEST_CARD_W / 2, frame.y + 72, theme.bubble, "#1c1917");

  const portrait = {
    x: inner.x + 32,
    y: inner.y + 100,
    w: inner.w - 64,
    h: 860,
  };

  ctx.fillStyle = theme.photoBg;
  ctx.beginPath();
  ctx.roundRect(portrait.x, portrait.y, portrait.w, portrait.h, 28);
  ctx.fill();

  const pillW = Math.min(portrait.w - 40, 720);
  const pillH = 100;
  const pillX = SIDE_QUEST_CARD_W / 2 - pillW / 2;
  const pillY = portrait.y - pillH / 2 + 8;

  const oval = {
    cx: SIDE_QUEST_CARD_W / 2,
    cy: portrait.y + portrait.h / 2 + 10,
    rx: portrait.w / 2 - 36,
    ry: portrait.h / 2 - 48,
  };

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(oval.cx, oval.cy, oval.rx, oval.ry, 0, 0, Math.PI * 2);
  ctx.clip();

  let photo: HTMLImageElement | null = null;
  if (photoSrc) {
    try {
      photo = await loadImage(photoSrc);
    } catch {
      photo = null;
    }
  }

  const clipBounds = {
    x: oval.cx - oval.rx,
    y: oval.cy - oval.ry,
    w: oval.rx * 2,
    h: oval.ry * 2,
  };
  drawDuotonePortrait(ctx, photo, clipBounds.x, clipBounds.y, clipBounds.w, clipBounds.h, theme.photoBg);
  ctx.restore();

  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.ellipse(oval.cx, oval.cy, oval.rx, oval.ry, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "rgba(0,0,0,0.2)";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.15)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = theme.headerInk;
  ctx.font = SERIF_FONT;
  const titleLine = title.length > 28 ? `${title.slice(0, 25)}…` : title;
  ctx.fillText(titleLine.toUpperCase(), SIDE_QUEST_CARD_W / 2, pillY + 42);
  ctx.font = SANS_MED;
  ctx.fillStyle = "#57534e";
  const subLine = questText.length > 36 ? `${questText.slice(0, 33)}…` : questText;
  ctx.fillText(subLine.toUpperCase(), SIDE_QUEST_CARD_W / 2, pillY + 78);

  const bannerY = portrait.y + portrait.h - 36;
  const bannerW = inner.w - 48;
  const bannerX = inner.x + 24;
  drawCurvedBanner(ctx, bannerX, bannerY, bannerW, 150, theme.banner);

  const bannerMidY = bannerY + 88;
  drawStar(ctx, bannerX + 56, bannerMidY, 16, theme.bubble);
  drawStar(ctx, bannerX + bannerW - 56, bannerMidY, 16, theme.bubble);
  drawArchedText(ctx, "JOURNEY LOG", SIDE_QUEST_CARD_W / 2, bannerMidY - 8, 220, 34);
  ctx.textAlign = "center";
  ctx.fillStyle = "#1c1917";
  ctx.font = SANS_MED;
  ctx.fillText("TRADING CARDS", SIDE_QUEST_CARD_W / 2, bannerMidY + 34);

  const footerY = portrait.y + portrait.h + 56;
  ctx.textAlign = "left";
  ctx.fillStyle = theme.headerInk;
  ctx.font = SANS_FONT;
  const questLine = questText.length > 32 ? `${questText.slice(0, 29)}…` : questText;
  ctx.fillText(questLine.toUpperCase(), inner.x + 40, footerY);
  ctx.textAlign = "right";
  ctx.font = SANS_MED;
  ctx.fillStyle = "#57534e";
  ctx.fillText(
    new Date(completedAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).toUpperCase(),
    inner.x + inner.w - 40,
    footerY,
  );

  if (gladiator) {
    drawRunnerBadge(ctx, inner.x + inner.w - 78, portrait.y + portrait.h - 78, 62, gladiator, theme.frame);
  }

  const metaY = frame.y + frame.h + 36;
  ctx.textAlign = "center";
  ctx.fillStyle = "#44403c";
  ctx.font = '600 20px ui-sans-serif, system-ui, sans-serif';
  const quote =
    questText.length > 36 ? `${questText.slice(0, 33).toUpperCase()}…` : questText.toUpperCase();
  ctx.fillText(
    `NO. ${String(cardNo).padStart(2, "0")} OF 50   ·   "${quote}"   ·   +${tokens} TOKENS`,
    SIDE_QUEST_CARD_W / 2,
    metaY,
  );

  drawOfficialLogo(ctx, 56, SIDE_QUEST_CARD_H - 72, 0.75, "left");

  return canvas.toDataURL("image/png");
}

const SIMPLE_CARD_W = 540;
const SIMPLE_CARD_H = 810;

export type SimpleQuestCardOptions = {
  title: string;
  questText: string;
  tokens: number;
  photoSrc?: string | null;
  stats: SideQuestStats;
};

function drawSimpleQuestStats(
  ctx: CanvasRenderingContext2D,
  stats: SideQuestStats,
  x: number,
  y: number,
  w: number,
) {
  const labels: [string, number][] = [
    ["VIBE", stats.vibe],
    ["GRIT", stats.grit],
    ["SNACK", stats.snack],
  ];
  const gap = 10;
  const statW = (w - gap * 2) / 3;

  labels.forEach(([label, value], i) => {
    const sx = x + i * (statW + gap);
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.beginPath();
    ctx.roundRect(sx, y, statW, 58, 10);
    ctx.fill();
    ctx.strokeStyle = "rgba(129,140,248,0.45)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillStyle = "#94a3b8";
    ctx.font = '700 11px ui-sans-serif, system-ui, sans-serif';
    ctx.fillText(label, sx + statW / 2, y + 22);
    ctx.fillStyle = "#f8fafc";
    ctx.font = '900 22px ui-sans-serif, system-ui, sans-serif';
    ctx.fillText(String(value), sx + statW / 2, y + 46);
  });
}

/** Lightweight quest card export for completion / journey log sharing. */
export async function composeSimpleQuestCard(
  canvas: HTMLCanvasElement,
  { title, questText, tokens, photoSrc, stats }: SimpleQuestCardOptions,
): Promise<string> {
  canvas.width = SIMPLE_CARD_W;
  canvas.height = SIMPLE_CARD_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const bg = ctx.createLinearGradient(0, 0, 0, SIMPLE_CARD_H);
  bg.addColorStop(0, "#312e81");
  bg.addColorStop(1, "#0f0a1e");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, SIMPLE_CARD_W, SIMPLE_CARD_H);

  ctx.strokeStyle = "rgba(129,140,248,0.5)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(20, 20, SIMPLE_CARD_W - 40, SIMPLE_CARD_H - 40, 22);
  ctx.stroke();

  const titleLine = title.length > 26 ? `${title.slice(0, 23)}…` : title;
  ctx.textAlign = "center";
  ctx.fillStyle = "#f8fafc";
  ctx.font = '800 20px Georgia, "Times New Roman", serif';
  ctx.fillText(titleLine.toUpperCase(), SIMPLE_CARD_W / 2, 56);

  drawSimpleQuestStats(ctx, stats, 44, 72, SIMPLE_CARD_W - 88);

  const photoBox = { x: 44, y: 148, w: SIMPLE_CARD_W - 88, h: 268 };

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(photoBox.x, photoBox.y, photoBox.w, photoBox.h, 16);
  ctx.clip();

  if (photoSrc) {
    try {
      const img = await loadImage(photoSrc);
      const scale = Math.max(photoBox.w / img.width, photoBox.h / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.drawImage(
        img,
        photoBox.x + (photoBox.w - dw) / 2,
        photoBox.y + (photoBox.h - dh) / 2,
        dw,
        dh,
      );
    } catch {
      ctx.fillStyle = "#1e1b4b";
      ctx.fillRect(photoBox.x, photoBox.y, photoBox.w, photoBox.h);
    }
  } else {
    ctx.fillStyle = "#1e1b4b";
    ctx.fillRect(photoBox.x, photoBox.y, photoBox.w, photoBox.h);
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.beginPath();
    ctx.arc(photoBox.x + photoBox.w / 2, photoBox.y + photoBox.h / 2, 36, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(photoBox.x, photoBox.y, photoBox.w, photoBox.h, 16);
  ctx.stroke();

  const questLine = questText.length > 40 ? `${questText.slice(0, 37)}…` : questText;

  ctx.textAlign = "center";
  ctx.font = '600 15px ui-sans-serif, system-ui, sans-serif';
  ctx.fillStyle = "#94a3b8";
  ctx.fillText(questLine, SIMPLE_CARD_W / 2, photoBox.y + photoBox.h + 36);

  ctx.fillStyle = "#a5b4fc";
  ctx.font = '700 17px ui-sans-serif, system-ui, sans-serif';
  ctx.fillText(`+${tokens} TOKENS`, SIMPLE_CARD_W / 2, SIMPLE_CARD_H - 52);

  drawOfficialLogo(ctx, 44, SIMPLE_CARD_H - 44, 0.55, "left");

  return canvas.toDataURL("image/png");
}

export async function composeSideQuestCardPreview(
  canvas: HTMLCanvasElement,
  errand: ErrandEntry,
  photoSrc?: string | null,
  gladiator?: GladiatorStatus,
): Promise<void> {
  const scale = 0.24;
  const W = Math.round(SIDE_QUEST_CARD_W * scale);
  const H = Math.round(SIDE_QUEST_CARD_H * scale);
  const off = document.createElement("canvas");
  await composeSideQuestCard(off, errand, photoSrc, gladiator);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(off, 0, 0, W, H);
}
