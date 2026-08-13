import type { LucideIcon } from "lucide-react";

type MetricCircleProps = {
  label: string;
  value: string;
  percent: number;
  icon: LucideIcon;
};

const RADIUS = 30;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function MetricCircle({ label, value, percent, icon: Icon }: MetricCircleProps) {
  const offset = CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE;

  return (
    <div className="flex flex-1 flex-col items-center gap-1.5">
      <div className="relative size-[68px]">
        <svg className="size-full -rotate-90" viewBox="0 0 68 68" aria-hidden>
          <circle
            cx="34"
            cy="34"
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-elevated"
          />
          <circle
            cx="34"
            cy="34"
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            className="text-primary transition-[stroke-dashoffset] duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <Icon className="size-3 text-muted-foreground" strokeWidth={2} />
          <span className="text-[12px] font-semibold tabular-nums leading-none text-foreground">
            {value}
          </span>
        </div>
      </div>
      <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
    </div>
  );
}
