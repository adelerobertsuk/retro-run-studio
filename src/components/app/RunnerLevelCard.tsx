import { getGladiatorStatusFromActivity } from "@/lib/gladiator-titles";
import { useGameState } from "@/lib/game-state";
import { NighthawkBadge } from "./NighthawkBadge";

export function RunnerLevelCard({ className = "" }: { className?: string }) {
  const { state } = useGameState();
  const runner = getGladiatorStatusFromActivity(state);

  return (
    <section
      className={`rounded-2xl border border-primary/25 bg-surface p-4 ${className}`}
    >
      <div className="flex items-center gap-3">
        <NighthawkBadge className="size-12" />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent-glow">
            Runner Level
          </p>
          <p className="mt-1 truncate text-[17px] font-semibold leading-tight text-foreground">
            {runner.title}
          </p>
        </div>
        <div className="flex size-11 shrink-0 flex-col items-center justify-center rounded-full border border-primary/35 bg-primary/10 text-center shadow-[0_0_16px_-6px_var(--primary)]">
          <span className="text-[8px] font-semibold uppercase tracking-wide text-muted-foreground">
            Lv
          </span>
          <span className="text-[15px] font-bold leading-none tabular-nums text-primary">
            {runner.level}
          </span>
        </div>
      </div>
      <div className="mt-3">
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>{runner.xp.toLocaleString()} XP</span>
          <span>
            {runner.isMaxLevel ? "MAX" : `${runner.xpIntoLevel} / ${runner.xpToNextLevel}`}
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-elevated">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{ width: `${Math.round(runner.progress * 100)}%` }}
          />
        </div>
      </div>
    </section>
  );
}

/** @deprecated Use RunnerLevelCard */
export const GladiatorStatusCard = RunnerLevelCard;
