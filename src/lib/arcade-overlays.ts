import type { GladiatorStatus } from "@/lib/gladiator-titles";
import { drawGladiatorPlaque } from "@/lib/gladiator-titles";
import { drawOfficialLogo } from "@/lib/watermark";

export const OVERLAY_SIZE = 1080;

export type OverlayId =
  | "victory-banner"
  | "crushed-it"
  | "hadouken"
  | "pixel-boom"
  | "arcade-frame"
  | "perfect-run"
  | "brand-badge"
  | "level-clear"
  | "quote-need-speed"
  | "quote-arnie-arms"
  | "quote-addicted-sweat"
  | "quote-ill-be-back"
  | "quote-leg-day"
  | "quote-stretch-streams";

export type OverlayKind = "sticker" | "quote";

export type ArcadeOverlayDef = {
  id: OverlayId;
  kind: OverlayKind;
  name: string;
  tagline: string;
  placement: string;
};

export const ARCADE_OVERLAYS: ArcadeOverlayDef[] = [
  { id: "victory-banner", kind: "sticker", name: "VICTORY", tagline: "Neon ribbon win", placement: "Top centre" },
  { id: "crushed-it", kind: "sticker", name: "CRUSHED IT", tagline: "Bold workout flex", placement: "Top centre" },
  { id: "hadouken", kind: "sticker", name: "Chi Burst", tagline: "Vector energy blast", placement: "Side or corner" },
  { id: "level-clear", kind: "sticker", name: "LEVEL CLEAR", tagline: "Stage complete glow", placement: "Centre" },
  { id: "perfect-run", kind: "sticker", name: "PERFECT RUN", tagline: "Combo streak halo", placement: "Upper third" },
  { id: "pixel-boom", kind: "sticker", name: "NEON BURST", tagline: "Radial energy pop", placement: "Anywhere" },
  { id: "arcade-frame", kind: "sticker", name: "Chrome Frame", tagline: "HUD border — clear centre", placement: "Full photo" },
  { id: "brand-badge", kind: "sticker", name: "8-Bit Runner", tagline: "Brand stamp", placement: "Bottom corner" },
  { id: "quote-need-speed", kind: "quote", name: "Need for Speed", tagline: "Top Gun cardio energy", placement: "Centre" },
  { id: "quote-arnie-arms", kind: "quote", name: "Arms Like Arnie", tagline: "Pump-day propaganda", placement: "Centre" },
  { id: "quote-addicted-sweat", kind: "quote", name: "Addicted to Sweat", tagline: "Neon aerobics fever", placement: "Lower third" },
  { id: "quote-ill-be-back", kind: "quote", name: "I'll Be Back", tagline: "Tomorrow's run queued", placement: "Centre" },
  { id: "quote-leg-day", kind: "quote", name: "Good Morning Leg Day", tagline: "Quad wake-up call", placement: "Top centre" },
  { id: "quote-stretch-streams", kind: "quote", name: "Don't Skip Stretch", tagline: "Mobility edition", placement: "Centre" },
];

function setDisplayFont(ctx: CanvasRenderingContext2D, size: number, weight = 700) {
  ctx.font = `${weight} ${size}px system-ui, -apple-system, "SF Pro Display", "Segoe UI", sans-serif`;
}

function drawNeonGlowText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  fill: string,
  glow: string,
  align: CanvasTextAlign = "center",
) {
  ctx.save();
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  setDisplayFont(ctx, size);

  ctx.shadowColor = glow;
  ctx.shadowBlur = size * 0.45;
  ctx.fillStyle = glow;
  ctx.fillText(text, x, y);

  ctx.shadowBlur = size * 0.2;
  const grad = ctx.createLinearGradient(x - size * 2, y - size, x + size * 2, y + size);
  grad.addColorStop(0, "#e2e8f0");
  grad.addColorStop(0.45, fill);
  grad.addColorStop(1, "#94a3b8");
  ctx.fillStyle = grad;
  ctx.fillText(text, x, y);

  ctx.shadowBlur = 0;
  ctx.restore();
}

