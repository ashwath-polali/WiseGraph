"use client";

import { useEffect, useState } from "react";
import { animate } from "motion/react";

const ENTER = [0.22, 1, 0.36, 1] as const;

/**
 * A score that counts up to its value on mount. Starts from a deterministic
 * lower number (computed the same on server and client, so no hydration
 * mismatch and no downward jump) and eases up to the real score.
 */
export function AnimatedScore({
  value,
  className,
  duration = 0.7,
  delay = 0,
}: {
  value: number;
  className?: string;
  duration?: number;
  delay?: number;
}) {
  const from = Math.max(60, value - Math.min(18, Math.round(value * 0.14)));
  const [display, setDisplay] = useState(from);

  useEffect(() => {
    const controls = animate(from, value, {
      duration,
      delay,
      ease: ENTER,
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
    // re-run if the target score changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span className={className} data-numeric>
      {display}
    </span>
  );
}
