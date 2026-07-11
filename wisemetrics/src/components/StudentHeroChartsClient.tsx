"use client";

import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { ClassScoreSummary, StudentScoreSummary } from "@/types/scores";
import { clampScore } from "@/lib/chartScaling";
import { Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { StudentBellCurveChart } from "@/components/charts/StudentBellCurveChart";
import { StudentConcentricPieChart } from "@/components/charts/StudentConcentricPieChart";
import { ExportButtons } from "@/components/ExportButtons";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

type ViewMode = "polar" | "bell" | "concentric";

const VIEW_MODES: { id: ViewMode; label: string }[] = [
  { id: "polar", label: "Polar" },
  { id: "bell", label: "Bell" },
  { id: "concentric", label: "Concentric" },
];

interface Props {
  student: StudentScoreSummary;
  cls: ClassScoreSummary;
  defaultView?: ViewMode; // <-- added
}

function readToken(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

export function StudentHeroChartsClient({
  student,
  cls,
  defaultView = "polar",
}: Props) {
  const [view, setView] = useState<ViewMode>(defaultView);

  const tokens = useMemo(
    () => ({
      // Fallbacks mirror the light-theme oklch tokens (used only for the
      // SSR / first-paint frame before getComputedStyle resolves the real ones).
      student: readToken("--chart-4", "oklch(0.505 0.145 28)"),
      reference: readToken("--muted-foreground", "oklch(0.505 0.014 75)"),
      grid: readToken("--border", "oklch(0.905 0.007 85)"),
      label: readToken("--muted-foreground", "oklch(0.505 0.014 75)"),
      foreground: readToken("--foreground", "oklch(0.245 0.015 75)"),
    }),
    []
  );

  const labels = useMemo(
    () => cls.categories.map((c) => c.name),
    [cls.categories]
  );

  const classScores = useMemo(
    () => cls.categories.map((c) => clampScore(c.score)),
    [cls.categories]
  );

  const studentScores = useMemo(
    () =>
      cls.categories.map((cat) => {
        const match = student.categories.find((c) => c.id === cat.id);
        return clampScore(match?.score ?? student.overallScore);
      }),
    [cls.categories, student.categories, student.overallScore]
  );

  const radarData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: "Class avg",
          data: classScores,
          backgroundColor: "transparent",
          borderColor: tokens.reference,
          borderWidth: 1,
          pointRadius: 2,
          pointBackgroundColor: tokens.reference,
        },
        {
          label: student.name,
          data: studentScores,
          backgroundColor: "color-mix(in oklch, var(--chart-4) 18%, transparent)",
          borderColor: tokens.student,
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: tokens.student,
        },
      ],
    }),
    [labels, classScores, studentScores, student.name, tokens]
  );

  const radarOptions: ChartOptions<"radar"> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        min: 60,
        max: 150,
        ticks: {
          stepSize: 15,
          color: tokens.label,
          backdropColor: "transparent",
        },
        grid: { color: tokens.grid },
        angleLines: { color: tokens.grid },
        pointLabels: { color: tokens.foreground, font: { size: 11 } },
      },
    },
    plugins: {
      legend: {
        display: true,
        labels: { color: tokens.foreground, boxWidth: 10, boxHeight: 2 },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${ctx.formattedValue}`,
        },
      },
    },
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Performance vs class
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Comparison of {student.name}&apos;s scores against class averages.
          </p>
        </div>

        <div className="inline-flex rounded-lg bg-muted p-0.5">
          {VIEW_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setView(m.id)}
              className={
                "relative rounded-md px-3 py-1 text-[11px] font-medium transition-colors duration-150 " +
                (view === m.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              {view === m.id && (
                <motion.span
                  layoutId="student-view-pill"
                  className="absolute inset-0 rounded-md bg-card shadow-sm"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10">{m.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Fixed, large height so charts are big and stable */}
      <div className="h-[420px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={view}
            className="h-full"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            {view === "bell" ? (
              <div className="h-full">
                <StudentBellCurveChart student={student} cls={cls} />
              </div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="h-full w-full max-w-xl">
                  {view === "polar" && (
                    <Radar data={radarData} options={radarOptions} />
                  )}

                  {view === "concentric" && (
                    <StudentConcentricPieChart student={student} cls={cls} />
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <ExportButtons studentName={student.name} view={view} />
    </div>
  );
}
