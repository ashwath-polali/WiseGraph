"use client";

import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
} from "motion/react";
import { Button } from "@/components/ui/Button";
import { HeroMorphCanvas } from "@/components/landing/HeroMorphCanvas";

const ENTER = [0.22, 1, 0.36, 1] as const;
const HEADLINE = ["A", "clearer", "way", "to", "read", "assessment", "scores."];

export function HeroStory() {
  const wrapperRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ["start start", "end end"],
  });
  // which phase owns clicks — plain state so we never put a non-interpolatable
  // string MotionValue into a style object (that corrupts opacity binding)
  // Copy crossfades on a discrete phase (CSS transition) while the canvas stays
  // continuously scroll-linked. Deriving opacity from scroll via motion values
  // on the wrappers proved fragile across the phase-state re-renders.
  const [phase, setPhase] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const next = v < 0.3 ? 0 : v < 0.64 ? 1 : 2;
    setPhase((prev) => (prev === next ? prev : next));
  });

  return (
    <section ref={wrapperRef} className="relative h-[300vh]">
      <div className="sticky top-0 flex h-dvh items-center">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-8 px-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
          {/* left column: overlapping phase slides */}
          <div className="relative min-h-[380px]">
            {/* phase 0 — the hero */}
            <div
              className={`absolute inset-x-0 top-0 flex flex-col items-start text-left transition-all duration-500 ease-out ${
                phase === 0
                  ? "translate-y-0 opacity-100"
                  : "pointer-events-none -translate-y-3 opacity-0"
              }`}
            >
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: ENTER }}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-[11px] font-medium tracking-wide text-muted-foreground backdrop-blur-sm"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-psych" />
                For teachers and school psychologists
              </motion.p>

              <h1 className="font-display text-[2.5rem] font-medium leading-[1.03] tracking-tight sm:text-6xl md:text-[3.9rem]">
                {HEADLINE.map((word, i) => (
                  <span
                    key={i}
                    className="mr-[0.25em] inline-block overflow-hidden pb-[0.12em] align-bottom -mb-[0.12em]"
                  >
                    <motion.span
                      className="inline-block"
                      initial={{ y: "115%" }}
                      animate={{ y: 0 }}
                      transition={{ duration: 0.7, ease: ENTER, delay: 0.08 + i * 0.06 }}
                    >
                      {word}
                    </motion.span>
                  </span>
                ))}
              </h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: ENTER, delay: 0.5 }}
                className="mt-5 max-w-md text-pretty text-[15px] leading-relaxed text-muted-foreground sm:text-base"
              >
                WiseGraph turns standardized scores into radial and bell-curve
                charts you can read at a glance, and share in a conference.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: ENTER, delay: 0.6 }}
                className="mt-8 flex items-center gap-2"
              >
                <MagneticButton>
                  <Link href="/signup">
                    <Button size="lg">Get started</Button>
                  </Link>
                </MagneticButton>
                <Link href="/login">
                  <Button variant="ghost" size="lg">
                    Log in
                  </Button>
                </Link>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, ease: ENTER, delay: 0.9 }}
                className="mt-10 text-[11px] uppercase tracking-[0.16em] text-muted-foreground/70"
              >
                Scroll to see the scores take shape
              </motion.p>
            </div>

            {/* phase 1 — on the curve */}
            <div
              className={`pointer-events-none absolute inset-x-0 top-4 flex flex-col items-start text-left transition-all duration-500 ease-out ${
                phase === 1
                  ? "translate-y-0 opacity-100"
                  : "translate-y-3 opacity-0"
              }`}
            >
              <h2 className="font-display text-3xl font-medium leading-tight tracking-tight sm:text-5xl">
                The same scores, on the curve.
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">
                Every category, placed on the standardized 60 to 150
                distribution, so strengths and gaps are obvious at a glance.
              </p>
            </div>

            {/* phase 2 — a student in context */}
            <div
              className={`absolute inset-x-0 top-4 flex flex-col items-start text-left transition-all duration-500 ease-out ${
                phase === 2
                  ? "translate-y-0 opacity-100"
                  : "pointer-events-none translate-y-3 opacity-0"
              }`}
            >
              <h2 className="font-display text-3xl font-medium leading-tight tracking-tight sm:text-5xl">
                Any student, in context.
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground">
                Drop a student onto the same curve and it&apos;s clear where they
                stand next to the class, without a word of explanation.
              </p>
              <div className="mt-7">
                <MagneticButton>
                  <Link href="/signup">
                    <Button size="lg">Get started</Button>
                  </Link>
                </MagneticButton>
              </div>
            </div>
          </div>

          {/* right column: the morphing chart */}
          <div className="flex justify-center lg:justify-end">
            <HeroMorphCanvas progress={scrollYProgress} />
          </div>
        </div>
      </div>
    </section>
  );
}

export function MagneticButton({ children }: { children: ReactNode }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 300, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 300, damping: 18, mass: 0.4 });
  return (
    <motion.div
      style={{ x: sx, y: sy }}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - r.left - r.width / 2) * 0.35);
        y.set((e.clientY - r.top - r.height / 2) * 0.4);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      className="inline-block"
    >
      {children}
    </motion.div>
  );
}
