"use client";

import { useEffect } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useTransform,
} from "motion/react";
import type { StudentScoreSummary, SubcategoryScore } from "@/types/scores";
import {
  RING_SCORES,
  SCORE_MIN,
  bandAngles,
  categoryAngles,
  polarPoint,
  radiusForScore,
  subskillBand,
  toPolyline,
  wedgePath,
  type CategoryView,
} from "./geometry";
import { SERIES, wedgeColor } from "./palette";
import { useCountUp, type ViewMode } from "./controls";

const SIZE = 520;
const CENTER = SIZE / 2;
const OUTER = 210;
const LABEL_R = OUTER + 24;
const ENTER_EASE = [0.22, 1, 0.36, 1] as const;

export type RadialActiveDot = {
  kind: "category" | "subskill";
  studentId: string;
  categoryId: string;
  subskillId?: string;
};

type CanvasProps = {
  categories: CategoryView[];
  students: StudentScoreSummary[];
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  viewMode: ViewMode;
  selectedStudent: StudentScoreSummary | null;
  drillCategoryId: string | null;
  onDrillToggle: (id: string) => void;
  activeSubskillId: string | null;
  setActiveSubskillId: (id: string | null) => void;
  activeDot: RadialActiveDot | null;
  setActiveDot: (dot: RadialActiveDot | null) => void;
  svgRef?: React.Ref<SVGSVGElement>;
};

