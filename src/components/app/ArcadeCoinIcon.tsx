import { useId } from "react";

/** High-resolution gold arcade token — smooth vector coin with depth and shine. */
export function ArcadeCoinIcon({ className = "size-[22px]" }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const face = `coin-face-${uid}`;
  const rim = `coin-rim-${uid}`;
  const shine = `coin-shine-${uid}`;
  const glow = `coin-glow-${uid}`;

  return (
    <svg viewBox="0 0 64 64" className={`${className} shrink-0`} aria-hidden>
      <defs>
        <radialGradient id={face} cx="32%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#fffbeb" />
          <stop offset="35%" stopColor="#fde68a" />
          <stop offset="70%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </radialGradient>
        <linearGradient id={rim} x1="8%" y1="8%" x2="92%" y2="92%">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="50%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
        <linearGradient id={shine} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <filter id={glow} x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#fbbf24" floodOpacity="0.5" />
        </filter>
      </defs>

      <circle cx="32" cy="32" r="29" fill={`url(#${rim})`} filter={`url(#${glow})`} />
      <circle cx="32" cy="32" r="24" fill={`url(#${face})`} />
      <circle cx="32" cy="32" r="24" fill="none" stroke="#fbbf24" strokeWidth="0.6" opacity="0.7" />
      <circle cx="32" cy="32" r="19" fill="none" stroke="#92400e" strokeWidth="0.5" opacity="0.35" />

      <text
        x="32"
        y="37"
        textAnchor="middle"
        fontSize="18"
        fontWeight="800"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fill="#78350f"
        opacity="0.9"
      >
        8
      </text>

      <ellipse cx="22" cy="20" rx="10" ry="6" fill={`url(#${shine})`} transform="rotate(-25 22 20)" />
    </svg>
  );
}
