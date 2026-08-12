import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useGameState, type GameState } from "@/lib/game-state";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — 8-Bit Runner" },
      {
        name: "description",
        content:
          "Manage notifications, Strava account sync, AI avatar consent and audio for 8-Bit Runner.",
      },
      { property: "og:title", content: "Settings — 8-Bit Runner" },
      {
        property: "og:description",
        content: "Notifications, Strava sync, AI avatar consent and audio preferences.",
      },
    ],
  }),
  component: SettingsPage,
});

const ROWS: { key: keyof GameState["settings"]; label: string; detail: string }[] = [
  { key: "notifications", label: "Notifications", detail: "Streak reminders and quest alerts" },
  { key: "stravaSync", label: "Strava Account Sync", detail: "Powered by Strava" },
  { key: "avatarConsent", label: "AI Avatar Consent", detail: "Allow photos to be stylized by AI" },
  { key: "audio", label: "Audio", detail: "Chiptune soundtrack and effects" },
];

function SettingsPage() {
  const { state, toggleSetting } = useGameState();

  return (
    <div className="space-y-6 px-5 py-5">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-[14px] font-medium text-primary"
      >
        <ChevronLeft className="size-4" />
        Home
      </Link>

      <section className="flex items-center gap-3.5 rounded-2xl border border-border bg-surface p-4">
        <div className="flex size-14 items-center justify-center rounded-full bg-accent/20 text-[18px] font-semibold text-accent-glow">
          AR
        </div>
        <div>
          <p className="text-[16px] font-semibold text-foreground">Adele Roberts</p>
          <p className="text-[12px] text-muted-foreground">
            Level {Math.floor(state.tokens / 100) + 1} Adventurer ·{" "}
            {state.tokens.toLocaleString()} tokens
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface">
        {ROWS.map((row, i) => (
          <div
            key={row.key}
            className={`flex items-center justify-between gap-4 px-4 py-3.5 ${
              i > 0 ? "border-t border-border" : ""
            }`}
          >
            <div>
              <p className="text-[14px] font-medium text-foreground">{row.label}</p>
              <p className="text-[12px] text-muted-foreground">{row.detail}</p>
            </div>
            <Switch
              checked={state.settings[row.key]}
              onCheckedChange={() => toggleSetting(row.key)}
              aria-label={row.label}
            />
          </div>
        ))}
      </section>

      <p className="px-1 text-center text-[11px] text-muted-foreground">
        8-Bit Runner v1.0 · Activity data powered by Strava
      </p>
    </div>
  );
}
