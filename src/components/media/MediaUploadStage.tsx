import type { ReactNode } from "react";
import { Upload } from "lucide-react";

type Props = {
  hasMedia: boolean;
  mediaPreview?: ReactNode;
  accept: string;
  onFile: (file: File) => void;
  emptyLabel: string;
  children: ReactNode;
};

/** Canvas/stage wrapper — tap the empty placeholder to upload media. */
export function MediaUploadStage({
  hasMedia,
  accept,
  onFile,
  emptyLabel,
  children,
}: Props) {
  return (
    <div className="relative mx-auto aspect-[9/16] w-full max-w-[300px] overflow-hidden rounded-3xl border border-border bg-black shadow-[var(--shadow-card)]">
      {children}

      {!hasMedia && (
        <label className="absolute inset-0 z-10 flex cursor-pointer flex-col items-center justify-center gap-2 bg-[#05060f]/88 backdrop-blur-[2px] transition-colors hover:bg-[#05060f]/78">
          <span className="flex size-14 items-center justify-center rounded-2xl border border-primary/35 bg-primary/10 text-primary">
            <Upload className="size-6" />
          </span>
          <span className="text-[13px] font-medium text-muted-foreground">
            {emptyLabel}
          </span>
          <input
            type="file"
            accept={accept}
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFile(file);
            }}
          />
        </label>
      )}

      {hasMedia && (
        <label className="absolute bottom-3 right-3 z-10 cursor-pointer rounded-full border border-border/80 bg-background/80 px-3 py-1.5 text-[11px] font-semibold text-foreground backdrop-blur transition-colors hover:bg-elevated">
          Replace
          <input
            type="file"
            accept={accept}
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFile(file);
            }}
          />
        </label>
      )}
    </div>
  );
}
