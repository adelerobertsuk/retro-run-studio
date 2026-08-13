import type { Palette } from "@/components/app/pixel-scene";
import { DEFAULT_PALETTE } from "@/components/app/pixel-scene";
import { RIGS } from "@/lib/rigs";
import type { PhotoBoothId, VideoFilterId } from "@/lib/camera-filters";
import type { CardBorderId } from "@/lib/card-borders";

export type StoreCategory =
  | "UI Palette"
  | "Retro Theme"
  | "Avatar Style"
  | "Camera Filters"
  | "Card Borders"
  | "Overlays"
  | "Media Lab";

export type Loadout = {
  uiPalette: string;
  retroTheme: string;
  avatarStyle: string;
  videoFilter: VideoFilterId;
  photoBooth: PhotoBoothId;
  cardBorder: CardBorderId;
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
  avatarStyle: "avatar-neutral",
  videoFilter: "filter-fuji",
  photoBooth: "booth-fuji",
  cardBorder: "border-classic",
};

export const FREE_UNLOCKS = [
  "palette-emerald",
  "theme-midnight",
  "avatar-neutral",
  "avatar-classic",
  "filter-fuji",
  "booth-fuji",
  "border-classic",
  "rig-rpg",
  "rig-vhs",
  "victory-banner",
  "crushed-it",
  "hadouken",
  "quote-need-speed",
  "quote-ill-be-back",
  "quote-leg-day",
] as const;

