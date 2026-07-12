"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { ClassScoreSummary, StudentScoreSummary } from "@/types/scores";
import { clampScore } from "@/lib/chartScaling";
import { StudentBellCurveChart } from "@/components/charts/StudentBellCurveChart";
import { StudentConcentricPieChart } from "@/components/charts/StudentConcentricPieChart";
import {
  StudentRadarCanvas,
  type RadarCategory,
} from "@/components/charts/student/StudentRadarCanvas";
import { ExportButtons } from "@/components/ExportButtons";

type ViewMode = "polar" | "bell" | "concentric";

const VIEW_MODES: { id: ViewMode; label: string }[] = [
  { id: "polar", label: "Polar" },
  { id: "bell", label: "Bell" },
  { id: "concentric", label: "Concentric" },
];

interface Props {
  student: StudentScoreSummary;
  cls: ClassScoreSummary;
  defaultView?: ViewMode;
}

export function StudentHeroChartsClient({
  student,
  cls,
  defaultView = "polar",
}: Props) {
  const [view, setView] = useState<ViewMode>(defaultView);
  const chartRef = useRef<HTMLDivElement | null>(null);

  const radarCategories: RadarCategory[] = useMemo(
    () =>
      cls.categories.map((cat) => {
        const match = student.categories.find((c) => c.id === cat.id);
        return {
          id: cat.id,
          name: cat.name,
          classScore: clampScore(cat.score),
          studentScore: clampScore(match?.score ?? student.overallScore),
        };
      }),
    [cls.categories, student.categories, student.overallScore],
  );

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            {student.name} vs the class
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Each spoke is a category. The filled shape is {student.name}; the
            dashed one is the class average.
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

      <div ref={chartRef} className="student-hero-chart h-[420px] rounded-lg">
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
            ) : view === "concentric" ? (
              <div className="flex h-full items-center justify-center">
                <div className="h-full w-full max-w-xl">
                  <StudentConcentricPieChart student={student} cls={cls} />
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="h-full w-full max-w-md">
                  <StudentRadarCanvas
                    categories={radarCategories}
                    studentName={student.name}
                  />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <ExportButtons
        studentName={student.name}
        view={view}
        targetRef={chartRef}
      />
    </div>
  );
}
