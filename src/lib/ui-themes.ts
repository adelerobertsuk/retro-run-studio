import type { Loadout } from "@/lib/arcade-store";

type ThemeVars = Record<string, string>;

const ROOT_DEFAULTS: ThemeVars = {
  "--background": "oklch(0.208 0.042 265.755)",
  "--foreground": "oklch(0.984 0.003 247.858)",
  "--primary": "oklch(0.696 0.17 162.48)",
  "--primary-glow": "oklch(0.82 0.16 165)",
  "--primary-foreground": "oklch(0.18 0.04 265)",
  "--accent": "oklch(0.585 0.203 277.117)",
  "--accent-glow": "oklch(0.72 0.17 278)",
  "--accent-foreground": "oklch(0.98 0.01 250)",
  "--surface": "oklch(0.243 0.04 264)",
  "--elevated": "oklch(0.278 0.04 263)",
  "--muted-foreground": "oklch(0.68 0.03 257)",
  "--ring": "oklch(0.696 0.17 162.48)",
  "--header-bg": "oklch(0.19 0.05 275)",
  "--gradient-hero":
    "linear-gradient(180deg, oklch(0.32 0.09 285) 0%, oklch(0.24 0.06 275) 55%, oklch(0.2 0.04 265) 100%)",
  "--gradient-energy": "linear-gradient(90deg, var(--accent), var(--primary))",
};

export const UI_PALETTE_VARS: Record<string, ThemeVars> = {
  "palette-emerald": {},
  "palette-sega-blue": {
    "--primary": "oklch(0.58 0.19 252)",
    "--primary-glow": "oklch(0.72 0.16 252)",
    "--primary-foreground": "oklch(0.98 0.01 250)",
    "--accent": "oklch(0.72 0.17 55)",
    "--accent-glow": "oklch(0.82 0.15 65)",
    "--ring": "oklch(0.58 0.19 252)",
    "--gradient-energy": "linear-gradient(90deg, oklch(0.72 0.17 55), oklch(0.58 0.19 252))",
  },
  "palette-gameboy": {
    "--background": "oklch(0.72 0.04 145)",
    "--foreground": "oklch(0.22 0.05 150)",
    "--primary": "oklch(0.42 0.12 150)",
    "--primary-glow": "oklch(0.52 0.14 148)",
    "--primary-foreground": "oklch(0.92 0.03 145)",
    "--accent": "oklch(0.35 0.08 155)",
    "--accent-glow": "oklch(0.45 0.1 152)",
    "--surface": "oklch(0.78 0.05 142)",
    "--elevated": "oklch(0.82 0.04 140)",
    "--muted-foreground": "oklch(0.38 0.05 150)",
    "--ring": "oklch(0.42 0.12 150)",
    "--header-bg": "oklch(0.38 0.1 148)",
    "--gradient-energy": "linear-gradient(90deg, oklch(0.35 0.08 155), oklch(0.42 0.12 150))",
  },
  "palette-neon": {
    "--primary": "oklch(0.68 0.26 328)",
    "--primary-glow": "oklch(0.78 0.22 330)",
    "--primary-foreground": "oklch(0.98 0.01 250)",
    "--accent": "oklch(0.78 0.14 195)",
    "--accent-glow": "oklch(0.85 0.12 195)",
    "--ring": "oklch(0.68 0.26 328)",
    "--gradient-energy": "linear-gradient(90deg, oklch(0.78 0.14 195), oklch(0.68 0.26 328))",
  },
};

export const RETRO_THEME_VARS: Record<string, ThemeVars> = {
  "theme-midnight": {},
  "theme-sega-cabinet": {
    "--background": "oklch(0.18 0.06 265)",
    "--header-bg": "oklch(0.22 0.12 252)",
    "--gradient-hero":
      "linear-gradient(180deg, oklch(0.35 0.14 252) 0%, oklch(0.22 0.1 265) 60%, oklch(0.16 0.05 275) 100%)",
    "--surface": "oklch(0.22 0.06 262)",
    "--elevated": "oklch(0.26 0.07 260)",
  },
  "theme-vhs-lounge": {
    "--background": "oklch(0.16 0.04 305)",
    "--header-bg": "oklch(0.2 0.08 310)",
    "--gradient-hero":
      "linear-gradient(180deg, oklch(0.32 0.1 310) 0%, oklch(0.2 0.06 295) 55%, oklch(0.14 0.04 285) 100%)",
    "--surface": "oklch(0.21 0.05 300)",
    "--elevated": "oklch(0.25 0.06 298)",
  },
  "theme-synthwave": {
    "--background": "oklch(0.15 0.06 295)",
    "--header-bg": "oklch(0.22 0.14 320)",
    "--gradient-hero":
      "linear-gradient(180deg, oklch(0.45 0.2 330) 0%, oklch(0.28 0.16 295) 50%, oklch(0.14 0.08 280) 100%)",
    "--surface": "oklch(0.2 0.08 300)",
    "--elevated": "oklch(0.24 0.1 298)",
  },
};

export function applyUiLoadout(loadout: Loadout) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  for (const [key, value] of Object.entries(ROOT_DEFAULTS)) {
    root.style.setProperty(key, value);
  }

  const paletteVars = UI_PALETTE_VARS[loadout.uiPalette] ?? {};
  const themeVars = RETRO_THEME_VARS[loadout.retroTheme] ?? {};

  for (const [key, value] of Object.entries({ ...paletteVars, ...themeVars })) {
    root.style.setProperty(key, value);
  }
}
