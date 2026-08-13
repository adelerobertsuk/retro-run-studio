import { useId } from "react";

/** Polished 80s arcade fighter-select portrait — smooth vectors, rich colour. */
export function ArcadeHeroPortrait({ className = "size-12" }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const bg = `hero-bg-${uid}`;
  const skin = `hero-skin-${uid}`;
  const hair = `hero-hair-${uid}`;
  const jacket = `hero-jacket-${uid}`;
  const glow = `hero-glow-${uid}`;

  return (
    <svg
      viewBox="0 0 80 80"
      className={`${className} shrink-0 overflow-hidden rounded-xl`}
      aria-hidden
    >
      <defs>
        <radialGradient id={bg} cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#4c1d95" />
          <stop offset="55%" stopColor="#1e1b4b" />
          <stop offset="100%" stopColor="#0f0a1e" />
        </radialGradient>
        <linearGradient id={skin} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fde8d0" />
          <stop offset="100%" stopColor="#e8b88a" />
        </linearGradient>
        <linearGradient id={hair} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#312e81" />
        </linearGradient>
        <linearGradient id={jacket} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#0e7490" />
        </linearGradient>
        <filter id={glow} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#22d3ee" floodOpacity="0.45" />
        </filter>
      </defs>

      <rect width="80" height="80" rx="14" fill={`url(#${bg})`} />
      <rect
        x="3"
        y="3"
        width="74"
        height="74"
        rx="12"
        fill="none"
        stroke="#fbbf24"
        strokeWidth="1.5"
        opacity="0.85"
      />

      {/* Light burst */}
      <g opacity="0.35">
        {[0, 45, 90, 135].map((angle) => (
          <line
            key={angle}
            x1="40"
            y1="40"
            x2={40 + Math.cos((angle * Math.PI) / 180) * 38}
            y2={40 + Math.sin((angle * Math.PI) / 180) * 38}
            stroke="#fde047"
            strokeWidth="1"
          />
        ))}
      </g>

      {/* Shoulders / jacket */}
      <path
        d="M12 68 C18 54, 28 50, 40 52 C52 50, 62 54, 68 68 L68 80 L12 80 Z"
        fill={`url(#${jacket})`}
        filter={`url(#${glow})`}
      />
      <path d="M28 58 L40 54 L52 58" stroke="#fde047" strokeWidth="1.2" fill="none" opacity="0.8" />

      {/* Neck */}
      <rect x="34" y="48" width="12" height="8" rx="3" fill={`url(#${skin})`} />

      {/* Hair back */}
      <path
        d="M22 38 C22 18, 34 10, 40 10 C46 10, 58 18, 58 38 C58 44, 54 48, 50 46 L30 46 C26 48, 22 44, 22 38 Z"
        fill={`url(#${hair})`}
      />

      {/* Face */}
      <ellipse cx="40" cy="36" rx="15" ry="17" fill={`url(#${skin})`} />

      {/* Headband */}
      <path d="M24 30 C30 26, 50 26, 56 30 L56 34 C50 32, 30 32, 24 34 Z" fill="#ef4444" />
      <path d="M22 32 L24 30 L24 34 Z" fill="#fca5a5" />
      <path d="M58 32 L56 30 L56 34 Z" fill="#fca5a5" />

      {/* Hair fringe */}
      <path
        d="M26 24 C30 18, 36 16, 40 17 C44 16, 50 18, 54 24 C52 22, 46 20, 40 20 C34 20, 28 22, 26 24 Z"
        fill={`url(#${hair})`}
      />

      {/* Eyes */}
      <ellipse cx="33" cy="35" rx="3.2" ry="3.8" fill="#fff" />
      <ellipse cx="47" cy="35" rx="3.2" ry="3.8" fill="#fff" />
      <circle cx="33.5" cy="35.5" r="2" fill="#1e1b4b" />
      <circle cx="47.5" cy="35.5" r="2" fill="#1e1b4b" />
      <circle cx="34.2" cy="34.5" r="0.7" fill="#fff" />
      <circle cx="48.2" cy="34.5" r="0.7" fill="#fff" />

      {/* Brows */}
      <path d="M28 30 Q33 27, 37 30" stroke="#4c1d95" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d="M43 30 Q47 27, 52 30" stroke="#4c1d95" strokeWidth="1.4" fill="none" strokeLinecap="round" />

      {/* Nose & smile */}
      <path d="M40 38 L40 41" stroke="#d4a574" strokeWidth="1" strokeLinecap="round" />
      <path
        d="M34 44 Q40 48, 46 44"
        stroke="#c2410c"
        strokeWidth="1.3"
        fill="none"
        strokeLinecap="round"
      />

      {/* Earring sparkle */}
      <circle cx="55" cy="38" r="1.2" fill="#fde047" opacity="0.9" />
    </svg>
  );
}
