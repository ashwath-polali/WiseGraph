"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "motion/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Button } from "@/components/ui/Button";
import { MagneticButton } from "@/components/landing/HeroStory";
import { DEMO_EVALUATION } from "@/lib/demoEvaluation";
import { classificationOf, percentileOf, ordinal } from "@/lib/scoreStats";

const StudentPolarInstrument = dynamic(
  () => import("@/components/charts/student/StudentPolarInstrument").then((m) => m.StudentPolarInstrument),
  { ssr: false },
);

gsap.registerPlugin(ScrollTrigger);

const ENTER = [0.22, 1, 0.36, 1] as const;
const HEADLINE = ["Test", "scores", "a", "parent", "can", "actually", "read."];
const STAGE = "h-[calc(100dvh-3.5rem)]";

type Beat = "hero" | number;

const domains = DEMO_EVALUATION.students[0].categories;

export function FigureOne() {
  const scope = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<Beat>("hero");
  const focusIndex = typeof active === "number" ? active : null;

  useGSAP(
    () => {
      const steps = gsap.utils.toArray<HTMLElement>(".fig1-step");
      steps.forEach((el) => {
        const raw = el.dataset.beat;
        const val: Beat = raw === "hero" ? "hero" : Number(raw);
        ScrollTrigger.create({
          trigger: el,
          start: "top center",
          end: "bottom center",
          onToggle: (self) => self.isActive && setActive(val),
        });
      });
      const t = window.setTimeout(() => ScrollTrigger.refresh(), 400);
      return () => clearTimeout(t);
    },
    { scope },
  );

  const skip = () => {
    document.getElementById("figure-two")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const dom = typeof active === "number" ? domains[active] : null;

  return (
    <section ref={scope} className="relative">
      {/* pinned stage */}
      <div className={`sticky top-14 ${STAGE} w-full overflow-hidden`}>
        <div className="mx-auto grid h-full max-w-[1240px] items-center gap-6 px-5 lg:grid-cols-12 lg:gap-8">
          {/* left column — crossfading beats */}
          <div className="relative z-10 lg:col-span-5 lg:pr-4">
            <AnimatePresence mode="wait">
              {active === "hero" ? (
                <motion.div key="hero" exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.35 }}>
                  <p className="mb-6 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-psych" />
                    For teachers and school psychologists
                  </p>
                  <h1 className="font-display text-[clamp(2.6rem,5vw,4.6rem)] font-medium leading-[1.02] tracking-[-0.02em]">
                    {HEADLINE.map((word, i) => (
                      <span key={i} className="mr-[0.24em] inline-block overflow-hidden pb-[0.1em] align-bottom -mb-[0.1em]">
                        <motion.span
                          className="inline-block"
                          initial={{ y: "115%" }}
                          animate={{ y: 0 }}
                          transition={{ duration: 0.7, ease: ENTER, delay: 0.1 + i * 0.06 }}
                        >
                          {word}
                        </motion.span>
                      </span>
                    ))}
                  </h1>
                  <motion.p
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: ENTER, delay: 0.55 }}
                    className="mt-6 max-w-[34rem] text-pretty text-[15px] leading-relaxed text-muted-foreground sm:text-base"
                  >
                    WiseGraph draws the standardized scores you already have into a figure you can hand across a table,
                    or project on a wall, and nobody needs the jargon explained.
                  </motion.p>
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: ENTER, delay: 0.65 }}
                    className="mt-8 flex items-center gap-2"
                  >
                    <MagneticButton>
                      <Link href="/signup">
                        <Button size="lg">Get started</Button>
                      </Link>
                    </MagneticButton>
                    <Link href="/login">
                      <Button variant="ghost" size="lg">Log in</Button>
                    </Link>
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, ease: ENTER, delay: 0.95 }}
                    className="mt-12 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground/70"
                  >
                    Scroll to read the figure
                  </motion.p>
                </motion.div>
              ) : (
                dom && (
                  <motion.div
                    key={dom.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -14 }}
                    transition={{ duration: 0.4, ease: ENTER }}
                  >
                    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                      Fig. 1 · Area {String((active as number) + 1).padStart(2, "0")} / {String(domains.length).padStart(2, "0")}
                    </p>
                    <h2 className="mt-3 font-display text-[clamp(2.2rem,4vw,3.4rem)] font-medium leading-[1.0] tracking-[-0.02em] text-foreground">
                      {dom.name}
                    </h2>
                    <div className="mt-4 flex items-baseline gap-3">
                      <span className="font-mono text-5xl font-semibold tracking-tight text-foreground" data-numeric>
                        {Math.round(dom.score)}
                      </span>
                      <span className="font-mono text-sm text-muted-foreground">
                        {classificationOf(dom.score)} · ~{ordinal(percentileOf(dom.score))} pct
                      </span>
                    </div>
                    <div className="mt-6 space-y-1.5">
                      {(dom.subcategories ?? []).map((s, i) => (
                        <motion.div
                          key={s.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.15 + i * 0.06, duration: 0.35, ease: ENTER }}
                          className="flex items-center justify-between border-b border-border/60 pb-1.5 text-sm"
                        >
                          <span className="text-foreground">{s.name}</span>
                          <span className="font-mono font-semibold text-muted-foreground" data-numeric>
                            {Math.round(s.score)}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )
              )}
            </AnimatePresence>
          </div>

          {/* right column — the persistent instrument */}
          <div className="relative lg:col-span-7">
            <div className="mx-auto aspect-square w-full max-w-[min(92vw,620px)] lg:mr-[-4%] lg:max-w-[640px]">
              <StudentPolarInstrument evaluation={DEMO_EVALUATION} focusIndex={focusIndex} hideControls />
            </div>
            <p className="mt-1 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground/70">
              Fig. 1 — Radial profile, one evaluation
            </p>
          </div>
        </div>

        {/* skip the tour */}
        {active !== "hero" && (
          <button
            type="button"
            onClick={skip}
            className="absolute right-6 top-4 z-20 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
          >
            Skip the tour →
          </button>
        )}
      </div>

      {/* scroll steps drive the beat */}
      <div className={`pointer-events-none relative -mt-[calc(100dvh-3.5rem)]`}>
        <div className={`fig1-step ${STAGE}`} data-beat="hero" />
        {domains.map((d, i) => (
          <div key={d.id} className={`fig1-step ${STAGE}`} data-beat={i} />
        ))}
      </div>
    </section>
  );
}
