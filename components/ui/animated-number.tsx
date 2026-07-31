"use client";

import { useEffect, useRef, useState } from "react";

const easeOutQuad = (t: number) => t * (2 - t);

/** Counts up from 0 to `value` on mount — respects prefers-reduced-motion. */
export function AnimatedNumber({
  value,
  duration = 600,
}: {
  value: number;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Reading matchMedia during render would crash on the server (no
      // `window`) — same hydration-safe pattern as theme-toggle.tsx.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplay(value);
      return;
    }

    const start = performance.now();
    const from = 0;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      setDisplay(Math.round(from + (value - from) * easeOutQuad(progress)));
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
    }
    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-running on `duration` changes would restart the count for no reason; it's a static prop in practice.
  }, [value]);

  return <>{display}</>;
}
