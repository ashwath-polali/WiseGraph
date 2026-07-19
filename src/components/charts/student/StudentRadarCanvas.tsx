"use client";

import { useEffect, useState } from "react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import {
  RING_SCORES,
  SCORE_MIN,
  categoryAngles,
  polarPoint,
  radiusForScore,
} from "@/components/charts/class/geometry";

const SIZE = 400;
const C = SIZE / 2;
const OUTER = 148;
const LABEL_R = OUTER + 26;
const ENTER = [0.22, 1, 0.36, 1] as const;

const n2 = (v: number) => Math.round(v * 100) / 100;

export type RadarCategory = {
  id: string;
  name: string;
  classScore: number;
  studentScore: number;
};

/**
 * The student-vs-class radar, rebuilt on the same d3 + motion language as the
 * class dashboard chart: dashed hairline rings, a faint class-average polygon,
 * and the student's own shape (terracotta) growing out of the center with a
 * gradient fill. Hovering a vertex reads out that category's scores.
 */
export function StudentRadarCanvas({
  categories,
  studentName,
  svgRef,
}: {
  categories: RadarCategory[];
  studentName: string;
  svgRef?: React.Ref<SVGSVGElement>;
}) {
  const n = Math.max(categories.length, 1);
  const [mounted, setMounted] = useState(false);
  const [hover, setHover] = useState<number | null>(null);

  const grow = useMotionValue(0);
  useEffect(() => {
    setMounted(true);
    const c = animate(grow, 1, { duration: 0.9, delay: 0.12, ease: ENTER });
    return () => c.stop();
  }, [grow]);

  const angleOf = (i: number) => categoryAngles(i, n).mid;
  const classPts = categories.map((c, i) =>
    polarPoint(C, C, radiusForScore(c.classScore, OUTER), angleOf(i)),
  );
  const studentFinal = categories.map((c, i) =>
    polarPoint(C, C, radiusForScore(c.studentScore, OUTER), angleOf(i)),
  );

  const studentPoly = useTransform(grow, (g) =>
    categories
      .map((c, i) => {
        const p = polarPoint(C, C, radiusForScore(c.studentScore, OUTER) * g, angleOf(i));
        return `${n2(p.x)},${n2(p.y)}`;
      })
      .join(" "),
  );
  const dotOpacity = useTransform(grow, [0.55, 1], [0, 1]);

  return (
    <div className="relative h-full w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="h-full w-full overflow-visible"
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <radialGradient id="sr-fill" gradientUnits="userSpaceOnUse" cx={C} cy={C} r={OUTER}>
            <stop offset="0%" stopColor="var(--chart-4)" stopOpacity={0.34} />
            <stop offset="65%" stopColor="var(--chart-4)" stopOpacity={0.14} />
            <stop offset="100%" stopColor="var(--chart-4)" stopOpacity={0.04} />
          </radialGradient>
        </defs>

        {/* rings */}
        {RING_SCORES.map((s) => (
          <circle
            key={s}
            cx={C}
            cy={C}
            r={Math.max(radiusForScore(s, OUTER), 0.5)}
            fill="none"
            stroke="var(--border)"
            strokeWidth={0.8}
            strokeDasharray="2 6"
          />
        ))}
        {RING_SCORES.filter((s) => s > SCORE_MIN).map((s) => (
          <text
            key={`t-${s}`}
            x={C + 4}
            y={n2(C - radiusForScore(s, OUTER)) - 3}
            className="font-mono"
            fontSize={8}
            fill="var(--muted-foreground)"
            stroke="var(--background)"
            strokeWidth={3}
            paintOrder="stroke"
            opacity={0.8}
          >
            {s}
          </text>
        ))}

        {/* spokes + labels */}
        {categories.map((c, i) => {
          const edge = polarPoint(C, C, OUTER, angleOf(i));
          const lp = polarPoint(C, C, LABEL_R, angleOf(i));
          const hangs = Math.sin(angleOf(i)) > 0.05;
          const active = hover === i;
          return (
            <g key={c.id}>
              <line
                x1={C}
                y1={C}
                x2={n2(edge.x)}
                y2={n2(edge.y)}
                stroke="var(--border)"
                strokeWidth={0.8}
              />
              <text
                x={n2(lp.x)}
                y={n2(lp.y)}
                textAnchor="middle"
                dominantBaseline={hangs ? "hanging" : "auto"}
                fontSize={10.5}
                fontWeight={active ? 700 : 600}
                fill={active ? "var(--foreground)" : "var(--muted-foreground)"}
              >
                {c.name}
              </text>
            </g>
          );
        })}

        {mounted && (
          <>
            {/* class-average reference polygon */}
            <polygon
              points={classPts.map((p) => `${n2(p.x)},${n2(p.y)}`).join(" ")}
              fill="none"
              stroke="var(--muted-foreground)"
              strokeWidth={1.4}
              strokeDasharray="4 4"
              strokeLinejoin="round"
              opacity={0.7}
            />

            {/* student polygon — grows from the center */}
            <motion.polygon
              points={studentPoly}
              fill="url(#sr-fill)"
              stroke="var(--chart-4)"
              strokeWidth={2}
              strokeLinejoin="round"
            />

            {/* vertices */}
            {studentFinal.map((p, i) => {
              const active = hover === i;
              return (
                <motion.circle
                  key={categories[i].id}
                  cx={n2(p.x)}
                  cy={n2(p.y)}
                  r={active ? 5 : 3.6}
                  fill="var(--chart-4)"
                  stroke="var(--card)"
                  strokeWidth={1.6}
                  style={{ opacity: dotOpacity }}
                  className="cursor-pointer"
                  onMouseEnter={() => setHover(i)}
                />
              );
            })}
          </>
        )}
      </svg>

      {/* hover readout */}
      {hover !== null && categories[hover] && (
        <div className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 rounded-md border border-border bg-popover px-3 py-1.5 text-center shadow-sm">
          <div className="text-[11px] font-semibold text-foreground">
            {categories[hover].name}
          </div>
          <div className="mt-0.5 flex items-center gap-2 font-mono text-[10px]" data-numeric>
            <span className="text-[color:var(--chart-4)]">
              {studentName.split(" ")[0]} {Math.round(categories[hover].studentScore)}
            </span>
            <span className="text-muted-foreground">
              Class {Math.round(categories[hover].classScore)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
