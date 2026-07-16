"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import { DEMO_EVALUATION, DEMO_SNAPSHOT } from "@/lib/demoEvaluation";

const StudentBellInstrument = dynamic(
  () => import("@/components/charts/student/StudentBellInstrument").then((m) => m.StudentBellInstrument),
  { ssr: false },
);

const ENTER = [0.22, 1, 0.36, 1] as const;

export function FigureTwo() {
  const [compare, setCompare] = useState(false);

  return (
    <section id="figure-two" className="mx-auto grid min-h-[calc(100dvh-3.5rem)] max-w-[1240px] items-center gap-6 px-5 py-10 lg:grid-cols-12 lg:gap-8">
      <div className="lg:col-span-5 lg:pr-4">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, ease: ENTER }}
          className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground"
        >
          Fig. 2 · The normal distribution
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.55, ease: ENTER, delay: 0.05 }}
          className="mt-3 font-display text-[clamp(2.2rem,4vw,3.4rem)] font-medium leading-[1.02] tracking-[-0.02em] text-foreground"
        >
          The same scores, on the curve.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.55, ease: ENTER, delay: 0.1 }}
          className="mt-5 max-w-[32rem] text-[15px] leading-relaxed text-muted-foreground"
        >
          Every domain placed on the standardized 60 to 150 distribution, so a strength and a gap read the same way to
          everyone at the table. Move across the curve and it reads the percentile at any point.
        </motion.p>
        <motion.button
          type="button"
          onClick={() => setCompare((v) => !v)}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.55, ease: ENTER, delay: 0.15 }}
          className={`mt-7 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
            compare ? "border-psych bg-psych/10 text-psych" : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: compare ? "var(--psych)" : "var(--border)" }} />
          {compare ? "Showing last year" : "Compare to last year"}
        </motion.button>
      </div>

      <div className="relative lg:col-span-7">
        <div className="mx-auto w-full max-w-[min(94vw,680px)] lg:mr-[-2%]">
          <div className="aspect-[1000/560] w-full">
            <StudentBellInstrument
              evaluation={DEMO_EVALUATION}
              hideControls
              snapshotOverride={compare ? DEMO_SNAPSHOT : undefined}
            />
          </div>
        </div>
        <p className="mt-1 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground/70">
          Fig. 2 — The same evaluation on the normal distribution
        </p>
      </div>
    </section>
  );
}
