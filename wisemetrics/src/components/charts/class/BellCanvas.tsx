"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import { area, line, curveMonotoneX } from "d3-shape";
import { scaleLinear } from "d3-scale";
import type { StudentScoreSummary } from "@/types/scores";
import {
  MEAN,
  SD,
  SCORE_MIN,
  SCORE_MAX,
  jitterForKey,
  normalPdf,
  type CategoryView,
} from "./geometry";
import { SERIES, wedgeColor } from "./palette";
import type { ViewMode } from "./controls";

const W = 560;
const H = 300;
const ML = 46;
const MR = 26;
const MT = 30;
const MB = 56;
const AXIS_Y = H - MB;

export type BellActiveDot = {
  kind: "overall" | "category" | "subskill";
  studentId: string;
  categoryId?: string;
  subcategoryId?: string;
};

type Pt = { x: number; y: number };

type BellCanvasProps = {
  categories: CategoryView[];
  students: StudentScoreSummary[];
  viewMode: ViewMode;
  selectedStudent: StudentScoreSummary | null;
  classOverallMean: number;
  hoveredCategoryId: string | null;
  setHoveredCategoryId: (id: string | null) => void;
  activeDot: BellActiveDot | null;
  setActiveDot: (dot: BellActiveDot | null) => void;
  svgRef?: React.Ref<SVGSVGElement>;
};

