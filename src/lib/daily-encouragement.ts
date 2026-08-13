import { todayKey } from "@/lib/game-state";

export type EncouragementContext = {
  lifeForce: number;
  streak: number;
  tokens: number;
  errandsToday: number;
  homeCity?: string;
  now?: Date;
};

function hashDay(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function timeOfDayVibe(hour: number): string {
  if (hour < 6) return "The city's quiet — a gentle pace still counts.";
  if (hour < 12) return "Morning light's on your side. One small win at a time.";
  if (hour < 17) return "Afternoon check-in: you're doing better than you think.";
  if (hour < 21) return "Wind down kindly — recovery is part of the quest.";
  return "Late session? Rest is a power-up too.";
}

function weatherMood(homeCity: string, dayKey: string): string {
  const moods = [
    "Skies look clear — a good day for a micro-adventure.",
    "Soft weather today — perfect for an easy stroll.",
    "A little grey outside — cozy miles still sparkle.",
    "Fresh air energy — your body will thank you for moving.",
  ];
  return moods[hashDay(`${dayKey}-${homeCity}`) % moods.length]!;
}

/** Warm, supportive copy that shifts with time, stats, and a light weather mood. */
export function getDailyEncouragement(ctx: EncouragementContext): string {
  const now = ctx.now ?? new Date();
  const hour = now.getHours();
  const dayKey = todayKey(now);

  if (ctx.lifeForce >= 85) {
    return "Life Force is glowing — ride that calm confidence today.";
  }
  if (ctx.lifeForce < 40) {
    return "Low battery days happen. A short walk or stretch is enough.";
  }
  if (ctx.streak >= 7) {
    return `${ctx.streak}-day streak — steady beats perfect. Proud of you.`;
  }
  if (ctx.errandsToday > 0) {
    return "You logged a micro-adventure today. Small steps add up.";
  }
  if (ctx.streak === 0 && hour < 11) {
    return timeOfDayVibe(hour);
  }
  if (ctx.homeCity) {
    const weather = weatherMood(ctx.homeCity, dayKey);
    if (hashDay(dayKey) % 3 === 0) return weather;
  }
  if (ctx.tokens >= 300) {
    return "Your coin pouch is healthy — treat yourself to something fun in the Arcade.";
  }

  const general = [
    "No pressure — show up how you can, when you can.",
    "You're allowed to have a soft day and still make progress.",
    "Hydrate, breathe, move a little. That's a win.",
    timeOfDayVibe(hour),
  ];
  return general[hashDay(dayKey) % general.length]!;
}
