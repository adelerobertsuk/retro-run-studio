import type { Palette } from "@/components/app/pixel-scene";
import { DEFAULT_PALETTE } from "@/components/app/pixel-scene";

/** Pull a rough outfit palette out of an uploaded workout photo. */
export async function paletteFromImage(file: File): Promise<Palette> {
  const bitmap = await createImageBitmap(file);
  const c = document.createElement("canvas");
  c.width = 32;
  c.height = 32;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, 32, 32);
  const sample = (sx: number, sy: number, sw: number, sh: number) => {
    const { data } = ctx.getImageData(sx, sy, sw, sh);
    let r = 0;
    let g = 0;
    let b = 0;
    const n = data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
      r += data[i]!;
      g += data[i + 1]!;
      b += data[i + 2]!;
    }
    return `rgb(${Math.round(r / n)}, ${Math.round(g / n)}, ${Math.round(b / n)})`;
  };
  return {
    hair: sample(10, 2, 12, 6),
    skinTone: sample(12, 10, 8, 6),
    shirt: sample(6, 18, 20, 8),
    shorts: sample(8, 26, 16, 5),
    shoes: "#f8fafc",
  };
}

export async function paletteFromUrl(url: string): Promise<Palette> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.crossOrigin = "anonymous";
    el.src = url;
  });
  const c = document.createElement("canvas");
  c.width = 32;
  c.height = 32;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0, 32, 32);
  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.9));
  if (!blob) return DEFAULT_PALETTE;
  return paletteFromImage(new File([blob], "palette.jpg", { type: "image/jpeg" }));
}
