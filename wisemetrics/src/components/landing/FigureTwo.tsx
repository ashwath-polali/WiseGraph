"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "motion/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { DEMO_EVALUATION, DEMO_SNAPSHOT } from "@/lib/demoEvaluation";
import { classificationOf, percentileOf, ordinal } from "@/lib/scoreStats";

const StudentBellInstrument = dynamic(
  () => import("@/components/charts/student/StudentBellInstrument").then((m) => m.StudentBellInstrument),
  { ssr: false },
);

gsap.registerPlugin(ScrollTrigger);

const ENTER = [0.22, 1, 0.36, 1] as const;
const STAGE = "h-[calc(100dvh-3.5rem)]";

type Beat = "intro" | "compare" | number;
const domains = DEMO_EVALUATION.students[0].categories;

export function FigureTwo() {
  const scope = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<Beat>("intro");
  const focusIndex = typeof active === "number" ? active : null;
  const dom = typeof active === "number" ? domains[active] : null;

  useGSAP(
    () => {
      const steps = gsap.utils.toArray<HTMLElement>(".fig2-step");
      steps.forEach((el) => {
        const raw = el.dataset.beat;
        const val: Beat = raw === "intro" || raw === "compare" ? (raw as Beat) : Number(raw);
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

  return (
    <section id="figure-two" ref={scope} className="relative">
      <div className={`sticky top-14 ${STAGE} w-full overflow-hidden`}>
        <div className="mx-auto grid h-full max-w-[1240px] items-center gap-6 px-5 lg:grid-cols-12 lg:gap-8">
          {/* left — crossfading beats */}
          <div className="relative z-10 lg:col-span-5 lg:pr-4">
            <AnimatePresence mode="wait">
              {active === "intro" && (
                <motion.div key="intro" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.4, ease: ENTER }}>
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Fig. 2 · The normal distribution</p>
                  <h2 className="mt-3 font-display text-[clamp(2.2rem,4vw,3.4rem)] font-medium leading-[1.02] tracking-[-0.02em] text-foreground">
                    The same scores, on the curve.
                  </h2>
                  <p className="mt-5 max-w-[32rem] text-[15px] leading-relaxed text-muted-foreground">
                    Every domain placed on the standardized 60 to 150 distribution, so a strength and a gap read the
                    same way to everyone at the table. Move across the curve and it reads the percentile at any point.
                  </p>
                </motion.div>
              )}
              {typeof active === "number" && dom && (
                <motion.div key={dom.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.4, ease: ENTER }}>
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    Fig. 2 · Area {String((active as number) + 1).padStart(2, "0")} / {String(domains.length).padStart(2, "0")}
                  </p>
                  <h2 className="mt-3 font-display text-[clamp(2.2rem,4vw,3.4rem)] font-medium leading-[1.0] tracking-[-0.02em] text-foreground">
                    {dom.name}
                  </h2>
                  <div className="mt-4 flex items-baseline gap-3">
                    <span className="font-mono text-5xl font-semibold tracking-tight text-foreground" data-numeric>{Math.round(dom.score)}</span>
                    <span className="font-mono text-sm text-muted-foreground">
                      {classificationOf(dom.score)} · ~{ordinal(percentileOf(dom.score))} pct
                    </span>
                  </div>
                  <p className="mt-4 max-w-[30rem] text-sm leading-relaxed text-muted-foreground">
                    Where {DEMO_EVALUATION.students[0].name.split(" ")[0]} lands against the population on this domain,
                    with the subtests underneath.
                  </p>
                </motion.div>
              )}
              {active === "compare" && (
                <motion.div key="compare" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.4, ease: ENTER }}>
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Fig. 2 · Over time</p>
                  <h2 className="mt-3 font-display text-[clamp(2.2rem,4vw,3.4rem)] font-medium leading-[1.02] tracking-[-0.02em] text-foreground">
                    Lay last year underneath.
                  </h2>
                  <p className="mt-5 max-w-[32rem] text-[15px] leading-relaxed text-muted-foreground">
                    Save where a student started, then put this year on top. The dashed marks are the earlier
                    evaluation, so growth is something a parent can see, not a number they have to trust.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* right — the persistent bell instrument */}
          <div className="relative lg:col-span-7">
            <div className="mx-auto w-full max-w-[min(94vw,680px)] lg:mr-[-2%]">
              <div className="aspect-[1000/560] w-full">
                <StudentBellInstrument
                  evaluation={DEMO_EVALUATION}
                  focusIndex={focusIndex}
                  hideControls
                  snapshotOverride={active === "compare" ? DEMO_SNAPSHOT : undefined}
                />
              </div>
            </div>
            <p className="mt-1 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground/70">
              Fig. 2 — The same evaluation on the normal distribution
            </p>
          </div>
        </div>
      </div>

      {/* scroll steps */}
      <div className={`pointer-events-none relative -mt-[calc(100dvh-3.5rem)]`}>
        <div className={`fig2-step ${STAGE}`} data-beat="intro" />
        {domains.map((d, i) => (
          <div key={d.id} className={`fig2-step ${STAGE}`} data-beat={i} />
        ))}
        <div className={`fig2-step ${STAGE}`} data-beat="compare" />
      </div>
    </section>
  );
}
