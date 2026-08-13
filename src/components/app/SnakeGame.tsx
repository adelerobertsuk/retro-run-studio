import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { playSfx } from "@/lib/audio";

const COLS = 20;
const ROWS = 12;
const CELL = 16;
const W = COLS * CELL;
const H = ROWS * CELL;
const STEP_MS = 190;

type P = { x: number; y: number };
type Dir = "up" | "down" | "left" | "right";

const DELTA: Record<Dir, P> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
const OPPOSITE: Record<Dir, Dir> = { up: "down", down: "up", left: "right", right: "left" };

function randomFood(snake: P[]): P {
  for (let i = 0; i < 200; i++) {
    const f = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    if (!snake.some((s) => s.x === f.x && s.y === f.y)) return f;
  }
  return { x: 0, y: 0 };
}

/** Classic neon-synthwave Snake, playable with swipes, taps or arrow keys. */
export function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snakeRef = useRef<P[]>([
    { x: 6, y: 6 },
    { x: 5, y: 6 },
    { x: 4, y: 6 },
  ]);
  const dirRef = useRef<Dir>("right");
  const queuedRef = useRef<Dir | null>(null);
  const foodRef = useRef<P>({ x: 13, y: 6 });
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0);
  const [best, setBest] = useState(0);
  const [running, setRunning] = useState(false);
  const [dead, setDead] = useState(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.imageSmoothingEnabled = false;

    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#150b2e");
    bg.addColorStop(1, "#06050f");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "rgba(99,102,241,0.18)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL + 0.5, 0);
      ctx.lineTo(x * CELL + 0.5, H);
      ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL + 0.5);
      ctx.lineTo(W, y * CELL + 0.5);
      ctx.stroke();
    }

    const food = foodRef.current;
    ctx.fillStyle = "#f472b6";
    ctx.fillRect(food.x * CELL + 3, food.y * CELL + 3, CELL - 6, CELL - 6);

    snakeRef.current.forEach((seg, i) => {
      ctx.fillStyle = i === 0 ? "#a7f3d0" : i % 2 === 0 ? "#10b981" : "#22d3ee";
      ctx.fillRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2);
    });
  }, []);

  const reset = useCallback(() => {
    snakeRef.current = [
      { x: 6, y: 6 },
      { x: 5, y: 6 },
      { x: 4, y: 6 },
    ];
    dirRef.current = "right";
    queuedRef.current = null;
    foodRef.current = randomFood(snakeRef.current);
    setScore(0);
    setDead(false);
    setRunning(true);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = W * 2 * dpr;
    canvas.height = H * 2 * dpr;
    const ctx = canvas.getContext("2d");
    ctx?.setTransform(2 * dpr, 0, 0, 2 * dpr, 0, 0);
    draw();
  }, [draw]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const queued = queuedRef.current;
      if (queued && queued !== OPPOSITE[dirRef.current]) dirRef.current = queued;
      queuedRef.current = null;

      const snake = snakeRef.current;
      const head = snake[0]!;
      const d = DELTA[dirRef.current];
      const next = {
        x: (head.x + d.x + COLS) % COLS,
        y: (head.y + d.y + ROWS) % ROWS,
      };
      if (snake.some((s) => s.x === next.x && s.y === next.y)) {
        setRunning(false);
        setDead(true);
        setBest((b) => Math.max(b, score));
        playSfx("tap");
        return;
      }
      const grew = next.x === foodRef.current.x && next.y === foodRef.current.y;
      const body = [next, ...snake];
      if (grew) {
        foodRef.current = randomFood(body);
        setScore((s) => s + 1);
        playSfx("jump");
      } else {
        body.pop();
      }
      snakeRef.current = body;
      draw();
    }, STEP_MS);
    return () => window.clearInterval(id);
  }, [running, draw, score]);

  const turn = useCallback((dir: Dir) => {
    queuedRef.current = dir;
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
      };
      const dir = map[e.key];
      if (!dir) return;
      e.preventDefault();
      turn(dir);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [turn]);

  const touchRef = useRef<P | null>(null);

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-elevated shadow-[var(--shadow-card)]">
        <canvas
          ref={canvasRef}
          className="pixelated block h-auto w-full touch-none"
          style={{ aspectRatio: `${W} / ${H}` }}
          role="img"
          aria-label="Neon synthwave snake game board"
          onPointerDown={(e) => {
            touchRef.current = { x: e.clientX, y: e.clientY };
          }}
          onPointerUp={(e) => {
            const start = touchRef.current;
            touchRef.current = null;
            if (!start) return;
            const dx = e.clientX - start.x;
            const dy = e.clientY - start.y;
            if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return;
            turn(
              Math.abs(dx) > Math.abs(dy)
                ? dx > 0
                  ? "right"
                  : "left"
                : dy > 0
                  ? "down"
                  : "up",
            );
          }}
        />
        <div className="absolute inset-x-0 top-0 flex justify-between p-3">
          <span className="rounded-full bg-background/70 px-2.5 py-1 font-pixel text-[8px] leading-none text-accent-glow backdrop-blur">
            SNAKE
          </span>
          <span className="rounded-full bg-background/70 px-2.5 py-1 font-pixel text-[8px] leading-none text-hud backdrop-blur">
            SCORE {score} · BEST {best}
          </span>
        </div>
        {!running && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/70 backdrop-blur-sm">
            <p className="font-pixel text-[10px] text-primary">
              {dead ? "GAME OVER" : "READY?"}
            </p>
            <button
              type="button"
              onClick={() => {
                playSfx("tap");
                reset();
              }}
              className="rounded-full bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground"
            >
              {dead ? "Play again" : "Start snake"}
            </button>
          </div>
        )}
      </div>

      <div className="mx-auto grid w-[168px] grid-cols-3 gap-1.5">
        <span />
        <ControlButton label="Up" onPress={() => turn("up")} glyph="▲" />
        <span />
        <ControlButton label="Left" onPress={() => turn("left")} glyph="◀" />
        <ControlButton label="Down" onPress={() => turn("down")} glyph="▼" />
        <ControlButton label="Right" onPress={() => turn("right")} glyph="▶" />
      </div>
    </div>
  );
}

function ControlButton({
  label,
  glyph,
  onPress,
}: {
  label: string;
  glyph: string;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onPress}
      className="rounded-xl border border-border bg-surface py-2 text-[13px] text-accent-glow transition-colors hover:bg-elevated"
    >
      {glyph}
    </button>
  );
}
