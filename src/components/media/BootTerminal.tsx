import { useEffect, useRef, useState } from "react";

export const BOOT_LINES = [
  "> CONNECTING STRAVA ENGINE...",
  "> ANALYZING GPS ROUTE & TELEMETRY...",
  "> SPRITE SYNTHESIS: MATCHING OUTFITS & AVATARS...",
  "> RENDERING 8-BIT ARCADE REEL...",
];

const CHAR_MS = 16;
const LINE_GAP_MS = 120;
const FLASH_MS = 700;

/** Retro arcade "complete" chirp + haptic tap. */
function arcadeChime() {
  try {
    navigator.vibrate?.([18, 40, 26]);
  } catch {
    /* haptics unsupported */
  }
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    [880, 1174.7, 1568].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = freq;
      const t = now + i * 0.08;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.06, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.1);
    });
    window.setTimeout(() => void ctx.close(), 600);
  } catch {
    /* audio blocked */
  }
}

type Props = {
  lines?: string[];
  /** Total duration of the typed script in ms (excluding the COMPLETE flash). */
  duration?: number;
  muted?: boolean;
  onDone: () => void;
};

/** Labor-illusion CRT boot overlay shown while media renders. */
export function BootTerminal({ lines = BOOT_LINES, duration = 3000, muted, onDone }: Props) {
  const [typed, setTyped] = useState<string[]>([]);
  const [complete, setComplete] = useState(false);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    let cancelled = false;
    const timers: number[] = [];
    const chars = lines.reduce((n, l) => n + l.length, 0);
    const charMs = Math.max(
      6,
      Math.min(CHAR_MS, (duration - lines.length * LINE_GAP_MS) / Math.max(chars, 1)),
    );

    const runLine = (index: number) => {
      if (cancelled || index >= lines.length) {
        if (cancelled) return;
        setComplete(true);
        if (!muted) arcadeChime();
        timers.push(window.setTimeout(() => doneRef.current(), FLASH_MS));
        return;
      }
      const text = lines[index]!;
      setTyped((prev) => [...prev, ""]);
      let i = 0;
      const step = () => {
        if (cancelled) return;
        i += 1;
        setTyped((prev) => {
          const next = [...prev];
          next[index] = text.slice(0, i);
          return next;
        });
        if (i < text.length) {
          timers.push(window.setTimeout(step, charMs));
        } else {
          timers.push(window.setTimeout(() => runLine(index + 1), LINE_GAP_MS));
        }
      };
      timers.push(window.setTimeout(step, charMs));
    };

    runLine(0);
    return () => {
      cancelled = true;
      timers.forEach(window.clearTimeout);
    };
  }, [lines, duration, muted]);

  return (
    <div
      className="absolute inset-0 z-20 overflow-hidden bg-[#04070a] font-mono"
      role="status"
      aria-live="polite"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(16,185,129,0.16),transparent_70%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-40 mix-blend-screen"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, rgba(16,255,140,0.10) 0px, rgba(16,255,140,0.10) 1px, transparent 1px, transparent 3px)",
        }}
        aria-hidden
      />
      <div className="relative flex h-full flex-col justify-center gap-1.5 p-4">
        {typed.map((line, i) => (
          <p
            key={i}
            className="text-[10px] leading-relaxed tracking-tight text-emerald-400 [text-shadow:0_0_8px_rgba(16,185,129,0.7)]"
          >
            {line}
            {i === typed.length - 1 && !complete && (
              <span className="ml-0.5 animate-pulse text-emerald-300">_</span>
            )}
          </p>
        ))}
        {complete && (
          <p className="mt-3 animate-pulse text-center text-[15px] font-bold tracking-[0.2em] text-emerald-300 [text-shadow:0_0_14px_rgba(16,185,129,0.9)]">
            COMPLETE!
          </p>
        )}
      </div>
    </div>
  );
}
