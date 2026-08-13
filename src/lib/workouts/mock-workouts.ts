import type { RunEntry } from "@/lib/workouts/types";

function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

/**
 * Deterministic mock workout history for local development and offline fallback.
 * Same seed logic as the original game-state helper — stable across reloads per day.
 */
export function generateMockWorkouts(now = new Date()): RunEntry[] {
  const titles = [
    "Downtown Dash",
    "Riverside Sprint",
    "Hawkins Loop",
    "Sunrise Tempo",
    "Neon Mile Repeats",
    "Recovery Shuffle",
    "Coffee Run",
    "Park Loop",
  ];
  const out: RunEntry[] = [];
  const offsets = [0, 1, 2, 4, 5, 7, 8, 9, 11, 13, 14, 16, 18, 19, 21, 24, 26];
  offsets.forEach((offset, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - offset);
    out.push({
      date: todayKey(d),
      miles: Number((1.6 + ((i * 7) % 9) * 0.22).toFixed(2)),
      paceSeconds: 420 + ((i * 13) % 90),
      topSpeed: Number((9.2 + ((i * 5) % 7) * 0.35).toFixed(1)),
      title: titles[i % titles.length]!,
    });
  });
  return out.sort((a, b) => (a.date < b.date ? 1 : -1));
}
