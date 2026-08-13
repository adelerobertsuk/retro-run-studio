export type CardBorderId =
  | "border-classic"
  | "border-gold-foil"
  | "border-neon-grid"
  | "border-holo";

export const CARD_BORDERS: { id: CardBorderId; name: string }[] = [
  { id: "border-classic", name: "Classic Emerald" },
  { id: "border-gold-foil", name: "Gold Foil" },
  { id: "border-neon-grid", name: "Neon Grid" },
  { id: "border-holo", name: "Holo Prism" },
];

export function drawTradingCardBorder(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  borderId: CardBorderId,
  tick = 0,
) {
  const pad = 24;
  const innerPad = 36;

  switch (borderId) {
    case "border-gold-foil": {
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.roundRect(pad, pad, w - pad * 2, h - pad * 2, 36);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,215,120,0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(innerPad, innerPad, w - innerPad * 2, h - innerPad * 2, 28);
      ctx.stroke();
      break;
    }
    case "border-neon-grid": {
      ctx.strokeStyle = "#22d3ee";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(pad, pad, w - pad * 2, h - pad * 2, 20);
      ctx.stroke();
      ctx.strokeStyle = "#ec4899";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.roundRect(innerPad, innerPad, w - innerPad * 2, h - innerPad * 2, 16);
      ctx.stroke();
      ctx.setLineDash([]);
      break;
    }
    case "border-holo": {
      const g = ctx.createLinearGradient(0, 0, w, h);
      const shift = (tick % 120) / 120;
      g.addColorStop(0, `hsl(${280 + shift * 60}, 80%, 65%)`);
      g.addColorStop(0.5, `hsl(${180 + shift * 40}, 75%, 60%)`);
      g.addColorStop(1, `hsl(${320 + shift * 50}, 85%, 68%)`);
      ctx.strokeStyle = g;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.roundRect(pad, pad, w - pad * 2, h - pad * 2, 32);
      ctx.stroke();
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(innerPad, innerPad, w - innerPad * 2, h - innerPad * 2, 24);
      ctx.stroke();
      break;
    }
    default: {
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.roundRect(pad, pad, w - pad * 2, h - pad * 2, 36);
      ctx.stroke();
      ctx.strokeStyle = "rgba(16,185,129,0.65)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(innerPad, innerPad, w - innerPad * 2, h - innerPad * 2, 28);
      ctx.stroke();
    }
  }
}
