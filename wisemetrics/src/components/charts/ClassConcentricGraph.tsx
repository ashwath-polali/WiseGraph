"use client";

import { useMemo } from "react";
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
import { Radar } from "react-chartjs-2";
import type { ClassScoreSummary } from "@/types/scores";
import { SCOREMIN, SCOREMAX } from "@/lib/chartScaling";
  

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface Props {
  cls: ClassScoreSummary;
}

export function ClassConcentricGraph({ cls }: Props) {
  const data = useMemo(() => {
    const labels = cls.categories.map((c) => c.name);
    const scores = cls.categories.map((c) => c.score);

    return {
      labels,
      datasets: [
        {
          label: "Class average",
          data: scores,
          backgroundColor: "rgba(56, 189, 248, 0.18)", // sky-400/20
          borderColor: "rgb(56, 189, 248)",
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: "rgb(56, 189, 248)",
        },
      ],
    };
  }, [cls]);

  const options: ChartOptions<"radar"> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        min: SCOREMIN,
        max: SCOREMAX,
        ticks: {
          stepSize: 15,
          color: "#64748b",
          backdropColor: "transparent",
        },
        grid: {
          color: "rgba(148, 163, 184, 0.25)",
        },
        angleLines: {
          color: "rgba(51, 65, 85, 0.9)",
        },
        pointLabels: {
          color: "#e2e8f0",
          font: { size: 12 },
        },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.label}: ${ctx.formattedValue}`,
        },
      },
    },
  };

  return <Radar data={data} options={options} />;
}
