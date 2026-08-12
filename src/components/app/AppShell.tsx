import { Link, useRouterState } from "@tanstack/react-router";
import { Gamepad2, Home, Sparkles, Swords, User } from "lucide-react";
import type { ReactNode } from "react";
import { playSfx } from "@/lib/audio";

const TABS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/quest", label: "Quest", icon: Swords },
  { to: "/media", label: "Media Lab", icon: Sparkles },
  { to: "/arcade", label: "Arcade", icon: Gamepad2 },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-[oklch(0.16_0.03_265)] sm:flex sm:items-center sm:justify-center sm:py-8">
      <div className="relative mx-auto flex min-h-screen w-full max-w-[430px] flex-col overflow-hidden bg-background sm:min-h-[860px] sm:rounded-[2.75rem] sm:border sm:border-border sm:shadow-[0_40px_90px_-40px_oklch(0_0_0/90%)]">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/85 px-5 pb-3 pt-6 backdrop-blur-xl">
          <p className="text-[17px] font-semibold tracking-tight text-foreground">
            {TABS.find((t) => t.to === pathname)?.label ?? "Settings"}
          </p>
          <Link
            to="/settings"
            aria-label="Open settings"
            className="flex size-10 items-center justify-center rounded-full border border-border bg-surface text-muted-foreground transition-colors hover:text-foreground"
          >
            <User className="size-[18px]" />
          </Link>
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
