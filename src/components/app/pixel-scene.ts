/**
 * Tiny deterministic 8-bit scene renderer used by the Home hero and the
 * Media Lab video studio. Everything is drawn at a low internal resolution
 * and scaled up with image-smoothing disabled to get crisp pixel art.
 */

export type Palette = {
  skinTone: string;
  hair: string;
  shirt: string;
  shorts: string;
  shoes: string;
};

export const DEFAULT_PALETTE: Palette = {
  skinTone: "#e8c4a8",
  hair: "#5c5c5c",
  shirt: "#64748b",
  shorts: "#334155",
  shoes: "#f1f5f9",
};

function rand(seed: number) {
  const x = Math.sin(seed * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

export function drawSky(ctx: CanvasRenderingContext2D, w: number, h: number, night: boolean) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  if (night) {
    grad.addColorStop(0, "#1b1146");
    grad.addColorStop(0.55, "#2c1b5a");
    grad.addColorStop(1, "#4c2a63");
  } else {
    grad.addColorStop(0, "#2a1b57");
    grad.addColorStop(0.6, "#7b3fa0");
    grad.addColorStop(1, "#f0836a");
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // stars
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  for (let i = 0; i < 40; i++) {
    const x = Math.floor(rand(i + 1) * w);
    const y = Math.floor(rand(i + 99) * h * 0.45);
    ctx.fillRect(x, y, 1, 1);
  }

  // sun / moon
  ctx.fillStyle = night ? "#e2e8f0" : "#fbbf24";
  const cx = Math.floor(w * 0.74);
  const cy = Math.floor(h * 0.28);
  const r = Math.floor(Math.min(w, h) * 0.09);
  for (let y = -r; y <= r; y++) {
    const span = Math.floor(Math.sqrt(r * r - y * y));
    ctx.fillRect(cx - span, cy + y, span * 2, 1);
  }
}

function buildings(seed: number, w: number, count: number) {
  const out: { x: number; width: number; height: number }[] = [];
  let x = 0;
  let i = 0;
  while (x < w + 40) {
    const width = 12 + Math.floor(rand(seed + i) * 18);
    const height = 20 + Math.floor(rand(seed + i + 500) * 55);
    out.push({ x, width, height });
    x += width + 3;
    i++;
    if (i > count) break;
  }
  return out;
}

export function drawSkyline(
  ctx: CanvasRenderingContext2D,
  w: number,
  groundY: number,
  offset: number,
  layer: 0 | 1,
) {
  const color = layer === 0 ? "#241a45" : "#33235c";
  const windowColor = layer === 0 ? "#4c3a86" : "#f6c177";
  const scale = layer === 0 ? 1.1 : 0.75;
  const shift = -((offset * (layer === 0 ? 0.35 : 0.7)) % (w + 40));
  const set = buildings(layer * 31 + 7, w * 2, 90);
  for (const b of set) {
    const height = Math.floor(b.height * scale);
    const x = Math.floor(b.x + shift);
    ctx.fillStyle = color;
    ctx.fillRect(x, groundY - height, b.width, height);
    ctx.fillStyle = windowColor;
    for (let wy = groundY - height + 4; wy < groundY - 4; wy += 6) {
      for (let wx = x + 3; wx < x + b.width - 3; wx += 5) {
        if (rand(wx * 3 + wy) > 0.55) ctx.fillRect(wx, wy, 2, 2);
      }
    }
  }
}

export function drawGround(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  groundY: number,
  offset: number,
) {
  ctx.fillStyle = "#141029";
  ctx.fillRect(0, groundY, w, h - groundY);
  ctx.fillStyle = "#10b981";
  ctx.fillRect(0, groundY, w, 1);
  ctx.fillStyle = "#2a2350";
  for (let x = -((offset * 1.6) % 16); x < w; x += 16) {
    ctx.fillRect(Math.floor(x), groundY + 6, 8, 2);
  }
}

/** 8-bit runner, 12x16 px logical sprite, drawn at pixel size `px`. */
export function drawRunner(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseY: number,
  px: number,
  frame: number,
  palette: Palette,
) {
  const p = (cx: number, cy: number, color: string, cw = 1, ch = 1) => {
    ctx.fillStyle = color;
    ctx.fillRect(x + cx * px, baseY - (16 - cy) * px, cw * px, ch * px);
  };
  const bob = frame % 2 === 0 ? 0 : 1;
  const { skinTone, hair, shirt, shorts, shoes } = palette;

  // head
  p(4, 1 + bob, hair, 4, 1);
  p(4, 2 + bob, hair, 1, 2);
  p(5, 2 + bob, skinTone, 3, 2);
  p(7, 3 + bob, "#0f172a");
  // torso
  p(4, 4 + bob, shirt, 4, 4);
  p(3, 5 + bob, skinTone, 1, 1);
  p(8, 4 + bob, skinTone, 1, 1);
  // arms swing
  if (frame % 4 < 2) {
    p(2, 6 + bob, skinTone, 1, 2);
    p(9, 4 + bob, skinTone, 1, 2);
  } else {
    p(2, 4 + bob, skinTone, 1, 2);
    p(9, 6 + bob, skinTone, 1, 2);
  }
  // shorts
  p(4, 8 + bob, shorts, 4, 2);
  // legs
  if (frame % 4 < 2) {
    p(3, 10 + bob, skinTone, 1, 3);
    p(7, 10 + bob, skinTone, 1, 2);
    p(8, 12 + bob, skinTone, 1, 1);
    p(2, 13 + bob, shoes, 2, 1);
    p(8, 13 + bob, shoes, 2, 1);
  } else {
    p(4, 10 + bob, skinTone, 1, 2);
    p(3, 12 + bob, skinTone, 1, 1);
    p(7, 10 + bob, skinTone, 1, 3);
    p(3, 13 + bob, shoes, 2, 1);
    p(7, 13 + bob, shoes, 2, 1);
  }
}

/** Blocky pixel boss for the beat-'em-up sequence. */
export function drawBoss(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseY: number,
  px: number,
  frame: number,
) {
  const p = (cx: number, cy: number, color: string, cw = 1, ch = 1) => {
    ctx.fillStyle = color;
    ctx.fillRect(x + cx * px, baseY - (20 - cy) * px, cw * px, ch * px);
  };
  const pulse = frame % 6 < 3 ? "#f43f5e" : "#fb7185";
  p(3, 0, "#1e1b4b", 8, 3);
  p(2, 3, "#312e81", 10, 8);
  p(4, 5, pulse, 2, 2);
  p(8, 5, pulse, 2, 2);
  p(5, 9, "#0f172a", 4, 1);
  p(0, 5, "#312e81", 2, 6);
  p(12, 5, "#312e81", 2, 6);
  p(3, 11, "#1e1b4b", 3, 8);
  p(8, 11, "#1e1b4b", 3, 8);
  p(2, 19, "#0f172a", 4, 1);
  p(8, 19, "#0f172a", 4, 1);
}

export function drawFireworks(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
) {
  const colors = ["#10b981", "#6366f1", "#fbbf24", "#f43f5e"];
  for (let i = 0; i < 5; i++) {
    const cx = Math.floor(rand(i + 3) * w);
    const cy = Math.floor(h * 0.15 + rand(i + 21) * h * 0.4);
    const phase = (t / 12 + i * 0.7) % 1;
    const radius = Math.floor(phase * 26) + 2;
    ctx.fillStyle = colors[i % colors.length]!;
    for (let a = 0; a < 12; a++) {
      const ang = (a / 12) * Math.PI * 2;
      const px = Math.floor(cx + Math.cos(ang) * radius);
      const py = Math.floor(cy + Math.sin(ang) * radius);
      ctx.globalAlpha = 1 - phase;
      ctx.fillRect(px, py, 2, 2);
    }
    ctx.globalAlpha = 1;
  }
}
