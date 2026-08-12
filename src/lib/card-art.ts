/** Shared canvas helpers for the RPG trading card composition. */

/** Downscale then upscale an image so it reads as true nearest-neighbour pixel art. */
export function pixelateInto(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  sw: number,
  sh: number,
  x: number,
  y: number,
  w: number,
  h: number,
  blocks = 150,
) {
  const small = document.createElement("canvas");
  const ratio = sh / sw;
  small.width = blocks;
  small.height = Math.max(1, Math.round(blocks * ratio));
  const sctx = small.getContext("2d");
  if (!sctx) return;
  sctx.imageSmoothingEnabled = false;
  sctx.drawImage(img, 0, 0, small.width, small.height);

  // cover-fit the pixelated source into the destination box
  const scale = Math.max(w / small.width, h / small.height);
  const dw = small.width * scale;
  const dh = small.height * scale;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(small, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.restore();
}

/** Deterministic pseudo-QR badge derived from a seed string. */
export function drawQrBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  seed: string,
) {
  const cells = 13;
  const cell = size / cells;
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const rand = () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 1000) / 1000;
  };

  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(x - cell, y - cell, size + cell * 2, size + cell * 2);
  ctx.fillStyle = "#05060f";
  const finder = (fx: number, fy: number) => {
    ctx.fillRect(x + fx * cell, y + fy * cell, cell * 4, cell * 4);
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(x + (fx + 1) * cell, y + (fy + 1) * cell, cell * 2, cell * 2);
    ctx.fillStyle = "#05060f";
    ctx.fillRect(x + (fx + 1.5) * cell, y + (fy + 1.5) * cell, cell, cell);
  };
  for (let cx = 0; cx < cells; cx++) {
    for (let cy = 0; cy < cells; cy++) {
      const inFinder =
        (cx < 5 && cy < 5) || (cx > cells - 6 && cy < 5) || (cx < 5 && cy > cells - 6);
      if (inFinder) continue;
      if (rand() > 0.5) ctx.fillRect(x + cx * cell, y + cy * cell, cell, cell);
    }
  }
  finder(0, 0);
  finder(cells - 4, 0);
  finder(0, cells - 4);
}

/** Rotated "verified" wax stamp. */
export function drawStamp(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  top: string,
  bottom: string,
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((-12 * Math.PI) / 180);
  ctx.strokeStyle = "#10b981";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r - 12, 0, Math.PI * 2);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.fillStyle = "#10b981";
  ctx.font = "700 22px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText(top, 0, -8);
  ctx.font = "500 16px ui-monospace, Menlo, monospace";
  ctx.fillText(bottom, 0, 22);
  ctx.restore();
}