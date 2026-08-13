import type { Palette } from "@/components/app/pixel-scene";
import { DEFAULT_PALETTE } from "@/components/app/pixel-scene";
import { RIGS } from "@/lib/rigs";

export type StoreCategory = "UI Palette" | "Retro Theme" | "Avatar Style" | "Media Lab";

export type Loadout = {
  uiPalette: string;
  retroTheme: string;
  avatarStyle: string;
};

export type StoreItem = {
  id: string;
  name: string;
  category: StoreCategory;
  description: string;
  tokens: number;
  preview: [string, string, string?];
  loadoutKey?: keyof Loadout;
};

export const DEFAULT_LOADOUT: Loadout = {
  uiPalette: "palette-emerald",
  retroTheme: "theme-midnight",
  avatarStyle: "avatar-classic",
};

export const FREE_UNLOCKS = [
  "palette-emerald",
  "theme-midnight",
  "avatar-classic",
  "rig-rpg",
  "rig-vhs",
] as const;

export const AVATAR_PALETTES: Record<string, Palette> = {
  "avatar-classic": DEFAULT_PALETTE,
  "avatar-street": {
    skinTone: "#d4a574",
    hair: "#1a1a1a",
    shirt: "#ef4444",
    shorts: "#1e3a5f",
    shoes: "#fbbf24",
  },
  "avatar-arcade": {
    skinTone: "#f2c49b",
    hair: "#4c1d95",
    shirt: "#f59e0b",
    shorts: "#0f172a",
    shoes: "#22d3ee",
  },
  "avatar-neon": {
    skinTone: "#c9a0dc",
    hair: "#0f172a",
    shirt: "#ec4899",
    shorts: "#06b6d4",
    shoes: "#fde047",
  },
};

export const STORE_ITEMS: StoreItem[] = [
  {
    id: "palette-emerald",
    name: "Emerald Night",
    category: "UI Palette",
    description: "The classic 8-Bit Runner look — calm emerald & indigo.",
    tokens: 0,
    preview: ["#10b981", "#6366f1", "#0f172a"],
    loadoutKey: "uiPalette",
  },
  {
    id: "palette-sega-blue",
    name: "Sega Blue",
    category: "UI Palette",
    description: "Genesis-era cobalt and sunset orange accents.",
    tokens: 100,
    preview: ["#2563eb", "#f97316", "#1e1b4b"],
    loadoutKey: "uiPalette",
  },
  {
    id: "palette-gameboy",
    name: "GameBoy Green",
    category: "UI Palette",
    description: "DMG-01 olive screen vibes — cozy handheld green.",
    tokens: 100,
    preview: ["#306230", "#8bac0f", "#9bbc0f"],
    loadoutKey: "uiPalette",
  },
  {
    id: "palette-neon",
    name: "Neon Arcade",
    category: "UI Palette",
    description: "Hot magenta and cyan — late-night arcade glow.",
    tokens: 150,
    preview: ["#ec4899", "#22d3ee", "#1a0533"],
    loadoutKey: "uiPalette",
  },
  {
    id: "theme-midnight",
    name: "Midnight Runner",
    category: "Retro Theme",
    description: "Deep slate skies — the default night-run atmosphere.",
    tokens: 0,
    preview: ["#1e293b", "#6366f1", "#10b981"],
    loadoutKey: "retroTheme",
  },
  {
    id: "theme-sega-cabinet",
    name: "Sega Cabinet",
    category: "Retro Theme",
    description: "Arcade cabinet blues with bold header gradients.",
    tokens: 120,
    preview: ["#1d4ed8", "#f59e0b", "#0f172a"],
    loadoutKey: "retroTheme",
  },
  {
    id: "theme-vhs-lounge",
    name: "VHS Lounge",
    category: "Retro Theme",
    description: "Purple haze and warm tape-static lounge lighting.",
    tokens: 120,
    preview: ["#7c3aed", "#f472b6", "#1a1025"],
    loadoutKey: "retroTheme",
  },
  {
    id: "theme-synthwave",
    name: "Synthwave Sky",
    category: "Retro Theme",
    description: "Pink horizon sunsets over a neon grid world.",
    tokens: 180,
    preview: ["#f472b6", "#a855f7", "#0f0a1a"],
    loadoutKey: "retroTheme",
  },
  {
    id: "avatar-classic",
    name: "Classic Runner",
    category: "Avatar Style",
    description: "Emerald jersey, indigo shorts — your default sprite.",
    tokens: 0,
    preview: ["#10b981", "#6366f1", "#f2c49b"],
    loadoutKey: "avatarStyle",
  },
  {
    id: "avatar-street",
    name: "Street Sprinter",
    category: "Avatar Style",
    description: "Red track top and gold kicks for city miles.",
    tokens: 80,
    preview: ["#ef4444", "#1e3a5f", "#fbbf24"],
    loadoutKey: "avatarStyle",
  },
  {
    id: "avatar-arcade",
    name: "Arcade Hero",
    category: "Avatar Style",
    description: "Orange cabinet jersey with cyan sneaker pop.",
    tokens: 80,
    preview: ["#f59e0b", "#22d3ee", "#4c1d95"],
    loadoutKey: "avatarStyle",
  },
  {
    id: "avatar-neon",
    name: "Neon Racer",
    category: "Avatar Style",
    description: "Magenta kit and electric teal — full synthwave.",
    tokens: 120,
    preview: ["#ec4899", "#06b6d4", "#fde047"],
    loadoutKey: "avatarStyle",
  },
  ...RIGS.map((r) => ({
    id: r.id,
    name: r.name,
    category: "Media Lab" as const,
    description: r.tagline,
    tokens: r.tokens,
    preview: [r.accent.startsWith("oklch") ? "#6366f1" : "#10b981", "#1e293b", "#fbbf24"] as [
      string,
      string,
      string?,
    ],
  })),
];

export const STORE_CATEGORIES: StoreCategory[] = [
  "UI Palette",
  "Retro Theme",
  "Avatar Style",
  "Media Lab",
];

export function getStoreItem(id: string) {
  return STORE_ITEMS.find((i) => i.id === id);
}

export function getAvatarPalette(styleId: string): Palette {
  return AVATAR_PALETTES[styleId] ?? DEFAULT_PALETTE;
}

export function isItemOwned(unlocked: string[], item: StoreItem) {
  return item.tokens === 0 || unlocked.includes(item.id);
}

export function sanitizeLoadout(loadout: Partial<Loadout> | undefined, unlocked: string[]): Loadout {
  const merged = { ...DEFAULT_LOADOUT, ...loadout };
  (["uiPalette", "retroTheme", "avatarStyle"] as const).forEach((key) => {
    const item = getStoreItem(merged[key]);
    if (!item || !isItemOwned(unlocked, item)) {
      merged[key] = DEFAULT_LOADOUT[key];
    }
  });
  return merged;
}
