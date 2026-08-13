/** Vector synthwave runner badge — no pixel art. */
export function RunnerAvatarBadge({ className = "size-14" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={`${className} shrink-0 rounded-xl`}
      aria-hidden
    >
      <defs>
        <linearGradient id="badge-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1a0f35" />
          <stop offset="100%" stopColor="#0a0618" />
        </linearGradient>
        <linearGradient id="badge-ring" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="50%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
        <linearGradient id="silhouette" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#badge-bg)" />
      <circle cx="32" cy="32" r="28" fill="none" stroke="url(#badge-ring)" strokeWidth="2" opacity="0.9" />
      <path
        d="M32 14c-5 0-8 4-8 8.5 0 3 1.5 5.5 4 7v2h-6c-2 0-3.5 2-3.5 4.5V42c0 2 1.5 4 3.5 4h20c2 0 3.5-2 3.5-4V36c0-2.5-1.5-4.5-3.5-4.5h-6v-2c2.5-1.5 4-4 4-7C40 18 37 14 32 14z"
        fill="url(#silhouette)"
        opacity="0.95"
      />
      <ellipse cx="26" cy="22" rx="2" ry="2.5" fill="#0f172a" />
      <ellipse cx="38" cy="22" rx="2" ry="2.5" fill="#0f172a" />
    </svg>
  );
}
