/**
 * Pac-Man style maze route renderer for the Hero Video Studio.
 * The run's GPS route is abstracted into a snaking maze path that the
 * pixel muncher eats its way around while ghosts chase.
 */

export const CELL = 28;
export const COLS = 9;
export const ROWS = 16;

/** Snaking route through the maze grid, one cell per step. */
export function buildRoute(): [number, number][] {
  const route: [number, number][] = [];
  for (let row = 1; row < ROWS - 1; row += 2) {
    const leftToRight = ((row - 1) / 2) % 2 === 0;
    for (let i = 1; i < COLS - 1; i++) {
      const col = leftToRight ? i : COLS - 1 - i;
      route.push([col, row]);
    }
    if (row + 2 < ROWS - 1) {
      const col = leftToRight ? COLS - 2 : 1;
      route.push([col, row + 1]);
    }
  }
  return route;
}

const ROUTE = buildRoute();
export const ROUTE_LENGTH = ROUTE.length;

const GHOST_COLORS = ["#f43f5e", "#38bdf8", "#fb923c"];

export function drawMaze(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  progress: number,
) {
  ctx.fillStyle = "#05060f";
  ctx.fillRect(0, 0, w, h);

  const ox = (w - COLS * CELL) / 2;
  const oy = (h - ROWS * CELL) / 2 + 24;

  // maze walls: outer border + block pillars between route lanes
  ctx.strokeStyle = "#1d4ed8";
  ctx.lineWidth = 3;
  ctx.strokeRect(ox + 4.5, oy + 4.5, COLS * CELL - 9, ROWS * CELL - 9);

  ctx.fillStyle = "#1e3a8a";
  for (let row = 2; row < ROWS - 1; row += 2) {
    for (let col = 1; col < COLS - 1; col += 2) {
      ctx.fillRect(ox + col * CELL + 5, oy + row * CELL + 8, CELL - 10, CELL - 16);
    }
  }

  const eaten = Math.floor(progress * ROUTE_LENGTH);

  // pellets
  ROUTE.forEach(([col, row], i) => {
    const cx = ox + col * CELL + CELL / 2;
    const cy = oy + row * CELL + CELL / 2;
    if (i < eaten) return;
    const big = i % 9 === 0;
    ctx.fillStyle = big ? "#fbbf24" : "#e2e8f0";
    const s = big ? 6 : 3;
    ctx.fillRect(Math.floor(cx - s / 2), Math.floor(cy - s / 2), s, s);
  });

  // muncher
  const idx = Math.min(ROUTE_LENGTH - 1, eaten);
  const cur = ROUTE[idx]!;
  const next = ROUTE[Math.min(ROUTE_LENGTH - 1, idx + 1)]!;
  const frac = progress * ROUTE_LENGTH - eaten;
  const px = ox + (cur[0] + (next[0] - cur[0]) * frac) * CELL + CELL / 2;
  const py = oy + (cur[1] + (next[1] - cur[1]) * frac) * CELL + CELL / 2;
  const mouth = (Math.floor(t / 6) % 2 === 0 ? 0.28 : 0.06) * Math.PI;
  const dir = Math.atan2(next[1] - cur[1], next[0] - cur[0]);
  ctx.fillStyle = "#fde047";
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.arc(px, py, 11, dir + mouth, dir - mouth + Math.PI * 2);
  ctx.closePath();
  ctx.fill();

  // ghosts trailing behind
  GHOST_COLORS.forEach((color, i) => {
    const gi = Math.max(0, idx - 6 - i * 5);
    const g = ROUTE[gi]!;
    const gx = ox + g[0] * CELL + CELL / 2;
    const gy = oy + g[1] * CELL + CELL / 2 + (Math.floor(t / 8) % 2 === 0 ? 0 : 1);
    ctx.fillStyle = color;
    ctx.fillRect(gx - 9, gy - 11, 18, 16);
    ctx.fillRect(gx - 9, gy + 5, 4, 4);
    ctx.fillRect(gx - 2, gy + 5, 4, 4);
    ctx.fillRect(gx + 5, gy + 5, 4, 4);
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(gx - 6, gy - 6, 5, 5);
    ctx.fillRect(gx + 1, gy - 6, 5, 5);
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(gx - 5, gy - 5, 2, 3);
    ctx.fillRect(gx + 2, gy - 5, 2, 3);
  });
}
