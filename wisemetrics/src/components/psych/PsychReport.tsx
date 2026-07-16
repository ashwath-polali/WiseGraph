"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { animate } from "motion/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PsychStudentViewClient } from "@/components/PsychStudentViewClient";
import {
  PsychEvaluationProvider,
  ViewModeToggle,
  ChartDisplay,
  useViewMode,
} from "@/components/PsychEvaluationClient";
import { ExportChartButtons } from "@/components/ExportChartButtons";
import { SnapshotManager } from "@/components/SnapshotManager";
import { SyncCategoriesButton } from "@/components/SyncCategoriesButton";
import { DomainSpread, type Domain } from "@/components/psych/DomainSpread";
import { classify } from "@/lib/classification";
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

export function PsychReport(props: Props) {
  return (
    <PsychEvaluationProvider evaluation={props.evaluation}>
      <ReportBody {...props} />
    </PsychEvaluationProvider>
  );
}

/** Count up on mount; jumps straight to the value under reduced-motion. */
function CountUp({ to, className }: { to: number; className?: string }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setV(to);
      return;
    }
    const controls = animate(0, to, {
      duration: 1.1,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (x) => setV(Math.round(x)),
    });
    return () => controls.stop();
  }, [to]);
  return (
    <span className={className} data-numeric>
      {v}
    </span>
  );
}

