import { useEffect, useState } from "react";

/** Types out a string one character at a time with a blinking block cursor. */
export function TypingText({
  text,
  speed = 70,
  className = "",
  cursorClassName = "",
}: {
  text: string;
  speed?: number;
  className?: string;
  cursorClassName?: string;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(0);
    const id = window.setInterval(() => {
      setCount((c) => {
        if (c >= text.length) {
          window.clearInterval(id);
          return c;
        }
        return c + 1;
      });
    }, speed);
    return () => window.clearInterval(id);
  }, [text, speed]);

  return (
    <span className={className} aria-label={text}>
      <span aria-hidden>{text.slice(0, count)}</span>
      <span className={`animate-pulse ${cursorClassName}`} aria-hidden>
        _
      </span>
    </span>
  );
}
