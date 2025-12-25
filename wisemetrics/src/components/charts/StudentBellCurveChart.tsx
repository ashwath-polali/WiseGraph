// src/components/charts/StudentBellCurveChart.tsx
"use client";

import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import type { ClassScoreSummary, StudentScoreSummary } from "@/types/scores";
import { clampScore, classifyScore } from "@/lib/chartScaling";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

interface Props {
  student: StudentScoreSummary;
  cls: ClassScoreSummary;
}

function normalPdf(x: number, mean: number, sd: number): number {
  const coef = 1 / (sd * Math.sqrt(2 * Math.PI));
  const exp = Math.exp(-0.5 * Math.pow((x - mean) / sd, 2));
  return coef * exp;
}

export function StudentBellCurveChart({ student, cls }: Props) {
  const studentScore = clampScore(student.overallScore);

  const classMean = useMemo(() => {
    if (cls.students.length === 0) return 100;
    const sum = cls.students.reduce((acc, s) => acc + s.overallScore, 0);
    return clampScore(Math.round(sum / cls.students.length));
  }, [cls.students]);

  const mean = classMean;
  const sd = 15;

  const labels = useMemo(() => {
    const vals: number[] = [];
    for (let s = 60; s <= 150; s += 2) {
      vals.push(s);
    }
    return vals;
  }, []);

  const maxDensity = useMemo(() => {
    let max = 0;
    for (const x of labels) {
      const d = normalPdf(x, mean, sd);
      if (d > max) max = d;
    }
    return max;
  }, [labels, mean, sd]);

  const studentBandColor = useMemo(() => {
    const band = classifyScore(studentScore);
    if (band === "below-average") return "rgba(239,68,68,0.9)";
    if (band === "average") return "rgba(56,189,248,0.9)";
    if (band === "above-average") return "rgba(129,140,248,0.9)";
    return "rgba(236,72,153,0.9)";
  }, [studentScore]);

  const data = useMemo(
    () => ({
      labels: labels.map(String),
      datasets: [
        {
          label: "Class distribution",
          data: labels.map((x) => normalPdf(x, mean, sd) / maxDensity),
          borderColor: "rgb(148, 163, 184)",
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.25,
        },
        {
          // Student vertical spike
          label: "Student score",
          data: labels.map((x) =>
            x === studentScore ? 1.05 : 0
          ),
          borderColor: studentBandColor,
          borderWidth: 2,
          pointRadius: 0,
        },
        {
          // Class mean vertical spike
          label: "Class mean",
          data: labels.map((x) =>
            x === classMean ? 1.0 : 0
          ),
          borderColor: "rgba(250,204,21,0.9)",
          borderWidth: 2,
          pointRadius: 0,
        },
      ],
    }),
    [labels, mean, sd, maxDensity, studentScore, classMean, studentBandColor]
  );

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        title: {
          display: true,
          text: "Standard score",
          color: "#94a3b8",
        },
        ticks: {
          color: "#94a3b8",
          maxRotation: 0,
        },
        grid: {
          color: "rgba(30,41,59,0.7)",
        },
      },
      y: {
        display: false,
        min: 0,
        max: 1.2,
      },
    },
    plugins: {
      legend: {
        labels: {
          color: "#e2e8f0",
          boxWidth: 10,
          boxHeight: 2,
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const xVal = labels[ctx.dataIndex];
            if (ctx.dataset.label === "Class distribution") {
              return `Standard score ${xVal}`;
            }
            if (ctx.dataset.label === "Student score") {
              return `Student: ${studentScore}`;
            }
            if (ctx.dataset.label === "Class mean") {
              return `Class mean: ${classMean}`;
            }
            return "";
          },
        },
      },
    },
  };

  return <Line data={data} options={options} />;
}
