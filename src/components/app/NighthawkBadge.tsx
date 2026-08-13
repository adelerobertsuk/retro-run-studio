import { useId } from "react";

/** Stylized Nighthawk superhero emblem — clean vector badge for the runner card. */
export function NighthawkBadge({ className = "size-12" }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const shield = `nh-shield-${uid}`;
  const wing = `nh-wing-${uid}`;
  const moon = `nh-moon-${uid}`;
  const glow = `nh-glow-${uid}`;

  return (
    <svg
      viewBox="0 0 80 80"
      className={`${className} shrink-0`}
      aria-hidden
      role="img"
    >
      <defs>
        <radialGradient id={shield} cx="50%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#312e81" />
          <stop offset="55%" stopColor="#1e1b4b" />
          <stop offset="100%" stopColor="#0f0a1e" />
        </radialGradient>
        <linearGradient id={wing} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="45%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id={moon} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
        <filter id={glow} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#38bdf8" floodOpacity="0.55" />
        </filter>
      </defs>

      <circle cx="40" cy="40" r="38" fill={`url(#${shield})`} filter={`url(#${glow})`} />
      <circle cx="40" cy="40" r="38" fill="none" stroke="#38bdf8" strokeWidth="1.5" opacity="0.65" />
      <circle cx="40" cy="40" r="33" fill="none" stroke="#fbbf24" strokeWidth="0.75" opacity="0.5" />

      {/* Crescent moon */}
      <path
        d="M52 18a14 14 0 1 0 0 20 11 11 0 0 1 0-20z"
        fill={`url(#${moon})`}
        opacity="0.9"
      />

      {/* Wings */}
      <path
        d="M8 44 C16 28, 28 22, 40 26 C52 22, 64 28, 72 44 C64 38, 52 34, 40 36 C28 34, 16 38, 8 44 Z"
        fill={`url(#${wing})`}
        opacity="0.95"
      />
      <path
        d="M14 42 C22 32, 30 30, 40 32 M66 42 C58 32, 50 30, 40 32"
        stroke="#1e1b4b"
        strokeWidth="1"
        fill="none"
        opacity="0.35"
      />

      {/* Hawk head & mask */}
      <path
        d="M40 30 C34 30, 30 34, 30 40 C30 46, 34 52, 40 54 C46 52, 50 46, 50 40 C50 34, 46 30, 40 30 Z"
        fill="#0f172a"
      />
      <path
        d="M40 32 C36 32, 33 35, 33 39 C33 43, 36 48, 40 49 C44 48, 47 43, 47 39 C47 35, 44 32, 40 32 Z"
        fill="#1e293b"
      />
      <path d="M34 38 L38 40 L34 42 Z" fill="#38bdf8" />
      <path d="M46 38 L42 40 L46 42 Z" fill="#38bdf8" />
      <path d="M37 46 L40 48 L43 46" stroke="#fbbf24" strokeWidth="1.2" fill="none" strokeLinecap="round" />

      {/* Beak crest */}
      <path d="M40 30 L38 26 L40 28 L42 26 Z" fill="#fbbf24" />
    </svg>
  );
}
