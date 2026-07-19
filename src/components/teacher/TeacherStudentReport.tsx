"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { AnimatePresence, animate, motion, MotionConfig } from "motion/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Button } from "@/components/ui/Button";
import { ExportChartButtons } from "@/components/ExportChartButtons";
import { CategoryGaugeCard } from "@/components/student/CategoryGaugeCard";
import { CategoryDrillDownClient } from "@/components/CategoryDrillDownClient";
import { classify } from "@/lib/classification";
import { wedgeColor } from "@/components/charts/class/palette";
import type { ClassScoreSummary, StudentScoreSummary } from "@/types/scores";

const StudentPolarInstrument = dynamic(
  () => import("@/components/charts/student/StudentPolarInstrument").then((m) => m.StudentPolarInstrument),
  { ssr: false },
);
const StudentBellInstrument = dynamic(
  () => import("@/components/charts/student/StudentBellInstrument").then((m) => m.StudentBellInstrument),
  { ssr: false },
);
const StudentConcentricPieChart = dynamic(
  () => import("@/components/charts/StudentConcentricPieChart").then((m) => m.StudentConcentricPieChart),
  { ssr: false },
);

gsap.registerPlugin(ScrollTrigger);

const EASE = [0.22, 1, 0.36, 1] as const;
type Scene = "hero" | "close" | number;
type ViewMode = "polar" | "bell" | "concentric";

type SubCompare = { id: string; name: string; studentScore: number; classScore: number; delta: number };
type DomainCompare = {
  id: string;
  name: string;
  studentScore: number;
  classScore: number;
  delta: number;
  subskills: SubCompare[];
};

type Props = {
  student: StudentScoreSummary;
  cls: ClassScoreSummary;
  comparisons: DomainCompare[];
  editHref: string;
};

function CountUp({ to, className }: { to: number; className?: string }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return setV(to);
    const c = animate(0, to, { duration: 1, ease: EASE, onUpdate: (x) => setV(Math.round(x)) });
    return () => c.stop();
  }, [to]);
  return (
    <span className={className} data-numeric>
      {v}
    </span>
  );
}

function Delta({ delta }: { delta: number }) {
  const up = delta >= 0;
  const color = up ? "var(--chart-2)" : "var(--chart-4)";
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-xs font-medium"
      style={{ color, backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }}
      data-numeric
    >
      {up ? "+" : ""}
      {delta} vs class
    </span>
  );
}

