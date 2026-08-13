import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import yorkshireTea from "@/assets/yorkshire-tea.png";
import yorkshireGold from "@/assets/yorkshire-gold.png";
import brewButton from "@/assets/brew-button.png";
import cuppaStrength from "@/assets/cuppa-strength.png";

export const Route = createFileRoute("/brew")({
  head: () => ({
    meta: [
      { title: "Brew Request System | Make Me a Proper Brew" },
      {
        name: "description",
        content: "Pick your blend, set your cuppa strength, and hit BREW to text a proper brew request.",
      },
      { name: "theme-color", content: "#D35D1C" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { property: "og:title", content: "Brew Request System" },
      {
        property: "og:description",
        content: "Pick your blend, set your strength, and send a proper brew request by text.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: BrewRequest,
});

const BREW_SMS_TO = "+447837897146";
const CUPPA_COUNT_KEY = "brew-cuppas-today";

const BREWS = [
  { id: "standard", name: "Yorkshire Tea", img: yorkshireTea },
  { id: "gold", name: "Yorkshire Gold", img: yorkshireGold },
] as const;

const STRENGTHS = [
  { label: "Golden Start" },
  { label: "Light" },
  { label: "Standard" },
  { label: "Strong" },
  { label: "Builder's Strength" },
] as const;

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

function readCuppaCount() {
  try {
    const raw = localStorage.getItem(CUPPA_COUNT_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { date?: string; count?: number };
    return parsed.date === todayStamp() ? (parsed.count ?? 0) : 0;
  } catch {
    return 0;
  }
}

function buildSmsHref(message: string) {
  const body = encodeURIComponent(message);
  const to = BREW_SMS_TO.replace(/[^\d+]/g, "");
  return to ? `sms:${to}?&body=${body}` : `sms:?&body=${body}`;
}

function BrewRequest() {
  const [brew, setBrew] = useState<(typeof BREWS)[number]["id"]>(BREWS[0].id);
  const [strength, setStrength] = useState(2);
  const [pressed, setPressed] = useState(false);
  const [cuppas, setCuppas] = useState(0);

  const selected = BREWS.find((item) => item.id === brew) ?? BREWS[0];
  const strengthMeta = STRENGTHS[strength] ?? STRENGTHS[2];

  useEffect(() => {
    setCuppas(readCuppaCount());
  }, []);

  const handleBrew = async () => {
    const message = `Proper brew request: ${selected.name}, ${strengthMeta.label}. Ta!`;
    const nextCount = cuppas + 1;
    setCuppas(nextCount);
    try {
      localStorage.setItem(CUPPA_COUNT_KEY, JSON.stringify({ date: todayStamp(), count: nextCount }));
    } catch {
      /* ignore quota */
    }

    navigator.vibrate?.(18);

    const href = buildSmsHref(message);
    const mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (mobile) {
      window.location.href = href;
      return;
    }

    try {
      await navigator.clipboard.writeText(message);
      toast("Brew request ready", {
        description: "Copied to clipboard. On your phone, BREW opens a pre-filled text.",
      });
    } catch {
      toast("Brew request", { description: message });
    }
  };

  return (
    <div className="brew-app flex min-h-dvh justify-center bg-brew-orange">
      <main className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col gap-4 overflow-x-hidden px-5 pb-[max(1.4rem,env(safe-area-inset-bottom))] pt-[max(1.15rem,env(safe-area-inset-top))]">
        <header className="shrink-0 text-center">
          <h1 className="brew-display mx-auto max-w-[16ch] text-[clamp(1.7rem,7.4vw,2.05rem)] leading-[1.02] text-brew-ink">
            MAKE ME A PROPER BREW!
          </h1>
        </header>

        <div className="relative mx-auto aspect-square w-[min(16.5rem,78vw)] shrink-0">
          <svg
            viewBox="0 0 200 200"
            className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
            aria-hidden
          >
            <defs>
              <path id="sunshine-arc" d="M 24,142 A 82,82 0 1,1 176,142" fill="none" />
            </defs>
            <text
              fill="#1C1209"
              fontFamily="'Alfa Slab One', Rockwell, serif"
              fontSize="11.5"
              letterSpacing="1.8"
            >
              <textPath href="#sunshine-arc" startOffset="50%" textAnchor="middle">
                SUNSHINE REQUEST SYSTEM
              </textPath>
            </text>
          </svg>
          <button
            type="button"
            aria-label={`Send brew request for ${selected.name}, ${strengthMeta.label}`}
            onPointerDown={() => setPressed(true)}
            onPointerUp={() => setPressed(false)}
            onPointerCancel={() => setPressed(false)}
            onPointerLeave={() => setPressed(false)}
            onClick={() => void handleBrew()}
            className={cn(
              "absolute left-1/2 top-1/2 z-10 w-[72%] -translate-x-1/2 -translate-y-1/2 border-0 bg-transparent p-0 transition-transform duration-100",
              pressed && "translate-y-[calc(-50%+4px)] scale-[0.97]",
            )}
          >
            <img src={brewButton} alt="BREW" draggable={false} className="h-auto w-full select-none" />
          </button>
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-3">
          {BREWS.map((item) => {
            const active = brew === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                aria-label={`Choose ${item.name}`}
                onClick={() => setBrew(item.id)}
                className={cn(
                  "aspect-[11/9] overflow-hidden border-0 bg-transparent p-0",
                  active ? "opacity-100" : "opacity-55",
                )}
              >
                <img
                  src={item.img}
                  alt={`${item.name} box`}
                  draggable={false}
                  className="h-full w-full object-cover"
                />
              </button>
            );
          })}
        </div>

        <section className="relative shrink-0">
          <img
            src={cuppaStrength}
            alt="Cuppa Strength"
            draggable={false}
            className="h-auto w-full select-none"
          />
          <div className="absolute inset-x-[5%] top-[16%] bottom-[34%] grid grid-cols-5">
            {STRENGTHS.map((item, index) => (
              <button
                key={item.label}
                type="button"
                aria-label={item.label}
                aria-pressed={strength === index}
                onClick={() => setStrength(index)}
                className="h-full w-full border-0 bg-transparent p-0"
              />
            ))}
          </div>
          <label className="absolute inset-x-[7%] bottom-[8%] block h-10">
            <span className="sr-only">Cuppa strength</span>
            <input
              type="range"
              min={0}
              max={STRENGTHS.length - 1}
              step={1}
              value={strength}
              onChange={(event) => setStrength(Number(event.target.value))}
              className="h-full w-full cursor-pointer appearance-none bg-transparent opacity-0"
            />
          </label>
        </section>

        <footer className="shrink-0 pt-1 text-center">
          <p className="flex items-center justify-center gap-2.5 text-[1.05rem] font-semibold tracking-[0.04em] text-brew-ink">
            <span className="inline-block size-3 rounded-full bg-brew-sun shadow-[0_0_8px_rgba(245,197,24,0.8)]" />
            Kettle on standby
          </p>
          <p className="mt-1.5 text-[0.98rem] font-medium text-brew-ink">
            Cuppas requested today: {cuppas}
          </p>
          <svg viewBox="0 0 24 28" className="mx-auto mt-3 h-7 w-6 text-brew-sun" aria-hidden>
            <path fill="currentColor" d="M13.2 0 3 15.4h7.1L8.2 28 21 10.8h-7.4L13.2 0Z" />
          </svg>
          <p className="brew-serif mt-1.5 text-[1.4rem] leading-tight text-brew-ink">
            Powered by Yorkshire Tea
          </p>
        </footer>
      </main>
    </div>
  );
}
