import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Camera, Clapperboard, Layers } from "lucide-react";
import { ArcadeOverlayStudio } from "@/components/media/ArcadeOverlayStudio";
import { PhotoCards } from "@/components/media/PhotoCards";
import { VideoStudio } from "@/components/media/VideoStudio";
import { playSfx } from "@/lib/audio";
import { useGameState } from "@/lib/game-state";

export const Route = createFileRoute("/media")({
  head: () => ({
    meta: [
      { title: "Media Lab — 8-Bit Runner" },
      {
        name: "description",
        content:
          "Dazz Cam video, photo booth exports, arcade overlay stickers, and 80s quote PNGs.",
      },
      { property: "og:title", content: "Media Lab — 8-Bit Runner" },
      {
        property: "og:description",
        content: "Vintage film filters, route animations, and transparent arcade stickers.",
      },
    ],
  }),
  component: MediaPage,
});

type MediaTab = "video" | "cards" | "overlays";

const TABS: { id: MediaTab; label: string; icon: typeof Camera }[] = [
  { id: "video", label: "Video Cam", icon: Clapperboard },
  { id: "cards", label: "Photo Booth", icon: Camera },
  { id: "overlays", label: "Overlays", icon: Layers },
];

function NoRunHint({ onOverlays }: { onOverlays: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface px-4 py-8 text-center">
      <p className="text-[14px] font-medium text-foreground">Log a run first</p>
      <button
        type="button"
        onClick={onOverlays}
        className="mt-4 text-[13px] font-semibold text-primary"
      >
        Overlays →
      </button>
    </div>
  );
}

function MediaPage() {
  const { state } = useGameState();
  const [tab, setTab] = useState<MediaTab>("video");
  const run = state.runs[0];

  return (
    <div className="space-y-5 px-5 py-5">
      <header>
        <h1 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-glow">
          Media Lab
        </h1>
      </header>

      <div className="relative -mx-1">
        <div className="flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  if (id !== tab) {
                    playSfx("tap");
                    setTab(id);
                  }
                }}
                className={`flex shrink-0 items-center gap-2 rounded-2xl border px-3.5 py-2.5 transition-colors ${
                  active
                    ? "border-primary/45 bg-primary/15 text-foreground"
                    : "border-border bg-surface text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`size-4 ${active ? "text-primary" : ""}`} />
                <span className="text-[12px] font-semibold">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {tab === "video" &&
        (run ? <VideoStudio run={run} /> : <NoRunHint onOverlays={() => setTab("overlays")} />)}
      {tab === "cards" &&
        (run ? <PhotoCards run={run} /> : <NoRunHint onOverlays={() => setTab("overlays")} />)}
      {tab === "overlays" && <ArcadeOverlayStudio />}
    </div>
  );
}
