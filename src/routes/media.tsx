import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PhotoCards } from "@/components/media/PhotoCards";
import { VideoStudio } from "@/components/media/VideoStudio";
import { useGameState } from "@/lib/game-state";

export const Route = createFileRoute("/media")({
  head: () => ({
    meta: [
      { title: "Media Lab — 8-Bit Runner Hero Generator" },
      {
        name: "description",
        content:
          "Turn your runs into vertical 8-bit arcade videos and HD retro trading cards ready for TikTok and Reels.",
      },
      { property: "og:title", content: "Media Lab — 8-Bit Runner Hero Generator" },
      {
        property: "og:description",
        content: "Vertical 9:16 arcade videos and HD retro trading cards from your run data.",
      },
    ],
  }),
  component: MediaPage,
});

function MediaPage() {
  const { state } = useGameState();
  const [tab, setTab] = useState<"video" | "cards">("video");
  const run = state.runs[0];
  const totalMiles = state.runs.reduce((s, r) => s + r.miles, 0);

  if (!run) return null;

  return (
    <div className="space-y-5 px-5 py-5">
      <div className="grid grid-cols-2 gap-1 rounded-2xl border border-border bg-surface p-1">
        {(["video", "cards"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-xl py-2 text-[13px] font-medium transition-colors ${
              tab === key
                ? "bg-elevated text-foreground shadow-[var(--shadow-card)]"
                : "text-muted-foreground"
            }`}
          >
            {key === "video" ? "'80s Video Cam" : "'80s Photo Booth"}
          </button>
        ))}
      </div>

      <div>
        <h2 className="text-[15px] font-semibold text-foreground">
          {tab === "video" ? "'80s Video Cam" : "'80s Photo Booth"}
        </h2>
        <p className="mt-0.5 text-[12px] text-muted-foreground">
          {tab === "video"
            ? `Camcorder filters and REC stamp · ${run.title} · ${run.miles.toFixed(2)} mi`
            : "80s camera filters that transform your selfie into 8-bit character art."}
        </p>
      </div>

      {tab === "video" ? (
        <VideoStudio run={run} totalMiles={totalMiles} />
      ) : (
        <PhotoCards run={run} />
      )}
    </div>
  );
}
