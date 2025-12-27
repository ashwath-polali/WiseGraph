"use client";

import { useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import type { ClassScoreSummary, StudentScoreSummary } from "@/types/scores";
import { clampScore } from "@/lib/chartScaling";

ChartJS.register(ArcElement, Tooltip, Legend);

interface Props {
  student: StudentScoreSummary;
  cls: ClassScoreSummary; 
}

export function StudentConcentricPieChart({ student }: Props) {
  const labels = useMemo(
    () => student.categories.map((c) => c.name),
    [student.categories]
  );

  const values = useMemo(
    () => student.categories.map((c) => clampScore(c.score)),
    [student.categories]
  );

  const data = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: "Category emphasis",
          data: values,
          backgroundColor: [
            "rgba(56,189,248,0.75)",
            "rgba(129,140,248,0.75)",
            "rgba(45,212,191,0.75)",
            "rgba(244,114,182,0.75)",
            "rgba(250,204,21,0.75)",
            "rgba(96,165,250,0.75)",
          ],
          borderColor: "rgba(15,23,42,1)",
          borderWidth: 2,
        },
      ],
    }),
    [labels, values]
  );

  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "55%",
    plugins: {
      legend: {
        position: "right",
        labels: {
          color: "#e2e8f0",
          boxWidth: 10,
          boxHeight: 10,
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const label = ctx.label ?? "";
            const value = ctx.raw as number;
            return `${label}: ${value}`;
          },
        },
      },
    },
  };

  return <Doughnut data={data} options={options} />;
}
