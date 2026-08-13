import { toast } from "sonner";

function downloadBlob(blob: Blob, filename: string): boolean {
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
}

/** Save an image or video blob to the device gallery (share sheet on mobile, download elsewhere). */
export async function saveBlobToGallery(blob: Blob, filename: string): Promise<boolean> {
  if (!blob.size) {
    toast.error("Nothing to save yet");
    return false;
  }

  const type = blob.type || "application/octet-stream";
  const file = new File([blob], filename, { type });

  if (typeof navigator.share === "function" && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "8-Bit Runner" });
      toast.success("Ready to share");
      return true;
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return false;
    }
  }

  if (downloadBlob(blob, filename)) {
    toast.success("Saved to downloads");
    return true;
  }

  toast.error("Could not save file");
  return false;
}

export async function saveDataUrlToGallery(dataUrl: string, filename: string): Promise<boolean> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return saveBlobToGallery(blob, filename);
}

/**
 * Open the native share sheet when available, otherwise download the asset.
 */
export async function shareToInstagramTikTok(blob: Blob, filename: string): Promise<boolean> {
  return saveBlobToGallery(blob, filename);
}

export async function shareDataUrlToInstagramTikTok(
  dataUrl: string,
  filename: string,
): Promise<boolean> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return shareToInstagramTikTok(blob, filename);
}

/** @deprecated Prefer shareDataUrlToInstagramTikTok */
export async function saveDataUrlToGalleryWithToast(
  dataUrl: string,
  filename: string,
): Promise<void> {
  await shareDataUrlToInstagramTikTok(dataUrl, filename);
}

/** @deprecated Prefer shareToInstagramTikTok */
export async function saveBlobToGalleryWithToast(blob: Blob, filename: string): Promise<void> {
  await shareToInstagramTikTok(blob, filename);
}
