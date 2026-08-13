import { drawChromeTitle } from "@/lib/synthwave-overlay";

export type GladiatorStatus = {
  level: number;
  title: string;
  xp: number;
  xpIntoLevel: number;
  xpToNextLevel: number;
  progress: number;
  isMaxLevel: boolean;
};

type ActivityInput = {
  runs: { miles: number }[];
  errands: { completed: boolean; tokens: number }[];
};

const TITLES_BY_LEVEL: Record<number, string> = {
  1: "Rookie",
  2: "Pacer",
  3: "Jogger",
  4: "Strider",
  5: "Road Runner",
  6: "Mile Crusher",
  7: "Trail Blazer",
  8: "Night Hawk",
  9: "Nighthawk",
  10: "Legend",
};

const XP_PER_LEVEL = 500;

export function titleForLevel(level: number): string {
  return TITLES_BY_LEVEL[level] ?? TITLES_BY_LEVEL[10]!;
}

export function computeActivityXp(input: ActivityInput): number {
  const runXp = input.runs.reduce((sum, r) => sum + Math.round(r.miles * 100), 0);
  const errandXp = input.errands
    .filter((e) => e.completed)
    .reduce((sum, e) => sum + e.tokens * 10, 0);
  return runXp + errandXp;
}

export function getGladiatorStatus(xp: number): GladiatorStatus {
  const level = Math.min(10, Math.floor(xp / XP_PER_LEVEL) + 1);
  const xpIntoLevel = xp % XP_PER_LEVEL;
  const xpToNextLevel = level >= 10 ? XP_PER_LEVEL : XP_PER_LEVEL;
  const progress = level >= 10 ? 1 : xpIntoLevel / XP_PER_LEVEL;
  return {
    level,
    title: titleForLevel(level),
    xp,
    xpIntoLevel,
    xpToNextLevel,
    progress,
    isMaxLevel: level >= 10,
  };
}

export function getGladiatorStatusFromActivity(input: ActivityInput): GladiatorStatus {
  return getGladiatorStatus(computeActivityXp(input));
}

export type GladiatorPlaqueOptions = {
  align?: "left" | "center" | "right";
  compact?: boolean;
  width?: number;
};

/** Vector runner-level plaque for exports and overlays. */
export function drawGladiatorPlaque(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  status: GladiatorStatus,
  options: GladiatorPlaqueOptions = {},
) {
  const { align = "center", compact = false, width: widthOpt } = options;
  const w = widthOpt ?? (compact ? 280 : 420);
  const h = compact ? 36 : 52;
  const left = align === "center" ? x - w / 2 : align === "right" ? x - w : x;

  ctx.fillStyle = "rgba(5,6,15,0.82)";
  ctx.beginPath();
  ctx.roundRect(left, y, w, h, compact ? 10 : 12);
  ctx.fill();
  ctx.strokeStyle = "rgba(34,211,238,0.45)";
  ctx.lineWidth = compact ? 1.5 : 2;
  ctx.stroke();

  const textX =
    align === "center" ? x : align === "right" ? left + w - 14 : left + 14;

  ctx.textAlign = align === "center" ? "center" : align === "right" ? "right" : "left";
  ctx.font = `600 ${compact ? 10 : 11}px system-ui, sans-serif`;
  ctx.fillStyle = "rgba(148,163,184,0.95)";
  ctx.fillText(`RUNNER LV ${status.level}`, textX, y + (compact ? 14 : 18));

  const title = status.title.length > (compact ? 14 : 18)
    ? `${status.title.slice(0, compact ? 12 : 16)}…`
    : status.title;
  drawChromeTitle(ctx, title.toUpperCase(), textX, y + (compact ? 28 : 40), compact ? 11 : 14, align);
  ctx.textAlign = "left";
}
