import type { ReactNode } from "react";

/** Abstract vintage-camera icons — Dazz Cam–style, no trademarked brands. */

function IconShell({ children, className = "size-10" }: { children: ReactNode; className?: string | undefined }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      {children}
    </svg>
  );
}

/** Cool-toned SLR — alludes to classic chrome rangefinder film. */
export function CineSFCameraIcon({ className }: { className?: string }) {
  return (
    <IconShell className={className}>
      <defs>
        <linearGradient id="cine-body" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
        <linearGradient id="cine-lens" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
      </defs>
      <rect x="6" y="14" width="36" height="24" rx="4" fill="url(#cine-body)" />
      <rect x="10" y="10" width="14" height="8" rx="2" fill="#64748b" />
      <circle cx="30" cy="26" r="9" fill="url(#cine-lens)" />
      <circle cx="30" cy="26" r="5.5" fill="#0f172a" stroke="#22d3ee" strokeWidth="1.5" />
      <circle cx="27.5" cy="23.5" r="1.2" fill="rgba(255,255,255,0.5)" />
      <rect x="14" y="16" width="6" height="3" rx="1" fill="#22d3ee" opacity="0.7" />
    </IconShell>
  );
}

/** Warm disposable / point-and-shoot — golden 80s vacation vibe. */
export function GoldPortraCameraIcon({ className }: { className?: string }) {
  return (
    <IconShell className={className}>
      <defs>
        <linearGradient id="gold-body" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>
      <rect x="10" y="12" width="28" height="30" rx="6" fill="url(#gold-body)" />
      <rect x="14" y="8" width="20" height="6" rx="2" fill="#92400e" />
      <circle cx="24" cy="26" r="8" fill="#1c1917" />
      <circle cx="24" cy="26" r="5" fill="#292524" stroke="#fde047" strokeWidth="1.2" />
      <rect x="30" y="14" width="4" height="3" rx="1" fill="#ef4444" />
      <rect x="12" y="34" width="24" height="4" rx="1" fill="#78350f" opacity="0.6" />
    </IconShell>
  );
}

/** Square instant camera — polaroid-style without branding. */
export function InstaSQCameraIcon({ className }: { className?: string }) {
  return (
    <IconShell className={className}>
      <rect x="8" y="10" width="32" height="28" rx="5" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
      <rect x="12" y="14" width="24" height="14" rx="2" fill="#1e293b" />
      <circle cx="24" cy="21" r="5" fill="#0f172a" stroke="#ec4899" strokeWidth="1.5" />
      <rect x="10" y="32" width="28" height="10" rx="2" fill="#e2e8f0" />
      <rect x="14" y="34" width="20" height="6" rx="1" fill="#fff" stroke="#cbd5e1" />
    </IconShell>
  );
}

/** Chunky disposable flash camera. */
export function DQSClassicCameraIcon({ className }: { className?: string }) {
  return (
    <IconShell className={className}>
      <defs>
        <linearGradient id="dqs-body" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#15803d" />
        </linearGradient>
      </defs>
      <rect x="11" y="14" width="26" height="28" rx="5" fill="url(#dqs-body)" />
      <rect x="15" y="8" width="18" height="8" rx="3" fill="#166534" />
      <circle cx="24" cy="28" r="7" fill="#0f172a" />
      <circle cx="24" cy="28" r="4.5" fill="#1e293b" stroke="#fde047" strokeWidth="1" />
      <rect x="30" y="16" width="5" height="4" rx="1" fill="#fef08a" />
      <path d="M16 38 L32 38" stroke="#14532d" strokeWidth="2" strokeLinecap="round" />
    </IconShell>
  );
}
