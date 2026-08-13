/**
 * Tiny 8-bit chiptune engine. Square-wave blips synthesized with WebAudio so
 * no audio assets are needed. Globally muted via `setAudioMuted`.
 */
let muted = true;
let ctx: AudioContext | null = null;

export function setAudioMuted(value: boolean) {
  muted = value;
}

export function isAudioMuted() {
  return muted;
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function blip(freq: number, duration: number, startOffset = 0, gain = 0.05) {
  const audio = getCtx();
  if (!audio) return;
  const t0 = audio.currentTime + startOffset;
  const osc = audio.createOscillator();
  const vol = audio.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(freq, t0);
  vol.gain.setValueAtTime(0.0001, t0);
  vol.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  vol.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(vol).connect(audio.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

export type SfxName = "tab" | "tap" | "jump" | "complete";

const SFX: Record<SfxName, () => void> = {
  tab: () => blip(660, 0.07),
  tap: () => blip(880, 0.05, 0, 0.04),
  jump: () => {
    blip(520, 0.06);
    blip(780, 0.08, 0.05);
  },
  complete: () => {
    blip(660, 0.09);
    blip(880, 0.09, 0.1);
    blip(1180, 0.16, 0.2, 0.06);
  },
};

/** Play a chiptune effect. No-ops while the global mute toggle is on. */
export function playSfx(name: SfxName) {
  if (muted) return;
  try {
    SFX[name]();
  } catch {
    /* audio unavailable */
  }
}