function drawNeonRibbon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  text: string,
  accent: string,
  glow: string,
) {
  const w = 680;
  const h = 96;
  const x = cx - w / 2;
  const y = cy - h / 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.03);
  ctx.translate(-cx, -cy);

  const ribbon = ctx.createLinearGradient(x, y, x + w, y + h);
  ribbon.addColorStop(0, `${accent}55`);
  ribbon.addColorStop(0.5, `${glow}66`);
  ribbon.addColorStop(1, `${accent}55`);

  ctx.shadowColor = glow;
  ctx.shadowBlur = 32;
  ctx.fillStyle = "rgba(8,6,20,0.35)";
  ctx.beginPath();
  ctx.moveTo(x + 24, y);
  ctx.lineTo(x + w - 24, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + 20);
  ctx.lineTo(x + w - 12, y + h);
  ctx.lineTo(x + 12, y + h);
  ctx.lineTo(x, y + 20);
  ctx.quadraticCurveTo(x, y, x + 24, y);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = ribbon;
  ctx.beginPath();
  ctx.moveTo(x + 24, y);
  ctx.lineTo(x + w - 24, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + 20);
  ctx.lineTo(x + w - 12, y + h);
  ctx.lineTo(x + 12, y + h);
  ctx.lineTo(x, y + 20);
  ctx.quadraticCurveTo(x, y, x + 24, y);
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
  drawNeonGlowText(ctx, text, cx, cy + 4, 52, "#ffffff", glow);
}

function drawVectorFlame(ctx: CanvasRenderingContext2D, cx: number, cy: number, scale = 1) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  const layers = [
    { color: "rgba(236,72,153,0.35)", blur: 40, path: [0, 80, -120, 20, -60, -40, 0, -100, 60, -40, 120, 20] },
    { color: "rgba(34,211,238,0.4)", blur: 30, path: [0, 60, -90, 10, -45, -30, 0, -80, 45, -30, 90, 10] },
    { color: "rgba(251,191,36,0.85)", blur: 18, path: [0, 45, -65, 5, -32, -22, 0, -58, 32, -22, 65, 5] },
  ];

  for (const layer of layers) {
    ctx.shadowColor = layer.color;
    ctx.shadowBlur = layer.blur;
    ctx.fillStyle = layer.color;
    ctx.beginPath();
    const p = layer.path;
    ctx.moveTo(p[0]!, p[1]!);
    for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i]!, p[i + 1]!);
    ctx.closePath();
    ctx.fill();
  }

  ctx.shadowBlur = 0;
  drawNeonGlowText(ctx, "CHI BLAST", 0, 110, 22, "#fde047", "#22d3ee");
  ctx.restore();
}

function drawNeonBurst(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  for (let i = 0; i < 16; i++) {
    const ang = (i / 16) * Math.PI * 2;
    const len = 140 + (i % 3) * 24;
    const x2 = cx + Math.cos(ang) * len;
    const y2 = cy + Math.sin(ang) * len;
    const grad = ctx.createLinearGradient(cx, cy, x2, y2);
    grad.addColorStop(0, "rgba(251,191,36,0.9)");
    grad.addColorStop(0.5, "rgba(236,72,153,0.7)");
    grad.addColorStop(1, "transparent");
    ctx.strokeStyle = grad;
    ctx.lineWidth = i % 2 === 0 ? 4 : 2;
    ctx.shadowColor = "#ec4899";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.beginPath();
  ctx.arc(cx, cy, 18, 0, Math.PI * 2);
  ctx.fill();
  drawNeonGlowText(ctx, "BOOM", cx, cy + 100, 36, "#ffffff", "#f472b6");
}

function drawChromeFrame(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const inset = 44;
  const corners = [
    [inset, inset, 1, 1],
    [w - inset, inset, -1, 1],
    [inset, h - inset, 1, -1],
    [w - inset, h - inset, -1, -1],
  ] as const;

  ctx.strokeStyle = "rgba(34,211,238,0.65)";
  ctx.lineWidth = 3;
  ctx.shadowColor = "#22d3ee";
  ctx.shadowBlur = 16;
  ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
  ctx.shadowBlur = 0;

  for (const [x, y, sx, sy] of corners) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sx, sy);
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 56);
    ctx.lineTo(0, 0);
    ctx.lineTo(56, 0);
    ctx.stroke();
    ctx.restore();
  }

  drawNeonGlowText(ctx, "PLAYER 1", w / 2, inset - 8, 16, "#e2e8f0", "#22d3ee");
  drawNeonGlowText(ctx, "READY", w / 2, h - inset + 28, 14, "#fde047", "#ec4899");
  drawOfficialLogo(ctx, w / 2, h - 88, 0.7, "center");
}