export function BellCanvas({
  categories,
  students,
  viewMode,
  selectedStudent,
  classOverallMean,
  hoveredCategoryId,
  setHoveredCategoryId,
  activeDot,
  setActiveDot,
  svgRef,
}: BellCanvasProps) {
  const x = useMemo(
    () =>
      scaleLinear().domain([SCORE_MIN, SCORE_MAX]).range([ML, W - MR]).clamp(true),
    [],
  );

  const { curveD, areaD, yForScore } = useMemo(() => {
    const steps = 180;
    const samples: Pt[] = [];
    let maxPdf = 1e-6;
    const pdfs: number[] = [];
    for (let i = 0; i <= steps; i++) {
      const s = SCORE_MIN + (i / steps) * (SCORE_MAX - SCORE_MIN);
      const pdf = normalPdf(s, MEAN, SD);
      pdfs.push(pdf);
      if (pdf > maxPdf) maxPdf = pdf;
      samples.push({ x: x(s), y: pdf });
    }

    const usable = H - MT - MB;
    const yFromPdf = (pdf: number) => MT + (1 - pdf / maxPdf) * usable;
    for (const p of samples) p.y = yFromPdf(p.y);

    const lineGen = line<Pt>().x((p) => p.x).y((p) => p.y).curve(curveMonotoneX);
    const areaGen = area<Pt>()
      .x((p) => p.x)
      .y0(AXIS_Y)
      .y1((p) => p.y)
      .curve(curveMonotoneX);

    return {
      curveD: lineGen(samples) ?? "",
      areaD: areaGen(samples) ?? "",
      yForScore: (score: number) => yFromPdf(normalPdf(score, MEAN, SD)),
    };
  }, [x]);

  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="h-full w-full">
      <defs>
        <linearGradient id="bell-area-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* average range band: the ±1 SD window parents hear about in conferences */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <rect
          x={x(85)}
          y={MT - 4}
          width={x(115) - x(85)}
          height={AXIS_Y - MT + 4}
          fill="var(--muted)"
          opacity={0.55}
        />
        <text
          x={x(85) + 5}
          y={MT + 6}
          textAnchor="start"
          className="font-mono"
          fontSize={8}
          fill="var(--muted-foreground)"
          opacity={0.8}
          letterSpacing="0.08em"
        >
          AVERAGE RANGE 85-115
        </text>
      </motion.g>

      {/* x axis */}
      <line
        x1={ML}
        y1={AXIS_Y}
        x2={W - MR}
        y2={AXIS_Y}
        stroke="var(--border)"
        strokeWidth={1}
      />
      {Array.from({ length: 10 }).map((_, i) => {
        const score = SCORE_MIN + i * ((SCORE_MAX - SCORE_MIN) / 9);
        return (
          <g key={score}>
            <line
              x1={x(score)}
              y1={AXIS_Y}
              x2={x(score)}
              y2={AXIS_Y + 4}
              stroke="var(--border)"
              strokeWidth={1}
            />
            <text
              x={x(score)}
              y={AXIS_Y + 15}
              textAnchor="middle"
              className="font-mono"
              fontSize={8.5}
              fill="var(--muted-foreground)"
            >
              {Math.round(score)}
            </text>
          </g>
        );
      })}

      {/* the curve */}
      <motion.path
        d={areaD}
        fill="url(#bell-area-fill)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.5, ease: "easeOut" }}
      />
      <motion.path
        d={curveD}
        fill="none"
        stroke="var(--chart-1)"
        strokeWidth={1.75}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      />

      {/* class overall mean */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.3, ease: "easeOut" }}
      >
        <line
          x1={x(classOverallMean)}
          y1={MT}
          x2={x(classOverallMean)}
          y2={AXIS_Y}
          stroke="var(--muted-foreground)"
          strokeOpacity={0.6}
          strokeDasharray="4 3"
          strokeWidth={1}
        />
        <text
          x={x(classOverallMean)}
          y={MT - 8}
          textAnchor="middle"
          fontSize={9.5}
          fill="var(--muted-foreground)"
        >
          Class overall
        </text>
      </motion.g>

      {/* category means on the curve (average + compare) */}
      {(viewMode === "average" || viewMode === "compare") && (
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3, ease: "easeOut" }}
        >
          {(() => {
            // Class means bunch up near 100, so alternate label rows by
            // x-order — neighbors never share a row.
            const rowById = new Map(
              [...categories]
                .sort((a, b) => a.avgScore - b.avgScore)
                .map((c, i) => [c.id, i % 2] as const),
            );
            return categories.map((cat, idx) => {
            const cx = x(cat.avgScore);
            const cy = yForScore(cat.avgScore);
            const isHovered = hoveredCategoryId === cat.id;
            const color = wedgeColor(idx);

            return (
              <g
                key={cat.id}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredCategoryId(cat.id)}
                onMouseLeave={() => setHoveredCategoryId(null)}
              >
                <line
                  x1={cx}
                  y1={cy}
                  x2={cx}
                  y2={AXIS_Y}
                  stroke={color}
                  strokeOpacity={isHovered ? 0.6 : 0.35}
                  strokeDasharray="3 3"
                  strokeWidth={1}
                />
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 4.5 : 3.5}
                  fill={color}
                  stroke="var(--card)"
                  strokeWidth={1.2}
                />
                <text
                  x={cx}
                  y={AXIS_Y + (rowById.get(cat.id) === 0 ? 27 : 38)}
                  textAnchor="middle"
                  fontSize={9}
                  fontWeight={600}
                  fill={isHovered ? color : "var(--foreground)"}
                  letterSpacing="0.04em"
                >
                  {cat.abbrev}
                </text>
              </g>
            );
            });
          })()}

          {/* class subskill means, faint */}
          {categories.flatMap((cat) =>
            cat.classSubs.map((sub) => {
              const sx = x(sub.score);
              const sy =
                yForScore(sub.score) +
                jitterForKey(`class-sub-${cat.id}-${sub.id}`, 3);
              return (
                <circle
                  key={`class-sub-${cat.id}-${sub.id}`}
                  cx={sx}
                  cy={sy}
                  r={1.6}
                  fill={SERIES.subskill}
                  opacity={0.5}
                />
              );
            }),
          )}
        </motion.g>
      )}

      {/* every student as dots (students mode) */}
      {viewMode === "students" && (
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          {students.map((s) => {
            const px = x(s.overallScore);
            const py =
              yForScore(s.overallScore) + jitterForKey(`overall-${s.id}`);
            const active =
              !!activeDot &&
              activeDot.kind === "overall" &&
              activeDot.studentId === s.id;
            return (
              <circle
                key={`overall-${s.id}`}
                cx={px}
                cy={py}
                r={active ? 3.4 : 2.6}
                fill={SERIES.student}
                stroke="var(--card)"
                strokeWidth={active ? 1.2 : 0.8}
                className="cursor-pointer"
                onClick={() => setActiveDot({ kind: "overall", studentId: s.id })}
              />
            );
          })}

          {students.flatMap((s) =>
            s.categories.map((cat) => {
              const px = x(cat.score);
              const py =
                yForScore(cat.score) + jitterForKey(`cat-${s.id}-${cat.id}`, 5);
              const active =
                !!activeDot &&
                activeDot.kind === "category" &&
                activeDot.studentId === s.id &&
                activeDot.categoryId === cat.id;
              return (
                <circle
                  key={`cat-${s.id}-${cat.id}`}
                  cx={px}
                  cy={py}
                  r={active ? 3 : 2.2}
                  fill={SERIES.category}
                  stroke="var(--card)"
                  strokeWidth={active ? 1.1 : 0.7}
                  opacity={0.92}
                  className="cursor-pointer"
                  onClick={() =>
                    setActiveDot({
                      kind: "category",
                      studentId: s.id,
                      categoryId: cat.id,
                    })
                  }
                />
              );
            }),
          )}

          {students.flatMap((s) =>
            s.categories.flatMap((cat) =>
              (cat.subcategories ?? []).map((sub) => {
                const px = x(sub.score);
                const py =
                  yForScore(sub.score) + jitterForKey(`sub-${s.id}-${sub.id}`, 4);
                const active =
                  !!activeDot &&
                  activeDot.kind === "subskill" &&
                  activeDot.studentId === s.id &&
                  activeDot.subcategoryId === sub.id;
                return (
                  <circle
                    key={`sub-${s.id}-${sub.id}`}
                    cx={px}
                    cy={py}
                    r={active ? 2.4 : 1.7}
                    fill={SERIES.subskill}
                    stroke={active ? "var(--card)" : "none"}
                    strokeWidth={active ? 0.9 : 0}
                    opacity={0.9}
                    className="cursor-pointer"
                    onClick={() =>
                      setActiveDot({
                        kind: "subskill",
                        studentId: s.id,
                        categoryId: cat.id,
                        subcategoryId: sub.id,
                      })
                    }
                  />
                );
              }),
            ),
          )}
        </motion.g>
      )}

      {/* one student against the curve (compare mode) */}
      {viewMode === "compare" && selectedStudent && (
        <motion.g
          key={selectedStudent.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <line
            x1={x(selectedStudent.overallScore)}
            y1={MT}
            x2={x(selectedStudent.overallScore)}
            y2={AXIS_Y}
            stroke={SERIES.student}
            strokeWidth={2}
          />
          {(() => {
            const sx = x(selectedStudent.overallScore);
            const labelX = sx + 8;
            const labelY = MT - 14;
            return (
              <>
                <line
                  x1={sx}
                  y1={MT - 4}
                  x2={labelX}
                  y2={labelY + 2}
                  stroke={SERIES.student}
                  strokeOpacity={0.7}
                  strokeWidth={1}
                />
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="start"
                  fontSize={9.5}
                  fontWeight={600}
                  fill={SERIES.student}
                >
                  {selectedStudent.name}
                </text>
              </>
            );
          })()}

          {selectedStudent.categories.map((cat) => {
            const px = x(cat.score);
            const py =
              yForScore(cat.score) +
              jitterForKey(`cmp-cat-${selectedStudent.id}-${cat.id}`, 3);
            return (
              <circle
                key={`cmp-cat-${cat.id}`}
                cx={px}
                cy={py}
                r={2.6}
                fill={SERIES.category}
                stroke="var(--card)"
                strokeWidth={0.8}
                opacity={0.85}
              />
            );
          })}

          {selectedStudent.categories.flatMap((cat) =>
            (cat.subcategories ?? []).map((sub) => {
              const px = x(sub.score);
              const py =
                yForScore(sub.score) +
                jitterForKey(`cmp-sub-${selectedStudent.id}-${sub.id}`, 2.5);
              return (
                <circle
                  key={`cmp-sub-${sub.id}`}
                  cx={px}
                  cy={py}
                  r={2}
                  fill={SERIES.subskill}
                  opacity={0.6}
                />
              );
            }),
          )}
        </motion.g>
      )}
    </svg>
  );
}
