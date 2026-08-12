export type City = {
  id: string;
  name: string;
  country: string;
  /** Season mileage that unlocks the city for free. */
  milesRequired: number;
  /** Arcade Tokens to unlock it early. */
  tokens: number;
  landmark: string;
  accent: string;
};

export const CITIES: City[] = [
  { id: "london", name: "London", country: "UK", milesRequired: 0, tokens: 0, landmark: "Big Ben", accent: "#10b981" },
  { id: "berlin", name: "Berlin", country: "Germany", milesRequired: 30, tokens: 150, landmark: "Brandenburg Gate", accent: "#fbbf24" },
  { id: "tokyo", name: "Tokyo", country: "Japan", milesRequired: 60, tokens: 250, landmark: "Tokyo Tower", accent: "#f43f5e" },
  { id: "newyork", name: "New York", country: "USA", milesRequired: 100, tokens: 350, landmark: "Empire State", accent: "#6366f1" },
  { id: "chicago", name: "Chicago", country: "USA", milesRequired: 150, tokens: 450, landmark: "Willis Tower", accent: "#38bdf8" },
  { id: "boston", name: "Boston", country: "USA", milesRequired: 220, tokens: 600, landmark: "Bunker Hill", accent: "#f97316" },
];

export function getCity(id: string) {
  return CITIES.find((c) => c.id === id) ?? CITIES[0]!;
}

/** City level = its position in the marathon-major ladder. */
export function cityLevel(id: string) {
  const i = CITIES.findIndex((c) => c.id === id);
  return (i < 0 ? 0 : i) + 1;
}

/**
 * Pixel landmark silhouette for the Home viewport, drawn behind the runner.
 * Deterministic: no animation, no flashing.
 */
export function drawLandmark(
  ctx: CanvasRenderingContext2D,
  cityId: string,
  cx: number,
  groundY: number,
) {
  const px = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(cx + x), Math.round(groundY + y), w, h);
  };
  const stone = "#3b2f6b";
  const lit = "#f6c177";

  switch (cityId) {
    case "berlin": {
      px(-30, -46, 60, 6, stone);
      for (let i = 0; i < 6; i++) px(-26 + i * 10, -40, 5, 40, stone);
      px(-30, -52, 60, 6, stone);
      px(-8, -62, 16, 10, stone);
      px(-4, -58, 3, 3, lit);
      break;
    }
    case "tokyo": {
      px(-3, -78, 6, 78, "#c2410c");
      for (let i = 0; i < 7; i++) {
        const w = 8 + i * 5;
        px(-w / 2, -70 + i * 10, w, 3, "#f97316");
      }
      px(-16, -18, 32, 18, "#7c2d12");
      px(-1, -86, 2, 8, lit);
      break;
    }
    case "newyork": {
      px(-18, -58, 36, 58, stone);
      px(-12, -74, 24, 16, stone);
      px(-6, -86, 12, 12, stone);
      px(-1, -98, 2, 12, "#94a3b8");
      for (let y = -54; y < -6; y += 8) for (let x = -14; x < 14; x += 6) px(x, y, 2, 3, lit);
      break;
    }
    case "chicago": {
      px(-20, -60, 12, 60, stone);
      px(-7, -78, 12, 78, stone);
      px(6, -52, 12, 52, stone);
      px(-4, -92, 2, 14, "#94a3b8");
      px(1, -92, 2, 14, "#94a3b8");
      for (let y = -74; y < -6; y += 8) for (let x = -18; x < 16; x += 6) px(x, y, 2, 3, lit);
      break;
    }
    case "boston": {
      px(-22, -14, 44, 14, stone);
      px(-6, -72, 12, 58, stone);
      px(-3, -82, 6, 10, stone);
      px(-1, -88, 2, 6, lit);
      for (let y = -66; y < -20; y += 10) px(-2, y, 3, 4, lit);
      break;
    }
    default: {
      // London — Big Ben
      px(-9, -66, 18, 66, stone);
      px(-11, -78, 22, 12, stone);
      px(-6, -76, 12, 9, "#fde68a");
      px(-1, -74, 1, 5, "#1f2937");
      px(-1, -71, 4, 1, "#1f2937");
      px(-7, -88, 14, 10, stone);
      px(-2, -96, 4, 8, stone);
      for (let y = -60; y < -8; y += 10) px(-5, y, 3, 4, lit);
      break;
    }
  }
}