function drawPerfectHalo(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.08);

  const ring = ctx.createRadialGradient(0, 0, 40, 0, 0, 130);
  ring.addColorStop(0, "rgba(236,72,153,0.25)");
  ring.addColorStop(1, "transparent");
  ctx.fillStyle = ring;
  ctx.beginPath();
  ctx.arc(0, 0, 130, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#fde047";
  ctx.lineWidth = 3;
  ctx.shadowColor = "#ec4899";
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(0, 0, 108, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;

  drawNeonGlowText(ctx, "PERFECT", 0, -18, 28, "#ffffff", "#22d3ee");
  drawNeonGlowText(ctx, "RUN", 0, 22, 44, "#fde047", "#ec4899");
  ctx.restore();
}

function drawLevelClearSticker(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createRadialGradient(w / 2, h * 0.38, 0, w / 2, h * 0.38, 360);
  g.addColorStop(0, "rgba(34,211,238,0.2)");
  g.addColorStop(1, "transparent");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  drawNeonRibbon(ctx, w / 2, h * 0.38, "LEVEL CLEAR", "#10b981", "#22d3ee");
  drawNeonGlowText(ctx, "BONUS UNLOCKED", w / 2, h * 0.52, 20, "#e2e8f0", "#a78bfa");
  drawOfficialLogo(ctx, w / 2, h * 0.72, 0.75, "center");
}

type QuoteStyle = {
  lines: string[];
  sub?: string;
  accent: string;
  glow: string;
};

const QUOTE_STYLES: Record<
  Extract<
    OverlayId,
    | "quote-need-speed"
    | "quote-arnie-arms"
    | "quote-addicted-sweat"
    | "quote-ill-be-back"
    | "quote-leg-day"
    | "quote-stretch-streams"
  >,
  QuoteStyle
> = {
  "quote-need-speed": {
    lines: ["I FEEL THE NEED", "FOR SPEED"],
    sub: "MILES > MACH 1",
    accent: "#38bdf8",
    glow: "#22d3ee",
  },
  "quote-arnie-arms": {
    lines: ["ARMS LIKE", "ARNIE"],
    sub: "REP IT OUT",
    accent: "#fb923c",
    glow: "#fbbf24",
  },
  "quote-addicted-sweat": {
    lines: ["ADDICTED", "TO SWEAT"],
    sub: "80S AEROBICS APPROVED",
    accent: "#ec4899",
    glow: "#f472b6",
  },
  "quote-ill-be-back": {
    lines: ["I'LL BE BACK", "TOMORROW"],
    sub: "COOLDOWN FIRST",
    accent: "#f87171",
    glow: "#ef4444",
  },
  "quote-leg-day": {
    lines: ["GOOD MORNING", "LEG DAY"],
    sub: "LOUD & PROUD",
    accent: "#a3e635",
    glow: "#84cc16",
  },
  "quote-stretch-streams": {
    lines: ["DON'T SKIP", "THE STRETCH"],
    sub: "MOBILITY OR BUST",
    accent: "#34d399",
    glow: "#10b981",
  },
};

function drawQuoteOverlay(ctx: CanvasRenderingContext2D, w: number, h: number, style: QuoteStyle) {
  const cx = w / 2;
  const cy = h * 0.42;

  const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, 320);
  halo.addColorStop(0, `${style.glow}22`);
  halo.addColorStop(0.6, `${style.accent}11`);
  halo.addColorStop(1, "transparent");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, w, h);

  const lineCount = style.lines.length;
  const startY = cy - ((lineCount - 1) * 58) / 2;
  style.lines.forEach((line, i) => {
    const size = line.length > 14 ? 46 : 56;
    drawNeonGlowText(ctx, line, cx, startY + i * 58, size, "#ffffff", style.glow);
  });

  if (style.sub) {
    ctx.textAlign = "center";
    setDisplayFont(ctx, 16, 600);
    ctx.fillStyle = style.accent;
    ctx.shadowColor = style.glow;
    ctx.shadowBlur = 10;
    ctx.fillText(style.sub, cx, startY + lineCount * 58 + 18);
    ctx.shadowBlur = 0;

    const lineW = ctx.measureText(style.sub).width + 40;
    ctx.strokeStyle = `${style.accent}88`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - lineW / 2, startY + lineCount * 58 + 32);
    ctx.lineTo(cx + lineW / 2, startY + lineCount * 58 + 32);
    ctx.stroke();
  }

  drawOfficialLogo(ctx, w / 2, h * 0.78, 0.55, "center");
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

