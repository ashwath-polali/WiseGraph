"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { MagneticButton } from "@/components/landing/HeroStory";
import { DEMO_EVALUATION } from "@/lib/demoEvaluation";

const StudentPolarInstrument = dynamic(
  () => import("@/components/charts/student/StudentPolarInstrument").then((m) => m.StudentPolarInstrument),
  { ssr: false },
);

const ENTER = [0.22, 1, 0.36, 1] as const;
const HEADLINE = ["Test", "scores", "a", "parent", "can", "actually", "read."];

export function FigureOne() {
  return (
    <section className="mx-auto grid min-h-[calc(100dvh-3.5rem)] max-w-[1240px] items-center gap-6 px-5 py-10 lg:grid-cols-12 lg:gap-8">
      <div className="lg:col-span-5 lg:pr-4">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: ENTER }}
          className="mb-6 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-psych" />
          For teachers and school psychologists
        </motion.p>

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
          WiseGraph draws the standardized scores you already have into a figure you can hand across a table, or project
          on a wall, and nobody needs the jargon explained.
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
          Hover to highlight, click a domain to open it
        </motion.p>
      </div>

      {/* Figure 1 — the real instrument, live and interactive */}
      <div className="relative lg:col-span-7">
        <div className="mx-auto aspect-square w-full max-w-[min(92vw,620px)] lg:mr-[-4%] lg:max-w-[640px]">
          <StudentPolarInstrument evaluation={DEMO_EVALUATION} hideControls />
        </div>
        <p className="mt-1 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground/70">
          Fig. 1 — Radial profile, one evaluation
        </p>
      </div>
    </section>
  );
}
