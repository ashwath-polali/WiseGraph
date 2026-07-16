"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, animate, motion, MotionConfig } from "motion/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Button } from "@/components/ui/Button";
import {
  PsychEvaluationProvider,
  ViewModeToggle,
  ChartDisplay,
} from "@/components/PsychEvaluationClient";
import { ExportChartButtons } from "@/components/ExportChartButtons";
import { SnapshotManager } from "@/components/SnapshotManager";
import { SyncCategoriesButton } from "@/components/SyncCategoriesButton";
import { classify, categoryReadout } from "@/lib/classification";
import { wedgeColor } from "@/components/charts/class/palette";
import type { ClassScoreSummary, StudentScoreSummary } from "@/types/scores";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  evaluation: ClassScoreSummary;
  student: StudentScoreSummary | undefined;
  overallScore: number | null;
  isUniversal: boolean;
  evaluationId: string;
  generatedAt: string;
};

type Domain = { id: string; name: string; score: number; subtests: { id: string; name: string; score: number }[] };
type Scene = "hero" | "close" | number;

export function PsychReport(props: Props) {
  return (
    <PsychEvaluationProvider evaluation={props.evaluation}>
      <ReportBody {...props} />
    </PsychEvaluationProvider>
  );
}

/** Count up on scene entry; reduced-motion jumps to the value. */
function CountUp({ to, className }: { to: number; className?: string }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return setV(to);
    const c = animate(0, to, { duration: 1, ease: [0.22, 1, 0.36, 1], onUpdate: (x) => setV(Math.round(x)) });
    return () => c.stop();
  }, [to]);
  return (
    <span className={className} data-numeric>
      {v}
    </span>
  );
}

