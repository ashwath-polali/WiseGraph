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

function readToken(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

// Apply alpha to a resolved oklch token without mixing with `transparent`
// (which premultiplies toward black and mudds the fill).
function withAlpha(color: string, a: number): string {
  const t = color.trim();
  if (t.startsWith("oklch(") && t.endsWith(")") && !t.includes("/")) {
    return `${t.slice(0, -1)} / ${a})`;
  }
  return `color-mix(in srgb, ${t} ${Math.round(a * 100)}%, transparent)`;
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

  // Student series = terracotta (--chart-4), matching the hero radar above.
  const tokens = useMemo(
    () => ({
      student: readToken("--chart-4", "oklch(0.505 0.145 28)"),
      grid: readToken("--border", "oklch(0.905 0.007 85)"),
      label: readToken("--muted-foreground", "oklch(0.505 0.014 75)"),
      foreground: readToken("--foreground", "oklch(0.245 0.015 75)"),
    }),
    []
  );

  const data = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: "Subskills",
          data: scores,
          backgroundColor: withAlpha(tokens.student, 0.15),
          borderColor: tokens.student,
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: tokens.student,
        },
      ],
    }),
    [labels, scores, tokens]
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
          color: tokens.label,
          backdropColor: "transparent",
        },
        grid: { color: tokens.grid },
        angleLines: { color: tokens.grid },
        pointLabels: {
          color: tokens.foreground,
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