export function RadialCanvas({
  categories,
  students,
  hoveredId,
  setHoveredId,
  viewMode,
  selectedStudent,
  drillCategoryId,
  onDrillToggle,
  activeSubskillId,
  setActiveSubskillId,
  activeDot,
  setActiveDot,
  svgRef,
}: CanvasProps) {
  const isDrill = drillCategoryId != null;
  const drillIdx = categories.findIndex((c) => c.id === drillCategoryId);
  const drillCat = drillIdx >= 0 ? categories[drillIdx] : null;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="h-full w-full"
      onMouseLeave={() => {
        if (!isDrill) setHoveredId(null);
      }}
    >
      <g transform={`translate(${CENTER} ${CENTER})`}>
        <RingGrid />

        {/* origin */}
        <circle r={7} fill="var(--primary)" opacity={0.08} />
        <circle r={2.5} fill="var(--primary)" />

        <AnimatePresence mode="wait" initial={false}>
          {isDrill && drillCat ? (
            <motion.g
              key={`drill-${drillCat.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              <DrillWedge
                cat={drillCat}
                idx={drillIdx}
                viewMode={viewMode}
                selectedStudent={selectedStudent}
                activeSubskillId={activeSubskillId}
                setActiveSubskillId={setActiveSubskillId}
              />
            </motion.g>
          ) : (
            <motion.g
              key="all-categories"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              {categories.map((cat, idx) => (
                <Wedge
                  key={cat.id}
                  cat={cat}
                  idx={idx}
                  count={categories.length}
                  isHovered={hoveredId === cat.id}
                  viewMode={viewMode}
                  selectedStudent={selectedStudent}
                  activeSubskillId={activeSubskillId}
                  setActiveSubskillId={setActiveSubskillId}
                  onHover={setHoveredId}
                  onDrill={onDrillToggle}
                />
              ))}

              {viewMode === "students" && (
                <DotsLayer
                  categories={categories}
                  students={students}
                  activeDot={activeDot}
                  setActiveDot={setActiveDot}
                  setActiveSubskillId={setActiveSubskillId}
                />
              )}

              {viewMode === "compare" && selectedStudent && (
                <CompareLine
                  categories={categories}
                  student={selectedStudent}
                />
              )}
            </motion.g>
          )}
        </AnimatePresence>
      </g>
    </svg>
  );
}

function RingGrid() {
  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {RING_SCORES.map((score) => {
        const r = radiusForScore(score, OUTER);
        return (
          <g key={score}>
            <circle
              r={Math.max(r, 0.5)}
              fill="none"
              stroke="var(--border)"
              strokeWidth={0.8}
              strokeDasharray="2 5"
            />
            {score > SCORE_MIN && (
              <text
                x={4}
                y={-r - 3}
                className="font-mono"
                fontSize={8}
                fill="var(--muted-foreground)"
                stroke="var(--background)"
                strokeWidth={3}
                paintOrder="stroke"
                opacity={0.85}
              >
                {score}
              </text>
            )}
          </g>
        );
      })}
    </motion.g>
  );
}

type WedgeProps = {
  cat: CategoryView;
  idx: number;
  count: number;
  isHovered: boolean;
  viewMode: ViewMode;
  selectedStudent: StudentScoreSummary | null;
  activeSubskillId: string | null;
  setActiveSubskillId: (id: string | null) => void;
  onHover: (id: string) => void;
  onDrill: (id: string) => void;
};

function Wedge({
  cat,
  idx,
  count,
  isHovered,
  viewMode,
  selectedStudent,
  activeSubskillId,
  setActiveSubskillId,
  onHover,
  onDrill,
}: WedgeProps) {
  const { start, end, mid } = categoryAngles(idx, count);
  const rTarget = radiusForScore(cat.avgScore, OUTER);
  const color = wedgeColor(idx);

  // Radius grows from the center on mount, staggered across wedges.
  const r = useMotionValue(0);
  useEffect(() => {
    const controls = animate(r, rTarget, {
      delay: idx * 0.06,
      duration: 0.6,
      ease: ENTER_EASE,
    });
    return () => controls.stop();
  }, [r, rTarget, idx]);
  const d = useTransform(r, (rv) => wedgePath(rv, start, end));

  const explode = isHovered ? 10 : 0;
  const dx = Math.cos(mid) * explode;
  const dy = Math.sin(mid) * explode;

  const labelP = polarPoint(0, 0, LABEL_R, mid);
  const pillP = polarPoint(0, 0, rTarget + 16, mid);
  const hangs = Math.sin(mid) > 0.05;
  const score = useCountUp(cat.avgScore);

  const studentCat =
    selectedStudent?.categories.find((c) => c.id === cat.id) ?? null;
  const showBand =
    isHovered && (viewMode === "average" || viewMode === "compare");

  return (
    <motion.g
      animate={{ x: dx, y: dy }}
      transition={{ type: "spring", stiffness: 350, damping: 26 }}
      className="cursor-pointer"
      onMouseEnter={() => onHover(cat.id)}
      onClick={() => onDrill(cat.id)}
    >
      <motion.path
        d={d}
        fill={color}
        stroke={color}
        strokeLinejoin="round"
        animate={{
          fillOpacity: isHovered ? 0.3 : 0.16,
          strokeWidth: isHovered ? 1.6 : 1.1,
          strokeOpacity: isHovered ? 1 : 0.75,
        }}
        transition={{ duration: 0.15, ease: "easeOut" }}
      />

      {/* abbreviation + score pill */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: idx * 0.06 + 0.3, duration: 0.3, ease: "easeOut" }}
      >
        <text
          x={labelP.x}
          y={labelP.y}
          textAnchor="middle"
          dominantBaseline={hangs ? "hanging" : "auto"}
          fontSize={10.5}
          fontWeight={600}
          fill="var(--foreground)"
          letterSpacing="0.04em"
        >
          {cat.abbrev}
        </text>

        <g transform={`translate(${pillP.x} ${pillP.y})`}>
          <rect
            x={-15}
            y={-8.5}
            width={30}
            height={17}
            rx={8.5}
            fill="var(--card)"
            stroke={isHovered ? color : "var(--border)"}
            strokeWidth={isHovered ? 1 : 0.8}
          />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            className="font-mono"
            fontSize={9.5}
            fontWeight={600}
            fill="var(--foreground)"
          >
            {score}
          </text>
        </g>
      </motion.g>

      {showBand && (
        <SubskillBandLayer
          classSubs={cat.classSubs}
          studentSubs={
            viewMode === "compare"
              ? (studentCat?.subcategories ?? [])
              : []
          }
          showStudent={viewMode === "compare" && !!selectedStudent}
          start={start}
          end={end}
          activeSubskillId={activeSubskillId}
          setActiveSubskillId={setActiveSubskillId}
        />
      )}
    </motion.g>
  );
}

type BandLayerProps = {
  classSubs: SubcategoryScore[];
  studentSubs: SubcategoryScore[];
  showStudent: boolean;
  start: number;
  end: number;
  activeSubskillId: string | null;
  setActiveSubskillId: (id: string | null) => void;
};

function SubskillBandLayer({
  classSubs,
  studentSubs,
  showStudent,
  start,
  end,
  activeSubskillId,
  setActiveSubskillId,
}: BandLayerProps) {
  const { classPts, studentPts, basePts } = subskillBand({
    classSubs,
    studentSubs: showStudent ? studentSubs : [],
    start,
    end,
    maxRadius: OUTER,
    cx: 0,
    cy: 0,
  });

  if (!classPts.length && !studentPts.length) return null;

  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      {classPts.length > 1 && (
        <polyline
          points={toPolyline(classPts)}
          fill="none"
          stroke={SERIES.classLine}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.8}
        />
      )}

      {showStudent && basePts.length > 1 && (
        <polyline
          points={toPolyline(basePts)}
          fill="none"
          stroke={SERIES.classLine}
          strokeWidth={1}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.4}
        />
      )}
      {showStudent && studentPts.length > 1 && (
        <polyline
          points={toPolyline(studentPts)}
          fill="none"
          stroke={SERIES.student}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {classPts.map((pt) => {
        const active = activeSubskillId === pt.id;
        return (
          <circle
            key={`class-pt-${pt.id}`}
            cx={pt.x}
            cy={pt.y}
            r={active ? 4 : 3}
            fill={active ? "var(--foreground)" : "var(--muted-foreground)"}
            stroke="var(--card)"
            strokeWidth={1}
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setActiveSubskillId(active ? null : pt.id);
            }}
          />
        );
      })}

      {showStudent &&
        studentPts.map((pt) => {
          const active = activeSubskillId === pt.id;
          return (
            <circle
              key={`student-pt-${pt.id}`}
              cx={pt.x}
              cy={pt.y}
              r={active ? 4 : 3}
              fill={SERIES.student}
              stroke="var(--card)"
              strokeWidth={active ? 1.4 : 1}
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setActiveSubskillId(active ? null : pt.id);
              }}
            />
          );
        })}
    </motion.g>
  );
}

type DotsLayerProps = {
  categories: CategoryView[];
  students: StudentScoreSummary[];
  activeDot: RadialActiveDot | null;
  setActiveDot: (dot: RadialActiveDot | null) => void;
  setActiveSubskillId: (id: string | null) => void;
};

function DotsLayer({
  categories,
  students,
  activeDot,
  setActiveDot,
  setActiveSubskillId,
}: DotsLayerProps) {
  const count = categories.length;

  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {/* one dot per student per category, along the wedge midline */}
      {students.flatMap((s) =>
        categories.map((cat, idx) => {
          const catScore = s.categories.find((c) => c.id === cat.id);
          if (!catScore) return null;
          const { mid } = categoryAngles(idx, count);
          const p = polarPoint(0, 0, radiusForScore(catScore.score, OUTER), mid);
          const active =
            !!activeDot &&
            activeDot.kind === "category" &&
            activeDot.studentId === s.id &&
            activeDot.categoryId === cat.id;
          return (
            <circle
              key={`cat-${s.id}-${cat.id}`}
              cx={p.x}
              cy={p.y}
              r={active ? 3.4 : 2.6}
              fill={SERIES.category}
              stroke="var(--card)"
              strokeWidth={active ? 1.2 : 0.8}
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                setActiveDot({
                  kind: "category",
                  studentId: s.id,
                  categoryId: cat.id,
                });
                setActiveSubskillId(null);
              }}
            />
          );
        }),
      )}

      {/* one small dot per student per subskill, spread across the wedge */}
      {students.flatMap((s) =>
        categories.map((cat, idx) => {
          const stuCat = s.categories.find((c) => c.id === cat.id) ?? null;
          const studentSubs = stuCat?.subcategories ?? [];
          if (!cat.classSubs.length && !studentSubs.length) return null;

          const { start, end } = categoryAngles(idx, count);
          const n = Math.max(cat.classSubs.length, studentSubs.length, 1);
          const angles = bandAngles(start, end, n);

          const dots: React.ReactNode[] = [];
          for (let i = 0; i < n; i++) {
            const sub = studentSubs[i];
            if (!sub) continue;
            const p = polarPoint(0, 0, radiusForScore(sub.score, OUTER), angles[i]);
            const active =
              !!activeDot &&
              activeDot.kind === "subskill" &&
              activeDot.studentId === s.id &&
              activeDot.categoryId === cat.id &&
              activeDot.subskillId === sub.id;
            dots.push(
              <circle
                key={`sub-${s.id}-${cat.id}-${sub.id}`}
                cx={p.x}
                cy={p.y}
                r={active ? 2.2 : 1.6}
                fill={SERIES.subskill}
                stroke="var(--card)"
                strokeWidth={active ? 0.9 : 0.5}
                opacity={0.95}
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveDot({
                    kind: "subskill",
                    studentId: s.id,
                    categoryId: cat.id,
                    subskillId: sub.id,
                  });
                  setActiveSubskillId(sub.id);
                }}
              />,
            );
          }
          return <g key={`sub-group-${s.id}-${cat.id}`}>{dots}</g>;
        }),
      )}
    </motion.g>
  );
}

function CompareLine({
  categories,
  student,
}: {
  categories: CategoryView[];
  student: StudentScoreSummary;
}) {
  const pts = categories
    .map((cat, idx) => {
      const catScore = student.categories.find((c) => c.id === cat.id);
      if (!catScore) return null;
      const { mid } = categoryAngles(idx, categories.length);
      return polarPoint(0, 0, radiusForScore(catScore.score, OUTER), mid);
    })
    .filter((p): p is { x: number; y: number } => p !== null);

  if (!pts.length) return null;

  return (
    <g>
      <motion.polyline
        key={`line-${student.id}`}
        points={toPolyline(pts)}
        fill="none"
        stroke={SERIES.student}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
      {pts.map((p, i) => (
        <motion.circle
          key={`vertex-${student.id}-${i}`}
          cx={p.x}
          cy={p.y}
          r={2.6}
          fill={SERIES.student}
          stroke="var(--card)"
          strokeWidth={1}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 + i * 0.05, duration: 0.2, ease: "easeOut" }}
        />
      ))}
    </g>
  );
}

type DrillProps = {
  cat: CategoryView;
  idx: number;
  viewMode: ViewMode;
  selectedStudent: StudentScoreSummary | null;
  activeSubskillId: string | null;
  setActiveSubskillId: (id: string | null) => void;
};

function DrillWedge({
  cat,
  idx,
  viewMode,
  selectedStudent,
  activeSubskillId,
  setActiveSubskillId,
}: DrillProps) {
  const span = (160 * Math.PI) / 180;
  const start = -Math.PI / 2 - span / 2;
  const end = -Math.PI / 2 + span / 2;
  const rTarget = radiusForScore(cat.avgScore, OUTER);
  const color = wedgeColor(idx);

  const r = useMotionValue(0);
  useEffect(() => {
    const controls = animate(r, rTarget, { duration: 0.5, ease: ENTER_EASE });
    return () => controls.stop();
  }, [r, rTarget]);
  const d = useTransform(r, (rv) => wedgePath(rv, start, end, { pad: 0, corner: 4 }));

  const score = useCountUp(cat.avgScore, 0.6);
  const studentCat =
    selectedStudent?.categories.find((c) => c.id === cat.id) ?? null;

  return (
    <g>
      <motion.path
        d={d}
        fill={color}
        fillOpacity={0.2}
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />

      {/* category name above the wedge, score pill just under it */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.3, ease: "easeOut" }}
      >
        <text
          x={0}
          y={-(rTarget + 34)}
          textAnchor="middle"
          fontSize={12}
          fontWeight={600}
          fill="var(--foreground)"
        >
          {cat.name}
        </text>
        <g transform={`translate(0 ${-(rTarget + 16)})`}>
          <rect
            x={-16}
            y={-9}
            width={32}
            height={18}
            rx={9}
            fill="var(--card)"
            stroke={color}
            strokeWidth={1}
          />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            className="font-mono"
            fontSize={10}
            fontWeight={600}
            fill="var(--foreground)"
          >
            {score}
          </text>
        </g>
      </motion.g>

      {(viewMode === "average" || viewMode === "compare") && (
        <SubskillBandLayer
          classSubs={cat.classSubs}
          studentSubs={
            viewMode === "compare"
              ? (studentCat?.subcategories ?? [])
              : []
          }
          showStudent={viewMode === "compare" && !!selectedStudent}
          start={start}
          end={end}
          activeSubskillId={activeSubskillId}
          setActiveSubskillId={setActiveSubskillId}
        />
      )}
    </g>
  );
}
