import { Link, useRouterState } from "@tanstack/react-router";
import { Gamepad2, Home, Sparkles, Swords, User, Volume2, VolumeX } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";
import { playPageLoadBleep, playSfx, setAudioMutedWithFeedback } from "@/lib/audio";
import { useGameState } from "@/lib/game-state";

const TABS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/quest", label: "Quest", icon: Swords },
  { to: "/media", label: "Media Lab", icon: Sparkles },
  { to: "/arcade", label: "Arcade", icon: Gamepad2 },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { state, toggleSetting } = useGameState();
  const soundOn = state.settings.audio;
  const prevPath = useRef(pathname);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      prevPath.current = pathname;
      return;
    }
    if (prevPath.current !== pathname) {
      prevPath.current = pathname;
      playPageLoadBleep();
    }
  }, [pathname]);

  const toggleSound = () => {
    const enabling = !soundOn;
    toggleSetting("audio");
    setAudioMutedWithFeedback(!enabling, enabling);
    if (enabling) playSfx("complete");
  };

  return (
    <div className="min-h-screen bg-[oklch(0.16_0.03_265)] sm:flex sm:items-center sm:justify-center sm:py-8">
      <div className="relative mx-auto flex min-h-screen w-full max-w-[430px] flex-col overflow-hidden bg-background sm:min-h-[860px] sm:rounded-[2.75rem] sm:border sm:border-border sm:shadow-[0_40px_90px_-40px_oklch(0_0_0/90%)]">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-[var(--header-bg)] px-5 pb-3 pt-6">
          <div className="min-w-0">
            <h1 className="truncate font-pixel text-[13px] leading-none text-primary [text-shadow:0_2px_0_oklch(0.45_0.19_275),0_4px_0_oklch(0.28_0.12_275)]">
              8-BIT RUNNER
            </h1>
            <p className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {TABS.find((t) => t.to === pathname)?.label ?? "Settings"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={toggleSound}
              aria-label={soundOn ? "Mute retro arcade sound" : "Enable retro arcade sound"}
              aria-pressed={soundOn}
              className={`flex size-10 items-center justify-center rounded-full border transition-colors ${
                soundOn
                  ? "border-primary/50 bg-primary/15 text-primary"
                  : "border-border bg-surface text-muted-foreground hover:text-foreground"
              }`}
            >
              {soundOn ? <Volume2 className="size-[18px]" /> : <VolumeX className="size-[18px]" />}
            </button>
            <Link
              to="/settings"
              aria-label="Open settings"
              className="flex size-10 items-center justify-center rounded-full border border-border bg-surface text-muted-foreground transition-colors hover:text-foreground"
            >
              <User className="size-[18px]" />
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-28">{children}</main>

        <nav className="absolute inset-x-0 bottom-0 z-20 border-t border-border bg-background/90 px-2 pb-6 pt-2 backdrop-blur-xl">
          <ul className="flex items-stretch justify-around">
            {TABS.map(({ to, label, icon: Icon }) => (
              <li key={to} className="flex-1">
                <Link
                  to={to}
                  activeOptions={{ exact: to === "/" }}
                  onClick={() => playSfx("tab")}
                  className="group flex flex-col items-center gap-1 rounded-xl py-1.5 text-muted-foreground transition-colors data-[status=active]:text-primary"
                >
                  <Icon className="size-[22px]" strokeWidth={2} />
                  <span className="text-[10px] font-medium tracking-tight">{label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
