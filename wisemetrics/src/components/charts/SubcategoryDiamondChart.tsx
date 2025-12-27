import { useMemo } from "react";
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
import type { SubcategoryScore } from "@/types/scores";
import { clampScore } from "@/lib/chartScaling";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface Props {
  subskills: SubcategoryScore[];
}

export function SubcategoryDiamondChart({ subskills }: Props) {
  const labels = useMemo(
    () => subskills.map((s) => s.name),
    [subskills]
  );

  const scores = useMemo(
    () => subskills.map((s) => clampScore(s.score)),
    [subskills]
  );

  const data = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: "Subskills",
          data: scores,
          backgroundColor: "rgba(56, 189, 248, 0.18)",
          borderColor: "rgb(56, 189, 248)",
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: "rgb(56, 189, 248)",
        },
      ],
    }),
    [labels, scores]
  );

  const options: ChartOptions<"radar"> = {
    responsive: true,
    maintainAspectRatio: false, // key for stable height
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
        pointLabels: {
          color: "#e2e8f0",
          font: { size: 10 },
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.label}: ${ctx.formattedValue}`,
        },
      },
    },
  };

  return (
    <div className="h-full w-full">
      <Radar data={data} options={options} />
    </div>
  );
}
