import { useEffect, useMemo, useState } from "react";
import { todayKey } from "@/lib/game-state";

export type HealthMetrics = {
  steps: number;
  sleepHours: number;
  recoveryScore: number;
};

export type HealthPercents = {
  steps: number;
  sleep: number;
  recovery: number;
};

export const HEALTH_GOALS = {
  steps: 10_000,
  sleepHours: 8,
  recoveryScore: 100,
} as const;

const HEALTH_STORAGE_KEY = "eight-bit-runner-health-v1";

export const DEFAULT_METRICS: HealthMetrics = {
  steps: 7_240,
  sleepHours: 7.1,
  recoveryScore: 74,
};

function hashDate(dateKey: string): number {
  let h = 0;
  for (let i = 0; i < dateKey.length; i++) {
    h = (h * 31 + dateKey.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Deterministic daily snapshot — stands in for passive Apple Health sync. */
function generateDailyMetrics(dateKey: string): HealthMetrics {
  const h = hashDate(dateKey);
  return {
    steps: 5_200 + (h % 5_800),
    sleepHours: Number((5.8 + (h % 26) / 10).toFixed(1)),
    recoveryScore: 45 + (h % 50),
  };
}

export function loadLocalHealthMetrics(): HealthMetrics {
  const today = todayKey();
  try {
    const raw = window.localStorage.getItem(HEALTH_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { date: string; metrics: HealthMetrics };
      if (parsed.date === today && parsed.metrics) return parsed.metrics;
    }
  } catch {
    /* ignore corrupted cache */
  }

  const metrics = generateDailyMetrics(today);
  try {
    window.localStorage.setItem(HEALTH_STORAGE_KEY, JSON.stringify({ date: today, metrics }));
  } catch {
    /* storage unavailable */
  }
  return metrics;
}

export function metricPercent(value: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.min(100, Math.round((value / goal) * 100));
}

export function computeHealthPercents(metrics: HealthMetrics): HealthPercents {
  return {
    steps: metricPercent(metrics.steps, HEALTH_GOALS.steps),
    sleep: metricPercent(metrics.sleepHours, HEALTH_GOALS.sleepHours),
    recovery: metricPercent(metrics.recoveryScore, HEALTH_GOALS.recoveryScore),
  };
}

/** Life Force is the average of Steps, Sleep, and Recovery progress (0–100%). */
export function lifeForceFromHealth(metrics: HealthMetrics): number {
  const p = computeHealthPercents(metrics);
  return Math.round((p.steps + p.sleep + p.recovery) / 3);
}

export function formatMetricValue(id: keyof HealthPercents, metrics: HealthMetrics): string {
  switch (id) {
    case "steps":
      return metrics.steps >= 1000
        ? `${(metrics.steps / 1000).toFixed(1)}k`
        : String(metrics.steps);
    case "sleep":
      return `${metrics.sleepHours}h`;
    case "recovery":
      return `${metrics.recoveryScore}`;
  }
}

export function useHealthMetrics() {
  const [metrics, setMetrics] = useState<HealthMetrics>(DEFAULT_METRICS);

  useEffect(() => {
    setMetrics(loadLocalHealthMetrics());
  }, []);

  const percents = useMemo(() => computeHealthPercents(metrics), [metrics]);
  const lifeForce = useMemo(() => lifeForceFromHealth(metrics), [metrics]);

  return { metrics, percents, lifeForce };
}
