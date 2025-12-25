// src/components/StudentHeroChartsClient.tsx
"use client";

import { useState, useMemo } from "react";
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

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

type ViewMode = "polar" | "bell" | "concentric";

interface Props {
  student: StudentScoreSummary;
  cls: ClassScoreSummary;
}

export function StudentHeroChartsClient({ student, cls }: Props) {
  const [view, setView] = useState<ViewMode>("polar");

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
          backgroundColor: "rgba(148, 163, 184, 0.1)",
          borderColor: "rgb(148, 163, 184)",
          borderWidth: 1,
          pointRadius: 2,
          pointBackgroundColor: "rgb(148, 163, 184)",
        },
        {
          label: student.name,
          data: studentScores,
          backgroundColor: "rgba(56, 189, 248, 0.2)",
          borderColor: "rgb(56, 189, 248)",
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: "rgb(56, 189, 248)",
        },
      ],
    }),
    [labels, classScores, studentScores, student.name]
  );

  const radarOptions: ChartOptions<"radar"> = {
    responsive: true,
    scales: {
      r: {
        min: 60,
        max: 150,
        ticks: {
          stepSize: 15,
          color: "#64748b",
          backdropColor: "transparent",
        },
        grid: { color: "rgba(148,163,184,0.3)" },
        angleLines: { color: "rgba(51,65,85,0.9)" },
        pointLabels: { color: "#e2e8f0", font: { size: 11 } },
      },
    },
    plugins: {
      legend: {
        display: true,
        labels: { color: "#e2e8f0", boxWidth: 10, boxHeight: 2 },
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
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium text-slate-200">
            Performance vs class
          </h2>
          <p className="text-xs text-slate-400">
            Comparison of {student.name}&apos;s scores against class averages.
          </p>
        </div>

        <div className="inline-flex rounded-md border border-slate-700 bg-slate-900 text-xs text-slate-300">
          <button
            type="button"
            onClick={() => setView("polar")}
            className={`px-2 py-1 rounded-l-md ${
              view === "polar"
                ? "bg-slate-800 text-slate-50"
                : "hover:bg-slate-800/60"
            }`}
          >
            Polar
          </button>
          <button
            type="button"
            onClick={() => setView("bell")}
            className={`px-2 py-1 ${
              view === "bell"
                ? "bg-slate-800 text-slate-50"
                : "hover:bg-slate-800/60"
            }`}
          >
            Bell
          </button>
          <button
            type="button"
            onClick={() => setView("concentric")}
            className={`px-2 py-1 rounded-r-md ${
              view === "concentric"
                ? "bg-slate-800 text-slate-50"
                : "hover:bg-slate-800/60"
            }`}
          >
            Concentric
          </button>
        </div>
      </header>

      {view === "bell" ? (
  // Bell: span the full panel
  <div className="h-80">
    <StudentBellCurveChart student={student} cls={cls} />
  </div>
) : (
  // Polar + concentric: centered
  <div className="h-80 flex items-center justify-center">
    <div className="w-full h-full max-w-md">
      {view === "polar" && (
        <Radar data={radarData} options={radarOptions} />
      )}

      {view === "concentric" && (
        <StudentConcentricPieChart student={student} cls={cls} />
      )}
    </div>
  </div>
)}

    </div>
  );
}
