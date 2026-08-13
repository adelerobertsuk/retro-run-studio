import { playSfx } from "@/lib/audio";
import type { MediaExportMode } from "@/lib/synthwave-overlay";

const MODES: { id: MediaExportMode; label: string }[] = [
  { id: "gamer", label: "The Gamer" },
  { id: "aesthetic", label: "The Aesthetic" },
];

type Props = {
  mode: MediaExportMode;
  onChange: (mode: MediaExportMode) => void;
};

export function ExportModeToggle({ mode, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-border bg-surface p-1">
      {MODES.map((m) => {
        const active = mode === m.id;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              if (m.id !== mode) {
                playSfx("tap");
                onChange(m.id);
              }
            }}
            className={`rounded-xl px-2 py-2.5 text-center text-[13px] font-semibold transition-colors ${
              active
                ? "bg-elevated text-foreground shadow-[var(--shadow-card)] ring-1 ring-primary/25"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
