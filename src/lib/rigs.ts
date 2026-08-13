export type Rig = {
  id: string;
  name: string;
  tagline: string;
  tokens: number;
  accent: string;
  prompt: (subject: string) => string;
};

export const RIGS: Rig[] = [
  {
    id: "rig-rpg",
    name: "Retro Trading Card",
    tagline: "Hero portrait, stat block, holo border",
    tokens: 0,
    accent: "var(--primary)",
    prompt: (s) =>
      `A 16-bit SNES-era JRPG hero portrait of ${s}, chunky pixel art, bold outlines, jewel-tone palette, dramatic side lighting, standing heroically in running gear, framed bust composition on a deep midnight-blue gradient background with subtle pixel sparkles. Clean pixel art, no text.`,
  },
  {
    id: "rig-vhs",
    name: "VHS-84",
    tagline: "Tape grain, chroma bleed, scanlines",
    tokens: 120,
    accent: "var(--accent)",
    prompt: (s) =>
      `A retro 1984 VHS camcorder still of ${s} as a pixel-art runner, heavy analog scanlines, chromatic aberration, magenta and cyan color bleed, tape noise and tracking distortion, dark night street lit by neon signs. Gritty lo-fi pixel art, no text.`,
  },
  {
    id: "rig-hawkins",
    name: "Hawkins Poster",
    tagline: "Upside-down fog, red neon type glow",
    tokens: 180,
    accent: "oklch(0.637 0.208 25.3)",
    prompt: (s) =>
      `An 80s sci-fi horror movie poster illustration of ${s} as a pixel-art runner silhouetted against a blood-red glowing sky, dense fog, dead pine forest, floating ash particles, ominous red rim lighting, airbrushed poster composition with pixel-art subject. Cinematic, no text.`,
  },
  {
    id: "rig-puma",
    name: "Neon Synth",
    tagline: "Neon grid glow, synthwave color blocking",
    tokens: 220,
    accent: "oklch(0.769 0.188 70.08)",
    prompt: (s) =>
      `A late-80s sportswear catalog advertisement featuring ${s} as a pixel-art athlete mid-stride, bold geometric color blocking in orange, teal and cream, halftone print texture, confident studio pose, flat graphic background with diagonal stripes. Retro print ad, no text.`,
  },
];