function ReportBody({ evaluation, student, overallScore, isUniversal, evaluationId, generatedAt }: Props) {
  const scope = useRef<HTMLDivElement>(null);
  const [scene, setScene] = useState<Scene>("hero");
  const [snapOpen, setSnapOpen] = useState(false);

  const grade = student?.gradeLevel ?? evaluation.gradeLevel;
  const band = overallScore != null ? classify(overallScore) : null;
  const nameWords = (student?.name ?? evaluation.name).split(" ");

  const domains: Domain[] = evaluation.categories.map((cat) => {
    const sc = student?.categories?.find((c) => c.id === cat.id);
    return {
      id: cat.id,
      name: cat.name,
      score: sc?.score ?? cat.score ?? 100,
      subtests: (cat.subcategories ?? []).map((sub) => ({
        id: sub.id,
        name: sub.name,
        score: sc?.subcategories?.find((s) => s.id === sub.id)?.score ?? 100,
      })),
    };
  });

  const focusIndex = typeof scene === "number" ? scene : null;

  // scroll drives which "step" is active → sets the scene (and the chart focus)
  useGSAP(
    () => {
      const steps = gsap.utils.toArray<HTMLElement>(".tour-step");
      steps.forEach((el) => {
        const raw = el.dataset.scene;
        const val: Scene = raw === "hero" || raw === "close" ? (raw as Scene) : Number(raw);
        ScrollTrigger.create({
          trigger: el,
          start: "top center",
          end: "bottom center",
          onToggle: (self) => self.isActive && setScene(val),
        });
      });
      // the ssr:false chart mounts after layout — recompute trigger positions
      const t = window.setTimeout(() => ScrollTrigger.refresh(), 500);
      return () => clearTimeout(t);
    },
    { scope },
  );

  const jump = (val: Scene) => {
    const el = scope.current?.querySelector<HTMLElement>(`.tour-step[data-scene="${val}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const activeDomain = typeof scene === "number" ? domains[scene] : null;

  return (
    <MotionConfig reducedMotion="user">
    <div ref={scope} className="relative -mx-4 -my-4 overflow-x-clip bg-background">
      {/* ===== PINNED CHART BACKDROP (sits below the 56px app header) ===== */}
      <div className="sticky top-14 h-[calc(100dvh-3.5rem)] w-full overflow-hidden">
        {/* ambient field */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-70 blur-3xl"
          style={{
            background:
              "radial-gradient(38% 42% at 26% 26%, color-mix(in srgb, var(--psych) 22%, transparent), transparent 70%), radial-gradient(40% 45% at 78% 30%, color-mix(in srgb, var(--chart-1) 18%, transparent), transparent 72%), radial-gradient(38% 48% at 62% 86%, color-mix(in srgb, var(--chart-3) 14%, transparent), transparent 70%)",
          }}
        />

        {/* the chart — huge, the reactive centerpiece (shifted right so the tour text has room) */}
        <div id="chart-container" className="absolute inset-0 flex items-center justify-center py-6 md:pl-[28%] md:pr-[2%]">
          <div className="h-full w-full max-w-[min(96vw,1180px)]">
            <ChartDisplay evaluation={evaluation} focusIndex={focusIndex} />
          </div>
        </div>

        {/* left scrim so overlaid text stays legible over the living chart */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-[46%]"
          style={{
            background: "linear-gradient(to right, var(--background) 8%, color-mix(in srgb, var(--background) 55%, transparent) 55%, transparent)",
          }}
        />

        {/* ===== scene overlays (crossfade) ===== */}
        <div className="pointer-events-none absolute inset-0 flex items-center">
          <div className="w-full max-w-[560px] px-8 sm:px-14">
            <AnimatePresence mode="wait">
              {scene === "hero" && (
                <Masthead
                  key="hero"
                  subject={evaluation.subject}
                  grade={grade}
                  nameWords={nameWords}
                  overallScore={overallScore}
                  band={band}
                />
              )}
              {typeof scene === "number" && activeDomain && (
                <DomainScene key={`d-${activeDomain.id}`} domain={activeDomain} index={scene} total={domains.length} />
              )}
              {scene === "close" && (
                <CloseScene key="close" overallScore={overallScore} band={band} generatedAt={generatedAt} />
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ===== floating top controls (container passes clicks through the gap) ===== */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-6 py-5">
          <Link
            href="/psych/dashboard"
            className="group pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-border bg-card/70 px-3 py-1.5 text-sm text-muted-foreground backdrop-blur-md transition-colors hover:text-foreground"
          >
            <svg className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Evaluations
          </Link>
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-border bg-card/70 p-1.5 backdrop-blur-md">
            <ViewModeToggle />
            <div className="h-5 w-px bg-border" />
            <button
              type="button"
              onClick={() => setSnapOpen(true)}
              className="rounded-md px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Compare
            </button>
            <ExportChartButtons studentName={student?.name || evaluation.name} />
          </div>
        </div>

        {/* ===== chapter nav (right rail) ===== */}
        <div className="pointer-events-none absolute right-6 top-1/2 z-10 -translate-y-1/2">
          <div className="flex flex-col items-center gap-3">
            {[{ v: "hero" as Scene, label: "Overview" }, ...domains.map((d, i) => ({ v: i as Scene, label: d.name }))].map(
              (c) => {
                const on = scene === c.v;
                return (
                  <button
                    key={String(c.v)}
                    type="button"
                    onClick={() => jump(c.v)}
                    className="group pointer-events-auto flex items-center gap-2"
                    aria-label={`Go to ${c.label}`}
                  >
                    <span
                      className="whitespace-nowrap text-[11px] font-medium text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                      style={on ? { opacity: 1, color: "var(--foreground)" } : undefined}
                    >
                      {c.label}
                    </span>
                    <span
                      className="h-2 w-2 rounded-full border transition-all"
                      style={{
                        borderColor: on ? "var(--psych)" : "var(--border)",
                        backgroundColor: on ? "var(--psych)" : "transparent",
                        transform: on ? "scale(1.25)" : "scale(1)",
                      }}
                    />
                  </button>
                );
              },
            )}
          </div>
        </div>

        {/* scroll cue (hero only) */}
        <AnimatePresence>
          {scene === "hero" && (
            <motion.div
              key="cue"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute bottom-8 left-8 flex items-center gap-3 sm:left-14"
            >
              <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Scroll to tour the profile</p>
              <motion.div
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                className="h-4 w-4 text-muted-foreground"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ===== SCROLL STEPS (drive the scene) — overlay the sticky ===== */}
      <div className="pointer-events-none relative -mt-[calc(100dvh-3.5rem)]">
        <div className="tour-step h-[calc(100dvh-3.5rem)]" data-scene="hero" />
        {domains.map((d, i) => (
          <div key={d.id} className="tour-step h-[calc(100dvh-3.5rem)]" data-scene={i} />
        ))}
        <div className="tour-step h-[calc(100dvh-3.5rem)]" data-scene="close" />
      </div>

      {/* ===== bottom action bar (after the pin releases) ===== */}
      <div className="border-t border-border bg-background px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {student && (
              <Link href={`/psych/evaluations/${evaluationId}/edit-scores`}>
                <Button className="inline-flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit scores
                </Button>
              </Link>
            )}
            {isUniversal && <SyncCategoriesButton evaluationId={evaluationId} />}
            {!isUniversal && (
              <Link href={`/psych/evaluations/${evaluationId}/configure`}>
                <Button variant="secondary" className="inline-flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  Configure categories
                </Button>
              </Link>
            )}
          </div>
          <p className="font-mono text-xs text-muted-foreground">Report generated {generatedAt}</p>
        </div>
      </div>

      {/* ===== snapshot drawer ===== */}
      <AnimatePresence>
        {snapOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSnapOpen(false)}
              className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="fixed inset-y-0 right-0 z-50 w-[360px] max-w-[90vw] overflow-y-auto border-l border-border bg-background p-5 shadow-2xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold text-foreground">Compare over time</h3>
                <button onClick={() => setSnapOpen(false)} className="rounded-md p-1 text-muted-foreground hover:text-foreground" aria-label="Close">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <SnapshotManager classId={evaluationId} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
    </MotionConfig>
  );
}

/* ---------------- scenes ---------------- */

const EASE = [0.22, 1, 0.36, 1] as const;
const sceneIn = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -18 },
  transition: { duration: 0.5, ease: EASE },
};

function Masthead({
  subject,
  grade,
  nameWords,
  overallScore,
  band,
}: {
  subject: string;
  grade: string;
  nameWords: string[];
  overallScore: number | null;
  band: ReturnType<typeof classify> | null;
}) {
  return (
    <motion.div {...sceneIn}>
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">
        {subject} · Grade {grade}
      </p>
      <h1 className="mt-3 font-display text-6xl font-semibold leading-[0.92] tracking-[-0.03em] text-foreground sm:text-7xl">
        {nameWords.map((w, i) => (
          <span key={i} className="mr-[0.2em] inline-block">
            {w}
          </span>
        ))}
      </h1>
      {overallScore != null && band && (
        <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
          <div className="flex items-baseline gap-2">
            <CountUp to={overallScore} className="font-mono text-5xl font-semibold tracking-tight text-foreground" />
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">overall</span>
          </div>
          <span
            className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium"
            style={{ color: band.color, backgroundColor: `color-mix(in srgb, ${band.color} 12%, transparent)` }}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: band.color }} />
            {band.label}
          </span>
        </div>
      )}
    </motion.div>
  );
}

function DomainScene({ domain, index, total }: { domain: Domain; index: number; total: number }) {
  const band = classify(domain.score);
  const color = wedgeColor(index);
  const readout = categoryReadout(domain.score, domain.subtests);
  return (
    <motion.div {...sceneIn}>
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">
        Area {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </p>
      <h2 className="mt-3 font-display text-6xl font-semibold leading-[0.95] tracking-[-0.03em] text-foreground">
        {domain.name}
      </h2>
      <div className="mt-4 flex items-center gap-4">
        <CountUp to={domain.score} className="font-mono text-6xl font-semibold leading-none tracking-tight" />
        <span
          className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium"
          style={{ color: band.color, backgroundColor: `color-mix(in srgb, ${band.color} 12%, transparent)` }}
        >
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: band.color }} />
          {band.label}
        </span>
      </div>
      <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-muted-foreground">{readout}</p>
      {domain.subtests.length > 0 && (
        <div className="mt-6 space-y-2">
          {domain.subtests.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.07, duration: 0.4, ease: EASE }}
              className="flex items-center justify-between border-b border-border/60 pb-1.5"
            >
              <span className="text-sm text-foreground">{s.name}</span>
              <span className="font-mono text-sm font-semibold" style={{ color }} data-numeric>
                {Math.round(s.score)}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function CloseScene({
  overallScore,
  band,
  generatedAt,
}: {
  overallScore: number | null;
  band: ReturnType<typeof classify> | null;
  generatedAt: string;
}) {
  return (
    <motion.div {...sceneIn}>
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">The whole profile</p>
      <h2 className="mt-3 font-display text-5xl font-semibold leading-[0.95] tracking-[-0.03em] text-foreground">
        One picture, every score.
      </h2>
      {overallScore != null && band && (
        <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
          Overall, {overallScore} sits in the {band.label.toLowerCase()} range. Scroll back up to revisit any area, or
          export the chart for the conference.
        </p>
      )}
      <p className="mt-6 font-mono text-xs text-muted-foreground">Report generated {generatedAt}</p>
    </motion.div>
  );
}
