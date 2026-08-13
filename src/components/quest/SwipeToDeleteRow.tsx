import { useRef, useState, type ReactNode } from "react";
import { Trash2 } from "lucide-react";

const REVEAL_WIDTH = 72;
const OPEN_THRESHOLD = 36;

type Props = {
  onDelete: () => void;
  deleteLabel: string;
  children: ReactNode;
  className?: string;
};

/** Swipe left to reveal a delete action — keeps list rows aligned when closed. */
export function SwipeToDeleteRow({ onDelete, deleteLabel, children, className = "" }: Props) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const startOffset = useRef(0);
  const moved = useRef(false);
  const draggingRef = useRef(false);

  const snap = (value: number) => (value < -OPEN_THRESHOLD ? -REVEAL_WIDTH : 0);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    startX.current = e.clientX;
    startOffset.current = offset;
    moved.current = false;
    draggingRef.current = true;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const delta = e.clientX - startX.current;
    if (Math.abs(delta) > 6) moved.current = true;
    setOffset(Math.min(0, Math.max(-REVEAL_WIDTH, startOffset.current + delta)));
  };

  const finishDrag = () => {
    draggingRef.current = false;
    setDragging(false);
    setOffset((cur) => snap(cur));
  };

  const onContentClickCapture = (e: React.MouseEvent) => {
    if (moved.current) {
      e.preventDefault();
      e.stopPropagation();
      moved.current = false;
      return;
    }
    if (offset < 0) {
      e.preventDefault();
      e.stopPropagation();
      setOffset(0);
    }
  };

  const handleDelete = () => {
    setOffset(0);
    onDelete();
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div
        className="absolute inset-y-0 right-0 flex w-[72px] items-center justify-center bg-destructive"
        aria-hidden={offset === 0}
      >
        <button
          type="button"
          aria-label={deleteLabel}
          onClick={handleDelete}
          className="flex size-full items-center justify-center text-destructive-foreground transition-opacity hover:opacity-90"
        >
          <Trash2 className="size-4" strokeWidth={2} />
        </button>
      </div>

      <div
        className={`relative touch-pan-y ${dragging ? "" : "transition-transform duration-200 ease-out"}`}
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onClickCapture={onContentClickCapture}
      >
        {children}
      </div>
    </div>
  );
}
