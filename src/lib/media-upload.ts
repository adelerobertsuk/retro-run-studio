/** Helpers for Strava workout photo / video uploads. */

export function extractVideoFrame(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    const url = URL.createObjectURL(file);
    video.onloadeddata = () => {
      video.currentTime = Math.min(0.5, video.duration / 4);
    };
    video.onseeked = () => {
      const c = document.createElement("canvas");
      c.width = video.videoWidth || 720;
      c.height = video.videoHeight || 1280;
      const ctx = c.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("canvas unavailable"));
        return;
      }
      ctx.drawImage(video, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.9));
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("video load failed"));
    };
    video.src = url;
  });
}

export async function workoutMediaToImageUrl(file: File): Promise<string> {
  if (file.type.startsWith("video/")) return extractVideoFrame(file);
  return URL.createObjectURL(file);
}