function drawOverlayLayer(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  id: OverlayId,
  gladiator?: GladiatorStatus,
) {
  switch (id) {
    case "victory-banner":
      drawNeonRibbon(ctx, w / 2, h * 0.2, "VICTORY", "#10b981", "#22d3ee");
      drawOfficialLogo(ctx, w / 2, h * 0.82, 0.65, "center");
      break;
    case "crushed-it":
      drawNeonRibbon(ctx, w / 2, h * 0.2, "CRUSHED IT", "#f97316", "#fbbf24");
      drawNeonBurst(ctx, w * 0.22, h * 0.55);
      drawOfficialLogo(ctx, w - 180, h - 80, 0.5, "left");
      break;
    case "hadouken":
      drawVectorFlame(ctx, w / 2, h / 2, 1.1);
      drawOfficialLogo(ctx, 48, h - 72, 0.48, "left");
      break;
    case "pixel-boom":
      drawNeonBurst(ctx, w / 2, h / 2);
      drawOfficialLogo(ctx, w / 2, h - 68, 0.52, "center");
      break;
    case "arcade-frame":
      drawChromeFrame(ctx, w, h);
      break;
    case "perfect-run":
      drawPerfectHalo(ctx, w / 2, h / 2);
      drawOfficialLogo(ctx, w / 2, h - 76, 0.52, "center");
      break;
    case "level-clear":
      drawLevelClearSticker(ctx, w, h);
      break;
    case "brand-badge":
      drawOfficialLogo(ctx, w / 2, h / 2, 1.15, "center");
      drawNeonGlowText(ctx, "VERIFIED", w / 2, h / 2 + 88, 18, "#10b981", "#22d3ee");
      break;
    case "quote-need-speed":
    case "quote-arnie-arms":
    case "quote-addicted-sweat":
    case "quote-ill-be-back":
    case "quote-leg-day":
    case "quote-stretch-streams":
      drawQuoteOverlay(ctx, w, h, QUOTE_STYLES[id]);
      break;
  }

  if (gladiator && w >= 240) {
    drawGladiatorPlaque(ctx, w - 20, h - 20, gladiator, {
      align: "right",
      compact: true,
      width: 280,
    });
  } else if (gladiator && id === "arcade-frame" && w >= 240) {
    drawGladiatorPlaque(ctx, w / 2, h - 120, gladiator, { width: 460 });
  }
}

/** Render overlay (transparent) or composite with optional photo underneath. */
export async function renderArcadeOverlay(
  canvas: HTMLCanvasElement,
  id: OverlayId,
  gladiator?: GladiatorStatus,
  photoSrc?: string | null,
): Promise<string> {
  const w = OVERLAY_SIZE;
  const h = OVERLAY_SIZE;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.clearRect(0, 0, w, h);

  if (photoSrc) {
    try {
      const photo = await loadImage(photoSrc);
      const scale = Math.max(w / photo.width, h / photo.height);
      ctx.drawImage(
        photo,
        (w - photo.width * scale) / 2,
        (h - photo.height * scale) / 2,
        photo.width * scale,
        photo.height * scale,
      );
      ctx.fillStyle = "rgba(6,4,18,0.28)";
      ctx.fillRect(0, 0, w, h);
    } catch {
      /* photo optional */
    }
  }

  drawOverlayLayer(ctx, w, h, id, gladiator);
  return canvas.toDataURL("image/png");
}

export function renderArcadeOverlaySync(
  canvas: HTMLCanvasElement,
  id: OverlayId,
  gladiator?: GladiatorStatus,
): string {
  const w = OVERLAY_SIZE;
  const h = OVERLAY_SIZE;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.clearRect(0, 0, w, h);
  drawOverlayLayer(ctx, w, h, id, gladiator);
  return canvas.toDataURL("image/png");
}

export function getOverlayDef(id: OverlayId): ArcadeOverlayDef {
  return ARCADE_OVERLAYS.find((o) => o.id === id) ?? ARCADE_OVERLAYS[0]!;
}

export function getOverlaysByKind(kind: OverlayKind | "all"): ArcadeOverlayDef[] {
  if (kind === "all") return ARCADE_OVERLAYS;
  return ARCADE_OVERLAYS.filter((o) => o.kind === kind);
}

export const FREE_OVERLAY_IDS: OverlayId[] = [
  "victory-banner",
  "crushed-it",
  "hadouken",
  "quote-need-speed",
  "quote-ill-be-back",
  "quote-leg-day",
];