export const AVATAR_PALETTES: Record<string, Palette> = {
  "avatar-neutral": DEFAULT_PALETTE,
  "avatar-classic": DEFAULT_PALETTE,
  "avatar-courier": {
    skinTone: "#e8c4a8",
    hair: "#3d3d3d",
    shirt: "#0ea5e9",
    shorts: "#1e293b",
    shoes: "#f8fafc",
  },
  "avatar-trail": {
    skinTone: "#d4a88c",
    hair: "#6b5b4f",
    shirt: "#84cc16",
    shorts: "#365314",
    shoes: "#fef3c7",
  },
  "avatar-street": {
    skinTone: "#d4a574",
    hair: "#1a1a1a",
    shirt: "#ef4444",
    shorts: "#1e3a5f",
    shoes: "#fbbf24",
  },
  "avatar-arcade": {
    skinTone: "#e8c4a8",
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
    id: "avatar-neutral",
    name: "Neutral Runner",
    category: "Avatar Style",
    description: "Unisex sprite with calm slate kit — default out of the box.",
    tokens: 0,
    preview: ["#64748b", "#334155", "#e8c4a8"],
    loadoutKey: "avatarStyle",
  },
  {
    id: "avatar-courier",
    name: "Courier Pack",
    category: "Avatar Style",
    description: "Sky-blue jersey and clean neutrals for everyday miles.",
    tokens: 70,
    preview: ["#0ea5e9", "#1e293b", "#e8c4a8"],
    loadoutKey: "avatarStyle",
  },
  {
    id: "avatar-trail",
    name: "Trail Pack",
    category: "Avatar Style",
    description: "Forest greens and earth tones for park loops.",
    tokens: 70,
    preview: ["#84cc16", "#365314", "#d4a88c"],
    loadoutKey: "avatarStyle",
  },
  {
    id: "avatar-street",
    name: "Street Sprinter",
    category: "Avatar Style",
    description: "Red track top and gold kicks for city miles.",
    tokens: 80,
    preview: ["#ef4444", "#1e3a5f", "#d4a574"],
    loadoutKey: "avatarStyle",
  },
  {
    id: "avatar-arcade",
    name: "Arcade Hero",
    category: "Avatar Style",
    description: "Orange cabinet jersey with cyan sneaker pop.",
    tokens: 80,
    preview: ["#f59e0b", "#22d3ee", "#e8c4a8"],
    loadoutKey: "avatarStyle",
  },
  {
    id: "avatar-neon",
    name: "Neon Racer",
    category: "Avatar Style",
    description: "Magenta kit and electric teal — full synthwave.",
    tokens: 120,
    preview: ["#ec4899", "#06b6d4", "#c9a0dc"],
    loadoutKey: "avatarStyle",
  },
  {
    id: "filter-fuji",
    name: "Cine SF",
    category: "Camera Filters",
    description: "Cool greens, soft VHS grain — default video look.",
    tokens: 0,
    preview: ["#6ee7b7", "#1e3a5f", "#0f172a"],
    loadoutKey: "videoFilter",
  },
  {
    id: "filter-kodak",
    name: "Gold Portra",
    category: "Camera Filters",
    description: "Golden hour warmth with heavy chroma bleed.",
    tokens: 100,
    preview: ["#fbbf24", "#f472b6", "#1a1025"],
    loadoutKey: "videoFilter",
  },
  {
    id: "booth-fuji",
    name: "Insta SQ",
    category: "Camera Filters",
    description: "Matte instant warmth for photo booth exports.",
    tokens: 0,
    preview: ["#a7f3d0", "#fef3c7", "#334155"],
    loadoutKey: "photoBooth",
  },
  {
    id: "booth-kodak",
    name: "DQS Classic",
    category: "Camera Filters",
    description: "Saturated gold & magenta stills with tape grain.",
    tokens: 100,
    preview: ["#fcd34d", "#f472b6", "#312e81"],
    loadoutKey: "photoBooth",
  },
  {
    id: "border-classic",
    name: "Classic Emerald",
    category: "Card Borders",
    description: "Gold & emerald double frame — the default trading card.",
    tokens: 0,
    preview: ["#fbbf24", "#10b981", "#0f172a"],
    loadoutKey: "cardBorder",
  },
  {
    id: "border-gold-foil",
    name: "Gold Foil",
    category: "Card Borders",
    description: "Shiny championship foil for hero cards.",
    tokens: 80,
    preview: ["#fde047", "#f59e0b", "#1c1917"],
    loadoutKey: "cardBorder",
  },
  {
    id: "border-neon-grid",
    name: "Neon Grid",
    category: "Card Borders",
    description: "Cyan & magenta dashed arcade frame.",
    tokens: 100,
    preview: ["#22d3ee", "#ec4899", "#0f0a1a"],
    loadoutKey: "cardBorder",
  },
  {
    id: "border-holo",
    name: "Holo Prism",
    category: "Card Borders",
    description: "Shifting holo gradient — premium collector vibe.",
    tokens: 150,
    preview: ["#a855f7", "#22d3ee", "#ec4899"],
    loadoutKey: "cardBorder",
  },
  {
    id: "victory-banner",
    name: "Victory Ribbon",
    category: "Overlays",
    description: "Neon win banner — included free.",
    tokens: 0,
    preview: ["#22d3ee", "#10b981", "#0f172a"],
  },
  {
    id: "crushed-it",
    name: "Crushed It",
    category: "Overlays",
    description: "Workout flex sticker — included free.",
    tokens: 0,
    preview: ["#f97316", "#fbbf24", "#1a1025"],
  },
  {
    id: "hadouken",
    name: "Chi Burst",
    category: "Overlays",
    description: "Vector energy blast — included free.",
    tokens: 0,
    preview: ["#22d3ee", "#ec4899", "#0a0618"],
  },
  {
    id: "quote-need-speed",
    name: "Need for Speed",
    category: "Overlays",
    description: "80s quote overlay — included free.",
    tokens: 0,
    preview: ["#38bdf8", "#22d3ee", "#0f172a"],
  },
  {
    id: "quote-ill-be-back",
    name: "I'll Be Back",
    category: "Overlays",
    description: "Comeback quote — included free.",
    tokens: 0,
    preview: ["#ef4444", "#f87171", "#1a1025"],
  },
  {
    id: "quote-leg-day",
    name: "Leg Day",
    category: "Overlays",
    description: "Morning legs quote — included free.",
    tokens: 0,
    preview: ["#84cc16", "#a3e635", "#0f172a"],
  },
  {
    id: "level-clear",
    name: "Level Clear",
    category: "Overlays",
    description: "Synthwave stage-clear sticker for Stories.",
    tokens: 80,
    preview: ["#10b981", "#22d3ee", "#0f172a"],
  },
  {
    id: "perfect-run",
    name: "Perfect Run",
    category: "Overlays",
    description: "Neon combo stamp — high-production flex.",
    tokens: 80,
    preview: ["#fde047", "#ec4899", "#1a0a2e"],
  },
  {
    id: "pixel-boom",
    name: "Neon Burst",
    category: "Overlays",
    description: "Vector energy burst — viral workout energy.",
    tokens: 90,
    preview: ["#f97316", "#ec4899", "#0f0a1a"],
  },
  {
    id: "arcade-frame",
    name: "Chrome Frame",
    category: "Overlays",
    description: "Sleek HUD border with transparent centre.",
    tokens: 100,
    preview: ["#22d3ee", "#6366f1", "#0a0618"],
  },
  {
    id: "brand-badge",
    name: "8-Bit Runner Badge",
    category: "Overlays",
    description: "Official brand stamp for corner placement.",
    tokens: 60,
    preview: ["#fbbf24", "#10b981", "#0f172a"],
  },
  {
    id: "quote-arnie-arms",
    name: "Arms Like Arnie",
    category: "Overlays",
    description: "80s flex quote — neon typography, no boxes.",
    tokens: 70,
    preview: ["#f97316", "#fbbf24", "#1a1025"],
  },
  {
    id: "quote-addicted-sweat",
    name: "Addicted to Sweat",
    category: "Overlays",
    description: "Aerobics-era quote overlay for Reels.",
    tokens: 70,
    preview: ["#ec4899", "#22d3ee", "#12061f"],
  },
  {
    id: "quote-stretch-streams",
    name: "Don't Skip Stretch",
    category: "Overlays",
    description: "Mobility quote with synthwave glow.",
    tokens: 70,
    preview: ["#10b981", "#a855f7", "#0a1628"],
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
  "Camera Filters",
  "Card Borders",
  "Overlays",
  "Media Lab",
];

/** Categories hidden from the Arcade shop — overlays unlock in Media Lab. */
export const SHOP_HIDDEN_CATEGORIES: StoreCategory[] = ["Overlays"];

export type ShopShelf = {
  id: "themes" | "runner" | "media";
  label: string;
  blurb: string;
  categories: StoreCategory[];
};

/** Curated shop shelves — three premium collections instead of seven grids. */
export const SHOP_SHELVES: ShopShelf[] = [
  {
    id: "themes",
    label: "Themes",
    blurb: "App palette & night-run atmosphere",
    categories: ["UI Palette", "Retro Theme"],
  },
  {
    id: "runner",
    label: "Runner",
    blurb: "Home-screen sprite colours",
    categories: ["Avatar Style"],
  },
  {
    id: "media",
    label: "Media Lab",
    blurb: "Film filters, card frames & export rigs",
    categories: ["Camera Filters", "Card Borders", "Media Lab"],
  },
];

export function getShelfItems(shelf: ShopShelf): StoreItem[] {
  return STORE_ITEMS.filter((i) => shelf.categories.includes(i.category));
}

export function getShopCatalogItems(): StoreItem[] {
  return STORE_ITEMS.filter((i) => !SHOP_HIDDEN_CATEGORIES.includes(i.category));
}

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
  const merged: Loadout = {
    ...DEFAULT_LOADOUT,
    ...loadout,
    avatarStyle:
      loadout?.avatarStyle === "avatar-classic"
        ? "avatar-neutral"
        : loadout?.avatarStyle ?? DEFAULT_LOADOUT.avatarStyle,
  };
  (Object.keys(DEFAULT_LOADOUT) as (keyof Loadout)[]).forEach((key) => {
    const item = getStoreItem(merged[key]);
    if (!item || !isItemOwned(unlocked, item)) {
      merged[key] = DEFAULT_LOADOUT[key];
    }
  });
  return merged;
}

export function isFilterUnlocked(unlocked: string[], filterId: string) {
  const item = getStoreItem(filterId);
  if (!item) return false;
  return isItemOwned(unlocked, item);
}

export function isOverlayUnlocked(unlocked: string[], overlayId: string) {
  return isFilterUnlocked(unlocked, overlayId);
}
