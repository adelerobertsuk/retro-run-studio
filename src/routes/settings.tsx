import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Radio } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { RunnerLevelCard } from "@/components/app/RunnerLevelCard";
import { WorkoutDataSettings } from "@/components/settings/WorkoutDataSettings";
import { useGameState, type BooleanSettingKey, type GameState } from "@/lib/game-state";
import { playSfx, setAudioMutedWithFeedback } from "@/lib/audio";
import { ROADMAP_FEATURES } from "@/lib/roadmap";
import { getGladiatorStatusFromActivity } from "@/lib/gladiator-titles";

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

const ROWS: { key: BooleanSettingKey; label: string }[] = [
  { key: "notifications", label: "Notifications" },
  { key: "avatarConsent", label: "AI Avatar Consent" },
  { key: "audio", label: "Retro Arcade Sound" },
];

function SettingsPage() {
  const { state, toggleSetting, updateProfile, setHomeGame } = useGameState();
  const { profile } = state;
  const runner = getGladiatorStatusFromActivity(state);

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
          {profile.name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() || "8B"}
        </div>
        <div>
            <p className="text-[16px] font-semibold text-foreground">{profile.name}</p>
            <p className="text-[12px] font-medium text-primary">{runner.title}</p>
            <p className="text-[11px] text-muted-foreground">
              Runner Lv {runner.level} · {runner.xp.toLocaleString()} XP ·{" "}
              {state.tokens.toLocaleString()} tokens
            </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="flex items-center justify-between gap-4 px-4 py-3.5">
          <div>
            <p className="text-[14px] font-medium text-foreground">Auto-sync profile</p>
          </div>
          <Switch
            checked={profile.autoSync}
            onCheckedChange={(v) => {
              playSfx("tap");
              updateProfile({ autoSync: v });
            }}
            aria-label="Auto-sync profile"
          />
        </div>
        {!profile.autoSync && (
          <div className="space-y-3 border-t border-border px-4 py-3.5">
            <div>
              <label htmlFor="profile-name" className="text-[12px] text-muted-foreground">
                Display name
              </label>
              <input
                id="profile-name"
                value={profile.name}
                onChange={(e) => updateProfile({ name: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-border bg-elevated px-3 py-2.5 text-[14px] text-foreground outline-none focus:border-primary/60"
              />
            </div>
            <div>
              <label htmlFor="profile-city" className="text-[12px] text-muted-foreground">
                Home city
              </label>
              <input
                id="profile-city"
                value={profile.homeCity}
                onChange={(e) => updateProfile({ homeCity: e.target.value })}
                className="mt-1.5 w-full rounded-xl border border-border bg-elevated px-3 py-2.5 text-[14px] text-foreground outline-none focus:border-primary/60"
              />
            </div>
          </div>
        )}
      </section>

      <RunnerLevelCard />

      <WorkoutDataSettings />

      <section className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="px-4 py-3.5">
          <p className="text-[14px] font-medium text-foreground">Home screen game</p>
          <div className="mt-3 grid grid-cols-2 gap-1.5 rounded-xl bg-elevated p-1">
            {(
              [
                { id: "jumpman", label: "Jumpman" },
                { id: "snake", label: "Snake" },
              ] as const
            ).map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => {
                  playSfx("tap");
                  setHomeGame(g.id);
                }}
                aria-pressed={state.homeGame === g.id}
                className={`rounded-lg py-2 text-[13px] font-medium transition-colors ${
                  state.homeGame === g.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
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
            </div>
            <Switch
              checked={state.settings[row.key]}
              onCheckedChange={() => {
                if (row.key === "audio") {
                  const enabling = !state.settings.audio;
                  toggleSetting("audio");
                  setAudioMutedWithFeedback(!enabling, enabling);
                  if (enabling) playSfx("complete");
                  return;
                }
                playSfx("tap");
                toggleSetting(row.key);
              }}
              aria-label={row.label}
            />
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-dashed border-accent/35 bg-surface">
        <div className="border-b border-border px-4 py-3.5">
          <p className="font-pixel text-[8px] tracking-[0.16em] text-accent-glow">COMING SOON</p>
          <p className="mt-1 text-[14px] font-semibold text-foreground">Feature roadmap</p>
        </div>
        {ROADMAP_FEATURES.map((feature) => (
          <div key={feature.id} className="border-t border-border px-4 py-3.5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent-glow">
                <Radio className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-foreground">{feature.title}</p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">{feature.summary}</p>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-border bg-surface px-4 py-3.5">
        <Link to="/media" className="flex items-center justify-between text-[14px] font-medium text-foreground">
          Media Lab overlays
          <span className="text-[13px] font-semibold text-primary">Open →</span>
        </Link>
      </section>

      <p className="px-1 text-center text-[11px] text-muted-foreground">
        8-Bit Runner v1.0 · Activity data powered by Strava
      </p>
    </div>
  );
}
