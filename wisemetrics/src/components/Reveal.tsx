"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

const ENTER = [0.22, 1, 0.36, 1] as const;

/**
 * Precise scroll-in reveal: content eases up and fades in once, as it enters
 * the viewport. Restrained on purpose (Apple/Linear register). Reduced-motion
 * users get the content immediately via the global media query in globals.css.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 16,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: ENTER, delay }}
    >
      {children}
    </motion.div>
  );
}