export function TeacherStudentReport({ student, cls, comparisons, editHref }: Props) {
  const scope = useRef<HTMLDivElement>(null);
  const [scene, setScene] = useState<Scene>("hero");
  const [view, setView] = useState<ViewMode>("polar");
  const [vsClass, setVsClass] = useState(true);

  const overall = student.overallScore;
  const band = classify(overall);
  const nameWords = student.name.split(" ");

  // the instruments read an evaluation-shaped object (students[0] + categories)
  const evaluation: ClassScoreSummary = { ...cls, categories: student.categories, students: [student] };

  // the class average, drawn as the dashed "comparison" overlay on the chart
  const classSnapshot = {
    scores: cls.categories.flatMap((cat) => [
      { categoryId: cat.id, subcategoryId: null as string | null, standardScore: cat.score },
      ...(cat.subcategories ?? []).map((s) => ({ categoryId: cat.id, subcategoryId: s.id as string | null, standardScore: s.score })),
    ]),
  };
  const snapshotOverride = vsClass && view !== "concentric" ? classSnapshot : undefined;

  const focusIndex = typeof scene === "number" ? scene : null;
  const activeDomain = typeof scene === "number" ? comparisons[scene] : null;

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
      const t = window.setTimeout(() => ScrollTrigger.refresh(), 500);
      return () => clearTimeout(t);
    },
    { scope },
  );

  const jump = (val: Scene) => {
    scope.current?.querySelector<HTMLElement>(`.tour-step[data-scene="${val}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const VIEWS: { id: ViewMode; label: string }[] = [
    { id: "polar", label: "Polar" },
    { id: "bell", label: "Bell" },
    { id: "concentric", label: "Concentric" },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <div ref={scope} className="relative left-1/2 w-screen -translate-x-1/2 -my-8 overflow-x-clip bg-background">
        {/* ===== pinned chart backdrop ===== */}
        <div className="sticky top-14 h-[calc(100dvh-3.5rem)] w-full overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 opacity-70 blur-3xl"
            style={{
              background:
                "radial-gradient(38% 42% at 26% 26%, color-mix(in srgb, var(--primary) 20%, transparent), transparent 70%), radial-gradient(40% 45% at 78% 30%, color-mix(in srgb, var(--chart-2) 16%, transparent), transparent 72%), radial-gradient(38% 48% at 62% 86%, color-mix(in srgb, var(--chart-3) 14%, transparent), transparent 70%)",
            }}
          />

          <div id="chart-container" className="absolute inset-0 flex items-center justify-center pb-6 pt-20 md:pl-[28%] md:pr-[2%]">
            <div className="h-full w-full max-w-[min(96vw,1180px)]">
              {view === "concentric" ? (
                <div className="flex h-full items-center justify-center">
                  <div className="h-full w-full max-w-2xl">
                    <StudentConcentricPieChart student={student} cls={cls} />
                  </div>
                </div>
              ) : view === "bell" ? (
                <StudentBellInstrument evaluation={evaluation} focusIndex={focusIndex} hideControls snapshotOverride={snapshotOverride} />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="aspect-square h-full max-w-full">
                    <StudentPolarInstrument evaluation={evaluation} focusIndex={focusIndex} hideControls snapshotOverride={snapshotOverride} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-[46%]"
            style={{ background: "linear-gradient(to right, var(--background) 8%, color-mix(in srgb, var(--background) 55%, transparent) 55%, transparent)" }}
          />

          {/* scene overlays */}
          <div className="pointer-events-none absolute inset-0 flex items-center">
            <div className="w-full max-w-[560px] px-8 sm:px-14">
              <AnimatePresence mode="wait">
                {scene === "hero" && (
                  <motion.div key="hero" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} transition={{ duration: 0.5, ease: EASE }}>
                    <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">
                      {cls.name} · Grade {cls.gradeLevel}
                    </p>
                    <h1 className="mt-3 font-display text-6xl font-semibold leading-[0.95] tracking-[-0.03em] text-foreground sm:text-7xl">
                      {nameWords.map((w, i) => (
                        <span key={i} className="mr-[0.2em] inline-block">
                          {w}
                        </span>
                      ))}
                    </h1>
                    <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
                      <div className="flex items-baseline gap-2">
                        <CountUp to={overall} className="font-mono text-5xl font-semibold tracking-tight text-foreground" />
                        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">overall</span>
                      </div>
                      <span className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium" style={{ color: band.color, backgroundColor: `color-mix(in srgb, ${band.color} 12%, transparent)` }}>
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: band.color }} />
                        {band.label}
                      </span>
                    </div>
                    <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted-foreground">
                      {student.name.split(" ")[0]} against the {cls.name} class average. The dashed line is the class; scroll to read each area.
                    </p>
                  </motion.div>
                )}
                {typeof scene === "number" && activeDomain && (
                  <motion.div key={`d-${activeDomain.id}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.45, ease: EASE }}>
                    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                      Area {String((scene as number) + 1).padStart(2, "0")} / {String(comparisons.length).padStart(2, "0")}
                    </p>
                    <h2 className="mt-3 font-display text-[clamp(2.4rem,4.4vw,3.6rem)] font-semibold leading-[1.0] tracking-[-0.02em] text-foreground">
                      {activeDomain.name}
                    </h2>
                    <div className="mt-4 flex flex-wrap items-baseline gap-3">
                      <span className="font-mono text-5xl font-semibold tracking-tight" style={{ color: wedgeColor(scene as number) }} data-numeric>
                        {Math.round(activeDomain.studentScore)}
                      </span>
                      <Delta delta={activeDomain.delta} />
                      <span className="font-mono text-sm text-muted-foreground" data-numeric>
                        class {Math.round(activeDomain.classScore)}
                      </span>
                    </div>
                    {activeDomain.subskills.length > 0 && (
                      <div className="mt-6 space-y-2">
                        {activeDomain.subskills.map((s, i) => (
                          <motion.div
                            key={s.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15 + i * 0.06, duration: 0.35, ease: EASE }}
                            className="flex items-center justify-between border-b border-border/60 pb-1.5 text-sm"
                          >
                            <span className="text-foreground">{s.name}</span>
                            <span className="flex items-center gap-2 font-mono" data-numeric>
                              <span className="font-semibold text-foreground">{Math.round(s.studentScore)}</span>
                              <span className="text-muted-foreground/70">/ {Math.round(s.classScore)}</span>
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
                {scene === "close" && (
                  <motion.div key="close" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.45, ease: EASE }}>
                    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">The whole profile</p>
                    <h2 className="mt-3 font-display text-5xl font-semibold leading-[0.95] tracking-[-0.02em] text-foreground">
                      One picture, against the class.
                    </h2>
                    <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
                      Overall, {student.name.split(" ")[0]} sits in the {band.label.toLowerCase()} range. Scroll back to any area, or open the full breakdown below.
                    </p>
                    <Link href={editHref} className="mt-6 inline-flex">
                      <Button>Edit scores</Button>
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* floating top controls */}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-6 py-5">
            <Link
              href={`/dashboard?classId=${cls.id}`}
              className="group pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-border bg-card/70 px-3 py-1.5 text-sm text-muted-foreground backdrop-blur-md transition-colors hover:text-foreground"
            >
              <svg className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Dashboard
            </Link>
            <div className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-border bg-card/70 p-1.5 backdrop-blur-md">
              <div className="flex items-center gap-0.5">
                {VIEWS.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setView(v.id)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${view === v.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
              {view !== "concentric" && (
                <>
                  <div className="h-5 w-px bg-border" />
                  <button
                    type="button"
                    onClick={() => setVsClass((v) => !v)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${vsClass ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    title="Overlay the class average"
                  >
                    vs class
                  </button>
                </>
              )}
              <div className="h-5 w-px bg-border" />
              <ExportChartButtons studentName={student.name} />
              <Link
                href={editHref}
                title="Edit scores"
                aria-label="Edit scores"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </Link>
            </div>
          </div>

          {/* chapter nav */}
          <div className="pointer-events-auto absolute right-6 top-1/2 z-10 -translate-y-1/2">
            <div className="flex flex-col items-center gap-3">
              {[{ v: "hero" as Scene, label: "Overview" }, ...comparisons.map((d, i) => ({ v: i as Scene, label: d.name }))].map((c) => {
                const on = scene === c.v;
                return (
                  <button key={String(c.v)} type="button" onClick={() => jump(c.v)} className="group flex items-center gap-2" aria-label={`Go to ${c.label}`}>
                    <span className="whitespace-nowrap text-[11px] font-medium text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" style={on ? { opacity: 1, color: "var(--foreground)" } : undefined}>
                      {c.label}
                    </span>
                    <span className="h-2 w-2 rounded-full border transition-all" style={{ borderColor: on ? "var(--primary)" : "var(--border)", backgroundColor: on ? "var(--primary)" : "transparent", transform: on ? "scale(1.25)" : "scale(1)" }} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* scroll steps */}
        <div className="pointer-events-none relative -mt-[calc(100dvh-3.5rem)]">
          <div className="tour-step h-[calc(100dvh-3.5rem)]" data-scene="hero" />
          {comparisons.map((d, i) => (
            <div key={d.id} className="tour-step h-[calc(100dvh-3.5rem)]" data-scene={i} />
          ))}
          <div className="tour-step h-[calc(100dvh-3.5rem)]" data-scene="close" />
        </div>

        {/* breakdown + drill-down (full teacher detail) */}
        <div className="space-y-10 border-t border-border bg-background px-6 py-12">
          <section className="mx-auto max-w-5xl">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-2xl font-semibold text-foreground">Category breakdown</h2>
              <p className="text-xs text-muted-foreground">Every score on the 60-150 scale · the shaded band is the 85-115 average</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {comparisons.map((cat, i) => (
                <CategoryGaugeCard key={cat.id} category={cat} index={i} />
              ))}
            </div>
          </section>

          <section className="mx-auto max-w-5xl rounded-2xl border border-border bg-card p-6">
            <div className="mb-4">
              <h2 className="font-display text-xl font-semibold text-foreground">Category drill-down</h2>
              <p className="mt-1 text-xs text-muted-foreground">Pick a category to see the subtests underneath it.</p>
            </div>
            <CategoryDrillDownClient student={student} />
          </section>
        </div>
      </div>
    </MotionConfig>
  );
}