function ReportBody({
  evaluation,
  student,
  overallScore,
  isUniversal,
  evaluationId,
  generatedAt,
}: Props) {
  const { selectedCategoryId, setSelectedCategoryId } = useViewMode();
  const scope = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  const grade = student?.gradeLevel ?? evaluation.gradeLevel;
  const band = overallScore != null ? classify(overallScore) : null;
  const nameWords = (student?.name ?? evaluation.name).split(" ");

  // resolve each domain's student scores for the spreads
  const domains: Domain[] = evaluation.categories.map((cat) => {
    const sc = student?.categories?.find((c) => c.id === cat.id);
    const score = sc?.score ?? cat.score ?? 100;
    const subtests = (cat.subcategories ?? []).map((sub) => ({
      id: sub.id,
      name: sub.name,
      score:
        sc?.subcategories?.find((s) => s.id === sub.id)?.score ?? 100,
    }));
    return { id: cat.id, name: cat.name, score, subtests };
  });

  const selectDomain = (id: string) => {
    setSelectedCategoryId(id);
    heroRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // ScrollTrigger positions are measured before the ssr:false chart mounts —
  // refresh once it (and the fonts) settle so triggers attach in the right spot.
  useEffect(() => {
    const timers: number[] = [];
    const refresh = () => ScrollTrigger.refresh();
    timers.push(window.setTimeout(refresh, 450));
    timers.push(window.setTimeout(refresh, 1300));
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    fonts?.ready.then(refresh).catch(() => {});
    window.addEventListener("load", refresh);
    return () => {
      timers.forEach((t) => clearTimeout(t));
      window.removeEventListener("load", refresh);
    };
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        tl.from(".mast-kicker", { y: 14, opacity: 0, duration: 0.5 })
          .from(
            ".mast-word",
            { yPercent: 115, opacity: 0, duration: 0.75, stagger: 0.06, ease: "expo.out" },
            "-=0.3",
          )
          .from(".mast-overall", { y: 12, opacity: 0, duration: 0.6 }, "-=0.45")
          .from(".mast-pill", { scale: 0.96, opacity: 0, duration: 0.5 }, "-=0.45");

        gsap.from(".report-hero", {
          y: 26,
          opacity: 0,
          duration: 0.75,
          ease: "power3.out",
          scrollTrigger: { trigger: ".report-hero", start: "top 92%" },
        });

        gsap.utils.toArray<HTMLElement>(".domain-spread").forEach((el) => {
          gsap.from(el, {
            y: 40,
            opacity: 0,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 88%" },
          });
        });

        const fill = scope.current?.querySelector(".spine-fill");
        const col = scope.current?.querySelector(".report-col");
        if (fill && col) {
          gsap.fromTo(
            fill,
            { scaleY: 0 },
            {
              scaleY: 1,
              ease: "none",
              transformOrigin: "top center",
              scrollTrigger: { trigger: col, start: "top 30%", end: "bottom 85%", scrub: 0.4 },
            },
          );
        }
      });
      return () => mm.revert();
    },
    { scope },
  );

  return (
    <div ref={scope} className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1500px] px-6 py-8">
        {/* Masthead */}
        <header className="mb-12">
          <Link
            href="/psych/dashboard"
            className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-psych"
          >
            <svg
              className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to evaluations
          </Link>

          <p className="mast-kicker mt-8 font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">
            {evaluation.subject} · Grade {grade}
          </p>

          <h1 className="mt-3 font-display text-6xl font-semibold leading-[0.95] tracking-[-0.03em] text-foreground sm:text-7xl">
            {nameWords.map((w, i) => (
              <span key={i} className="mr-[0.22em] inline-block overflow-hidden pb-[0.08em] align-bottom">
                <span className="mast-word inline-block">{w}</span>
              </span>
            ))}
          </h1>

          {overallScore != null && band && (
            <div className="mast-overall mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
              <div className="flex items-baseline gap-2">
                <CountUp
                  to={overallScore}
                  className="font-mono text-5xl font-semibold tracking-tight text-foreground"
                />
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  overall
                </span>
              </div>
              <span
                className="mast-pill inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium"
                style={{
                  color: band.color,
                  backgroundColor: `color-mix(in srgb, ${band.color} 12%, transparent)`,
                }}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: band.color }} />
                {band.label}
              </span>
            </div>
          )}
        </header>

        {/* Hero chart — huge, central, floating on an ambient field */}
        <section ref={heroRef} className="report-hero relative mb-8">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-[-4%] inset-y-[-4%] -z-10 opacity-70 blur-3xl"
            style={{
              background:
                "radial-gradient(42% 45% at 24% 20%, color-mix(in srgb, var(--psych) 24%, transparent), transparent 70%), radial-gradient(42% 48% at 80% 28%, color-mix(in srgb, var(--chart-1) 20%, transparent), transparent 72%), radial-gradient(40% 50% at 60% 90%, color-mix(in srgb, var(--chart-3) 15%, transparent), transparent 70%)",
            }}
          />
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                Performance profile
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Every standard score on one radial. Hover a domain, click to open it.
              </p>
            </div>
            <ViewModeToggle />
          </div>
          <div id="chart-container" className="relative mt-2 h-[82vh] min-h-[600px] w-full">
            <ChartDisplay evaluation={evaluation} />
          </div>
        </section>

        {/* Action bar */}
        <div className="mb-14 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {student && (
              <Link href={`/psych/evaluations/${evaluationId}/edit-scores`}>
                <Button className="inline-flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
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
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                    />
                  </svg>
                  Configure categories
                </Button>
              </Link>
            )}
          </div>
          <ExportChartButtons studentName={student?.name || evaluation.name} />
        </div>

        {/* Details: sticky spine + domain spreads */}
        <div className="grid grid-cols-12 gap-8">
          {/* Spine */}
          <aside className="col-span-12 lg:col-span-3">
            <div className="sticky top-6 space-y-6">
              <div className="relative pl-5">
                <div className="absolute bottom-1 left-0 top-1 w-0.5 overflow-hidden rounded-full bg-border">
                  <div
                    className="spine-fill absolute inset-x-0 top-0 h-full origin-top rounded-full bg-psych"
                    style={{ transform: "scaleY(0)" }}
                  />
                </div>
                <Card className="border border-border bg-card shadow-sm">
                  <div className="border-b border-border p-5">
                    <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-psych" />
                      Assessment areas
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {evaluation.categories.length}{" "}
                      {evaluation.categories.length === 1 ? "category" : "categories"}
                    </p>
                  </div>
                  <div className="p-4">
                    <PsychStudentViewClient
                      student={student!}
                      evaluation={evaluation}
                      isUniversal={isUniversal}
                      evaluationId={evaluationId}
                    />
                  </div>
                </Card>

                <div className="mt-6">
                  <SnapshotManager classId={evaluationId} />
                </div>
              </div>
            </div>
          </aside>

          {/* Report column */}
          <div className="report-col col-span-12 space-y-10 lg:col-span-9">
            {/* Domain spreads — every area, read one at a time */}
            <div>
              <div className="flex items-baseline justify-between border-b border-foreground/15 pb-3">
                <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
                  By area
                </h2>
                <span className="font-mono text-xs text-muted-foreground">
                  {domains.length} {domains.length === 1 ? "domain" : "domains"}
                </span>
              </div>
              {domains.map((d, i) => (
                <DomainSpread
                  key={d.id}
                  domain={d}
                  index={i}
                  active={selectedCategoryId === d.id}
                  onSelect={selectDomain}
                />
              ))}
            </div>

            {/* Footer */}
            <footer className="flex items-center justify-between border-t border-border pt-6">
              <p className="font-mono text-xs text-muted-foreground">
                Report generated {generatedAt}
              </p>
              <p className="font-mono text-xs text-muted-foreground/50">WiseGraph</p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
