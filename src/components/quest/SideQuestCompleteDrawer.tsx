import { useCallback, useEffect, useState } from "react";
import { ImagePlus, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { playSfx } from "@/lib/audio";
import {
  ERRAND_TOKEN_REWARD,
  useGameState,
  type ErrandEntry,
} from "@/lib/game-state";
import {
  coerceErrandEntry,
  composeSimpleQuestCard,
  errandDisplayTitle,
  errandTokenReward,
  sideQuestStats,
  type SideQuestStats,
} from "@/lib/side-quest-card";
import { shareDataUrlToInstagramTikTok } from "@/lib/save-asset";
import { ShareToSocialButton } from "@/components/media/ShareToSocialButton";

function QuestStatBlock({ stats }: { stats: SideQuestStats }) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {(
        [
          ["Vibe", stats.vibe],
          ["Grit", stats.grit],
          ["Snack", stats.snack],
        ] as const
      ).map(([label, value]) => (
        <div
          key={label}
          className="rounded-lg border border-primary/30 bg-white/5 px-1 py-1.5 text-center"
        >
          <p className="text-[8px] font-bold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-0.5 text-[15px] font-bold tabular-nums text-foreground">{value}</p>
        </div>
      ))}
    </div>
  );
}

function QuestFrame({
  title,
  questText,
  tokens,
  photoSrc,
  stats,
}: {
  title: string;
  questText: string;
  tokens: number;
  photoSrc?: string | null;
  stats: SideQuestStats;
}) {
  return (
    <div
      className="relative mx-auto w-full max-w-[240px] overflow-hidden rounded-2xl border-2 border-primary/35 bg-gradient-to-b from-indigo-950/90 to-background/80 p-3.5 backdrop-blur-sm"
      style={{ aspectRatio: "2 / 3" }}
    >
      <div
        className="pointer-events-none absolute inset-3 rounded-xl border border-dashed border-primary/25"
        aria-hidden
      />

      <div className="relative flex h-full flex-col gap-2">
        <p className="text-center font-serif text-[13px] font-bold uppercase leading-tight tracking-wide text-foreground">
          {title}
        </p>

        <QuestStatBlock stats={stats} />

        <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-white/15 bg-indigo-950/60">
          {photoSrc ? (
            <img src={photoSrc} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full min-h-[88px] flex-col items-center justify-center gap-1.5 text-accent-glow/80">
              <Sparkles className="size-5" strokeWidth={2} />
              <span className="text-[10px] font-medium text-muted-foreground">Add a photo</span>
            </div>
          )}
        </div>

        <div className="text-center">
          <p className="text-[11px] leading-relaxed text-muted-foreground">{questText}</p>
          <p className="mt-1 text-[11px] font-semibold tabular-nums text-primary">+{tokens} tokens</p>
        </div>
      </div>
    </div>
  );
}

type Props = {
  errand: ErrandEntry | null;
  onOpenChange: (open: boolean) => void;
  /** View-only mode for completed quests from the journey log. */
  viewOnly?: boolean;
};

export function SideQuestCompleteDrawer({ errand, onOpenChange, viewOnly = false }: Props) {
  const { completeErrand, updateErrandPhoto } = useGameState();
  const [photoSrc, setPhotoSrc] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  const safeErrand = errand ? coerceErrandEntry(errand) : null;
  const previewTitle = safeErrand ? errandDisplayTitle(safeErrand) : "";
  const tokens = safeErrand ? errandTokenReward(safeErrand) : ERRAND_TOKEN_REWARD;
  const stats = safeErrand
    ? sideQuestStats(safeErrand.text, safeErrand.completedAt)
    : { vibe: 0, grit: 0, snack: 0 };

  useEffect(() => {
    if (safeErrand) {
      setPhotoSrc(safeErrand.photoSrc ?? null);
      setPhotoName(safeErrand.photoSrc ? "Saved photo" : null);
    } else {
      setPhotoSrc(null);
      setPhotoName(null);
    }
  }, [safeErrand]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) playSfx("tap");
      onOpenChange(open);
    },
    [onOpenChange],
  );

  const finish = () => {
    if (!safeErrand || viewOnly) return;
    if (
      !completeErrand(safeErrand.id, {
        heroTitle: previewTitle,
        photoSrc: photoSrc ?? undefined,
      })
    ) {
      return;
    }
    playSfx("complete");
    toast.success("Quest complete!", {
      description: `+${ERRAND_TOKEN_REWARD} Arcade Tokens · ${previewTitle}`,
    });
    onOpenChange(false);
  };

  const shareQuest = async () => {
    if (!safeErrand) return;
    setSharing(true);
    try {
      const canvas = document.createElement("canvas");
      const url = await composeSimpleQuestCard(canvas, {
        title: previewTitle,
        questText: safeErrand.text,
        tokens,
        photoSrc,
        stats,
      });
      const shared = await shareDataUrlToInstagramTikTok(
        url,
        `side-quest-${safeErrand.date}.png`,
      );
      if (shared) {
        if (viewOnly && photoSrc && photoSrc !== safeErrand.photoSrc) {
          updateErrandPhoto(safeErrand.id, photoSrc);
        }
        playSfx("complete");
      }
    } catch {
      toast.error("Could not share card");
    } finally {
      setSharing(false);
    }
  };

  return (
    <Drawer open={!!safeErrand} onOpenChange={handleOpenChange} shouldScaleBackground={false}>
      <DrawerContent className="max-h-[88vh] border-border bg-background">
        {safeErrand ? (
          <div className="mx-auto w-full max-w-[430px] overflow-y-auto px-5 pb-8">
            <DrawerHeader className="flex flex-row items-start justify-between gap-3 px-0 text-left">
              <div>
                <DrawerTitle className="text-[19px] tracking-tight text-foreground">
                  {viewOnly ? previewTitle : "Complete your quest"}
                </DrawerTitle>
                <DrawerDescription className="sr-only">{safeErrand.text}</DrawerDescription>
              </div>
              <DrawerClose
                aria-label="Close side quest"
                className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-4" />
              </DrawerClose>
            </DrawerHeader>

            <div className="flex justify-center rounded-2xl border border-border bg-surface/60 p-4">
              <QuestFrame
                title={previewTitle}
                questText={safeErrand.text}
                tokens={tokens}
                photoSrc={photoSrc}
                stats={stats}
              />
            </div>

            <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface py-3.5 text-[13px] font-medium text-foreground transition-colors hover:bg-elevated">
              <ImagePlus className="size-4" />
              {photoName ? "Change photo" : "Add photo"}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  playSfx("tap");
                  const reader = new FileReader();
                  reader.onload = () => {
                    const src = reader.result as string;
                    setPhotoSrc(src);
                    setPhotoName(file.name);
                    if (viewOnly && safeErrand) {
                      updateErrandPhoto(safeErrand.id, src);
                    }
                  };
                  reader.readAsDataURL(file);
                }}
              />
            </label>

            <div className="mt-3">
              <ShareToSocialButton onClick={shareQuest} busy={sharing} />
            </div>

            {!viewOnly && (
              <div className="mt-3 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="flex-1 rounded-2xl border border-border bg-surface py-3 text-[14px] font-semibold text-muted-foreground transition-colors hover:bg-elevated"
                >
                  Not yet
                </button>
                <button
                  type="button"
                  onClick={finish}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-primary/40 bg-primary py-3 text-[14px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Complete quest
                </button>
              </div>
            )}
          </div>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
