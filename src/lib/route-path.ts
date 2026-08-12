import type { RunEntry } from "@/lib/game-state";

function seedFrom(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 100000;
  return h || 7;
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

/** Deterministic route polyline for a run, normalised to a W x H box. */
export function routePoints(run: RunEntry, W: number, H: number): [number, number][] {
  const rnd = seededRandom(seedFrom(run.title + run.date));
  const points: [number, number][] = [];
  let x = W * 0.15 + rnd() * W * 0.15;
  let y = H - H * 0.2;
  let angle = -Math.PI / 3;
  for (let i = 0; i < 26; i++) {
    angle += (rnd() - 0.5) * 1.5;
    x = Math.max(W * 0.05, Math.min(W * 0.95, x + Math.cos(angle) * (W / 18.75)));
    y = Math.max(H * 0.1, Math.min(H * 0.9, y + Math.sin(angle) * (H / 10.7)));
    points.push([x, y]);
  }
  return points;
}

/** Cumulative lengths for progressive "pen stroke" drawing. */
export function pathLengths(points: [number, number][]) {
  const seg: number[] = [];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i]![0] - points[i - 1]![0];
    const dy = points[i]![1] - points[i - 1]![1];
    total += Math.hypot(dx, dy);
    seg.push(total);
  }
  return { seg, total };
}

/** Trace the polyline up to `progress` (0..1) and return the pen head position. */
export function tracePath(
  ctx: CanvasRenderingContext2D,
  points: [number, number][],
  progress: number,
): [number, number] {
  const { seg, total } = pathLengths(points);
  const target = Math.max(0, Math.min(1, progress)) * total;
  ctx.beginPath();
  ctx.moveTo(points[0]![0], points[0]![1]);
  let head: [number, number] = [points[0]![0], points[0]![1]];
  for (let i = 1; i < points.length; i++) {
    const prevLen = i === 1 ? 0 : seg[i - 2]!;
    const len = seg[i - 1]!;
    if (target >= len) {
      ctx.lineTo(points[i]![0], points[i]![1]);
      head = [points[i]![0], points[i]![1]];
    } else {
      const t = (target - prevLen) / Math.max(1e-6, len - prevLen);
      const x = points[i - 1]![0] + (points[i]![0] - points[i - 1]![0]) * t;
      const y = points[i - 1]![1] + (points[i]![1] - points[i - 1]![1]) * t;
      ctx.lineTo(x, y);
      head = [x, y];
      break;
    }
  }
  return head;
}
