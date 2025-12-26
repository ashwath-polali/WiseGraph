// src/components/charts/ClassExplodingRadialChart.tsx
"use client";

import { useMemo, useState } from "react";
import type {
  ClassScoreSummary,
  StudentScoreSummary,
  CategoryScore,
  SubcategoryScore,
} from "@/types/scores";
import { clampScore } from "@/lib/chartScaling";

type ViewMode = "average" | "students" | "compare";

type CategoryView = {
  id: string;
  name: string;
  avgScore: number; // class avg
  abbrev: string;
};

type Props = {
  cls: ClassScoreSummary;
  svgRef?: React.Ref<SVGSVGElement>;
};

type DotKind = "category" | "subskill";

type ActiveDot = {
  kind: DotKind;
  studentId: string;
  categoryId: string;
  subskillId?: string;
};

export function ClassExplodingRadialChart({ cls, svgRef }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("average");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null,
  );
  const [drillCategoryId, setDrillCategoryId] = useState<string | null>(null);
  const [activeSubskillId, setActiveSubskillId] = useState<string | null>(null);
  const [activeDot, setActiveDot] = useState<ActiveDot | null>(null);

  function buildAbbreviations(names: string[]): string[] {
    const result: string[] = [];
    const used = new Set<string>();

    for (const full of names) {
      const clean = full.trim();
      if (!clean) {
        result.push("?");
        continue;
      }

      let len = 1;
      let abbr = clean.slice(0, len).toUpperCase();
      while (used.has(abbr) && len < clean.length) {
        len += 1;
        abbr = clean.slice(0, len).toUpperCase();
      }

      let final = abbr;
      let suffix = 2;
      while (used.has(final)) {
        final = abbr + suffix;
        suffix += 1;
      }

      used.add(final);
      result.push(final);
    }

    return result;
  }

  const categories: CategoryView[] = useMemo(() => {
    const names = cls.categories.map((c) => c.name);
    const abbrevs = buildAbbreviations(names);
    return cls.categories.map((cat, i) => ({
      id: cat.id,
      name: cat.name,
      avgScore: clampScore(cat.score),
      abbrev: abbrevs[i],
    }));
  }, [cls]);

  const hovered =
    hoveredId != null ? categories.find((c) => c.id === hoveredId) ?? null : null;

  const selectedStudent: StudentScoreSummary | null =
    selectedStudentId != null
      ? cls.students.find((s) => s.id === selectedStudentId) ?? null
      : null;

  const drillCategory =
    drillCategoryId != null
      ? categories.find((c) => c.id === drillCategoryId) ?? null
      : null;

  function handleDrillToggle(id: string) {
    setDrillCategoryId((prev) => {
      const next = prev === id ? null : id;
      if (next !== prev) {
        setActiveSubskillId(null);
        setActiveDot(null);
      }
      return next;
    });
  }

  function handleSetViewMode(m: ViewMode) {
    setViewMode(m);
    if (m !== "students") {
      setActiveDot(null);
    }
  }

  return (
    <div className="flex h-full flex-col gap-3 rounded-2xl border border-slate-800/80 bg-slate-950/70 p-3 shadow-[0_18px_45px_rgba(15,23,42,0.85)] ring-1 ring-slate-900/60">
      {/* header */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-800/60 pb-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
            Class overview
          </span>
          <div className="flex items-baseline gap-1.5">
            <h2 className="text-sm font-semibold text-slate-100">
              {cls.name}
            </h2>
            <span className="rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] font-medium text-slate-400">
              {cls.subject} · Grade {cls.gradeLevel}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {drillCategory && (
            <button
              type="button"
              onClick={() => setDrillCategoryId(null)}
              className="rounded-full border border-slate-700/80 bg-slate-900/80 px-2.5 py-1 text-[10px] text-slate-300 hover:border-sky-400 hover:text-sky-200"
            >
              Back to all categories
            </button>
          )}
          {viewMode === "compare" && cls.students.length > 0 && (
            <StudentPicker
              students={cls.students}
              selectedStudentId={selectedStudentId}
              setSelectedStudentId={setSelectedStudentId}
            />
          )}
          <ViewModeToggle viewMode={viewMode} setViewMode={handleSetViewMode} />
        </div>
      </div>

      {/* content */}
      <div className="flex min-h-[320px] flex-1 gap-4">
        <div className="relative flex-[3] min-w-[320px]">
          <RadialBars
            categories={categories}
            cls={cls}
            students={cls.students}
            hoveredId={hoveredId}
            setHoveredId={setHoveredId}
            viewMode={viewMode}
            selectedStudent={selectedStudent}
            drillCategoryId={drillCategoryId}
            onDrillToggle={handleDrillToggle}
            activeSubskillId={activeSubskillId}
            setActiveSubskillId={setActiveSubskillId}
            activeDot={activeDot}
            setActiveDot={setActiveDot}
            svgRef={svgRef}
          />
        </div>

        <div className="flex-[1.5] shrink-0">
          {viewMode === "students" ? (
            <DotsDetailPanel
              cls={cls}
              categories={categories}
              activeDot={activeDot}
            />
          ) : (
            <DetailPanel
              category={drillCategory ?? hovered}
              viewMode={viewMode}
              cls={cls}
              selectedStudent={selectedStudent}
              activeSubskillId={activeSubskillId}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ViewModeToggle({
  viewMode,
  setViewMode,
}: {
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;
}) {
  const modes: { id: ViewMode; label: string; hint: string }[] = [
    {
      id: "average",
      label: "Class avg",
      hint: "Category wedges + subskills",
    },
    {
      id: "students",
      label: "Dots",
      hint: "All students per category & subskill",
    },
    {
      id: "compare",
      label: "Compare",
      hint: "Single student vs class",
    },
  ];

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="inline-flex rounded-full border border-slate-700/80 bg-slate-900/80 p-0.5 shadow-sm shadow-slate-900/80">
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setViewMode(m.id)}
            className={
              "relative cursor-pointer rounded-full px-3 py-1 text-[10px] font-medium transition-all " +
              (viewMode === m.id
                ? "bg-sky-400 text-slate-950 shadow-[0_0_0_1px_rgba(8,47,73,0.9)]"
                : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-100")
            }
          >
            {m.label}
          </button>
        ))}
      </div>
      <span className="text-[10px] text-slate-500">
        {modes.find((m) => m.id === viewMode)?.hint}
      </span>
    </div>
  );
}

function StudentPicker({
  students,
  selectedStudentId,
  setSelectedStudentId,
}: {
  students: StudentScoreSummary[];
  selectedStudentId: string | null;
  setSelectedStudentId: (id: string | null) => void;
}) {
  return (
    <label className="flex items-center gap-1.5 text-[11px] text-slate-400">
      <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
        Student
      </span>
      <div className="relative">
        <select
          className="peer rounded-lg border border-slate-700/80 bg-slate-900/90 px-2.5 py-1 text-[11px] text-slate-50 outline-none transition-colors hover:border-slate-500 focus-visible:border-sky-400 focus-visible:ring-1 focus-visible:ring-sky-500"
          value={selectedStudentId ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            setSelectedStudentId(v === "" ? null : v);
          }}
        >
          <option value="">Select…</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] text-slate-500 peer-focus-visible:text-sky-300">
          ▼
        </span>
      </div>
    </label>
  );
}

type RadialProps = {
  categories: CategoryView[];
  cls: ClassScoreSummary;
  students: StudentScoreSummary[];
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  viewMode: ViewMode;
  selectedStudent: StudentScoreSummary | null;
  drillCategoryId: string | null;
  onDrillToggle: (id: string) => void;
  activeSubskillId: string | null;
  setActiveSubskillId: (id: string | null) => void;
  activeDot: ActiveDot | null;
  setActiveDot: (dot: ActiveDot | null) => void;
  svgRef?: React.Ref<SVGSVGElement>; 
};

function RadialBars({
  categories,
  cls,
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
}: RadialProps) {
  const size = 520;
  const cx = size / 2;
  const cy = size / 2;

  const SCORE_MIN = 60;
  const SCORE_MAX = 150;

  const baseInner = 0;
  const baseOuter = 210;
  const fixedOuter = baseOuter;

  const anglePer = (2 * Math.PI) / Math.max(categories.length, 1);
  const epsilon = 0.002;

  const ringScores = [60, 75, 90, 105, 120, 135, 150];
  const labelRadius = baseOuter + 36;

  function scoreToRadius(score: number, maxRadius: number): number {
    const t = (clampScore(score) - SCORE_MIN) / (SCORE_MAX - SCORE_MIN);
    return baseInner + t * maxRadius;
  }

  function polarPoint(r: number, angle: number) {
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  }

  function categoryAngles(idx: number) {
    const angleStart = idx * anglePer - Math.PI / 2 - epsilon;
    const angleEnd = (idx + 1) * anglePer - Math.PI / 2 + epsilon;
    const mid = (angleStart + angleEnd) / 2;
    return { angleStart, angleEnd, mid };
  }

  function studentDotPosition(
    catIndex: number,
    score: number,
    explodeOffset: number,
  ) {
    const { mid } = categoryAngles(catIndex);
    const r = scoreToRadius(score, baseOuter);
    const dx = Math.cos(mid) * explodeOffset;
    const dy = Math.sin(mid) * explodeOffset;
    const { x, y } = polarPoint(r, mid);
    return { cx: x + dx, cy: y + dy };
  }

  function studentPolylinePoints(
    student: StudentScoreSummary,
    explodeOffsets: Record<string, { dx: number; dy: number }>,
  ): string {
    const pts: string[] = [];
    categories.forEach((cat, idx) => {
      const catScore = student.categories.find((c) => c.id === cat.id);
      if (!catScore) return;
      const { mid } = categoryAngles(idx);
      const r = scoreToRadius(catScore.score, baseOuter);
      const { dx, dy } = explodeOffsets[cat.id] ?? { dx: 0, dy: 0 };
      const { x, y } = polarPoint(r, mid);
      pts.push(`${x + dx},${y + dy}`);
    });
    return pts.join(" ");
  }

  /**
   * Subskill “band” generator: returns polylines and clickable points
   * for class and student subskills within a trimmed angular region
   * inside the wedge.
   */
  function subskillPolylineForCategory(
    clsCategory: CategoryScore | null,
    studentCategory: CategoryScore | null,
    idx: number,
    maxRadius: number,
    dx: number,
    dy: number,
    forcedAngles?: { angleStart: number; angleEnd: number },
  ): {
    classLine: string;
    studentBaseline: string;
    studentPeaks: string;
    classPoints: { id: string; x: number; y: number }[];
    studentPoints: { id: string; x: number; y: number }[];
  } {
    const classSubs: SubcategoryScore[] = clsCategory?.subcategories ?? [];
    const studentSubs: SubcategoryScore[] = studentCategory?.subcategories ?? [];

    if (!classSubs.length && !studentSubs.length) {
      return {
        classLine: "",
        studentBaseline: "",
        studentPeaks: "",
        classPoints: [],
        studentPoints: [],
      };
    }

    const baseAngles = forcedAngles ?? categoryAngles(idx);
    const { angleStart, angleEnd } = baseAngles;

    // Focus the band in the outer half of the wedge and trim to 80% of its angle
    const innerR = maxRadius * 0.4;
    const halfSpan = ((angleEnd - angleStart) * 0.8) / 2;
    const mid = (angleStart + angleEnd) / 2;
    const startAngle = mid - halfSpan;
    const endAngle = mid + halfSpan;

    const count = Math.max(classSubs.length, studentSubs.length, 1);

    const classPts: string[] = [];
    const studentBaselinePts: string[] = [];
    const studentPeakPts: string[] = [];
    const classPointObjs: { id: string; x: number; y: number }[] = [];
    const studentPointObjs: { id: string; x: number; y: number }[] = [];

    for (let i = 0; i < count; i++) {
      const tAngle = count === 1 ? 0.5 : i / (count - 1);
      const a = startAngle + tAngle * (endAngle - startAngle);

      // baseline closer to center, peaks further out using true score radii
      const baseR = innerR + 6;
      const base = polarPoint(baseR, a);
      const baseX = base.x + dx;
      const baseY = base.y + dy;

      const classSub = classSubs[i];
      if (classSub) {
        const r = scoreToRadius(classSub.score, maxRadius);
        const p = polarPoint(r, a);
        const px = p.x + dx;
        const py = p.y + dy;
        classPts.push(`${px},${py}`);
        classPointObjs.push({ id: classSub.id, x: px, y: py });
      }

      const studentSub = studentSubs[i];
      if (studentSub) {
        studentBaselinePts.push(`${baseX},${baseY}`);
        const r = scoreToRadius(studentSub.score, maxRadius);
        const p = polarPoint(r, a);
        const px = p.x + dx;
        const py = p.y + dy;
        studentPeakPts.push(`${px},${py}`);
        studentPointObjs.push({ id: studentSub.id, x: px, y: py });
      }
    }

    return {
      classLine: classPts.join(" "),
      studentBaseline: studentBaselinePts.join(" "),
      studentPeaks: studentPeakPts.join(" "),
      classPoints: classPointObjs,
      studentPoints: studentPointObjs,
    };
  }

  const explodeOffsets: Record<string, { dx: number; dy: number }> = {};
  const isDrill = drillCategoryId != null;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${size} ${size}`}
      className="h-full w-full"
      onMouseLeave={() => !isDrill && setHoveredId(null)}
    >
      {/* subtle radial background */}
      <defs>
        <radialGradient id="radial-bg" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#0f172a" stopOpacity="0.1" />
          <stop offset="70%" stopColor="#020617" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#020617" stopOpacity="1" />
        </radialGradient>
      </defs>
      <rect
        x={0}
        y={0}
        width={size}
        height={size}
        fill="url(#radial-bg)"
        opacity={0.85}
      />

      {/* rings */}
      {ringScores.map((score) => {
        const t = (score - SCORE_MIN) / (SCORE_MAX - SCORE_MIN);
        const r = baseInner + t * baseOuter;
        return (
          <g key={score}>
            <circle
              cx={cx}
              cy={cy}
              r={r}
              className="fill-none stroke-slate-800/80"
              strokeWidth={0.7}
              strokeDasharray="3 4"
            />
            <text
              x={cx + r + 6}
              y={cy}
              className="fill-slate-500 text-[9px]"
              textAnchor="start"
              alignmentBaseline="middle"
            >
              {score}
            </text>
          </g>
        );
      })}

      {/* origin pulse */}
      <g>
        <circle
          cx={cx}
          cy={cy}
          r={3}
          className="fill-sky-400/90"
          style={{
            filter: "drop-shadow(0 0 8px rgba(56,189,248,0.9))",
          }}
        />
        <circle cx={cx} cy={cy} r={8} className="fill-sky-500/10" />
      </g>

      {/* DRILL MODE: single wide wedge */}
      {isDrill ? (
        (() => {
          const cat = categories.find((c) => c.id === drillCategoryId);
          if (!cat) return null;

          const clsCategory =
            cls.categories.find((c) => c.id === cat.id) ?? null;
          const studentCategory =
            selectedStudent?.categories.find((c) => c.id === cat.id) ?? null;

          const angleSpan = (160 * Math.PI) / 180;
          const angleStart = -Math.PI / 2 - angleSpan / 2;
          const angleEnd = -Math.PI / 2 + angleSpan / 2;
          const mid = (-Math.PI / 2 + -Math.PI / 2) / 2;

          const maxRadius = fixedOuter;
          const rOuter = scoreToRadius(cat.avgScore, maxRadius);
          const rInner = baseInner;

          const dx = 0;
          const dy = 0;

          const path = radialRingPath(
            cx + dx,
            cy + dy,
            rInner,
            rOuter,
            angleStart,
            angleEnd,
          );

          const baseFill = "rgba(56,189,248,0.25)";
          const stroke = "rgba(56,189,248,1)";
          const scoreRadius = rOuter + 18;

          const {
            classLine,
            studentBaseline,
            studentPeaks,
            classPoints,
            studentPoints,
          } =
            clsCategory && (viewMode === "average" || viewMode === "compare")
              ? subskillPolylineForCategory(
                  clsCategory,
                  viewMode === "compare" ? studentCategory ?? null : null,
                  0,
                  maxRadius,
                  dx,
                  dy,
                  { angleStart, angleEnd },
                )
              : {
                  classLine: "",
                  studentBaseline: "",
                  studentPeaks: "",
                  classPoints: [],
                  studentPoints: [],
                };

          const labelPoint = polarPoint(rOuter + 30, -Math.PI / 2);

          return (
            <g>
              {/* main big wedge */}
              <path
                d={path}
                fill={baseFill}
                stroke={stroke}
                strokeWidth={2.4}
              />

              {/* category name */}
              <g transform={`translate(${labelPoint.x},${labelPoint.y})`}>
                <text
                  className="fill-slate-50 text-[11px] font-semibold"
                  textAnchor="middle"
                  alignmentBaseline="baseline"
                >
                  {cat.name}
                </text>
              </g>

              {/* score label */}
              <g
                transform={`translate(${cx + Math.cos(mid) * scoreRadius},${
                  cy + Math.sin(mid) * scoreRadius
                })`}
              >
                <rect
                  x={-16}
                  y={-9}
                  width={32}
                  height={18}
                  rx={9}
                  className="fill-slate-950/90 stroke-[0.8]"
                  stroke="#38bdf8"
                />
                <text
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  className="fill-slate-100 text-[10px] font-semibold"
                >
                  {cat.avgScore.toFixed(0)}
                </text>
              </g>

              {/* class subskill band */}
              {classLine && (
                <polyline
                  points={classLine}
                  fill="none"
                  stroke="rgba(148,163,184,0.95)"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* student baseline / peaks in compare */}
              {viewMode === "compare" && selectedStudent && (
                <>
                  {studentBaseline && (
                    <polyline
                      points={studentBaseline}
                      fill="none"
                      stroke="rgba(148,163,184,0.7)"
                      strokeWidth={1}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                  {studentPeaks && (
                    <polyline
                      points={studentPeaks}
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth={2.4}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        filter: "drop-shadow(0 0 6px rgba(34,197,94,0.9))",
                      }}
                    />
                  )}
                </>
              )}

              {/* class points */}
              {classPoints.map((pt) => (
                <circle
                  key={`class-pt-${pt.id}`}
                  cx={pt.x}
                  cy={pt.y}
                  r={activeSubskillId === pt.id ? 4 : 3}
                  className={
                    activeSubskillId === pt.id
                      ? "fill-slate-100"
                      : "fill-slate-400"
                  }
                  style={{
                    cursor: "pointer",
                    filter:
                      activeSubskillId === pt.id
                        ? "drop-shadow(0 0 6px rgba(148,163,184,0.9))"
                        : "none",
                  }}
                  onClick={() =>
                    setActiveSubskillId(
                      activeSubskillId === pt.id ? null : pt.id,
                    )
                  }
                />
              ))}

              {/* student points */}
              {viewMode === "compare" &&
                selectedStudent &&
                studentPoints.map((pt) => (
                  <circle
                    key={`student-pt-${pt.id}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={activeSubskillId === pt.id ? 4 : 3}
                    className={
                      activeSubskillId === pt.id
                        ? "fill-emerald-300"
                        : "fill-emerald-400"
                    }
                    style={{
                      cursor: "pointer",
                      filter:
                        activeSubskillId === pt.id
                          ? "drop-shadow(0 0 8px rgba(34,197,94,0.95))"
                          : "none",
                    }}
                    onClick={() =>
                      setActiveSubskillId(
                        activeSubskillId === pt.id ? null : pt.id,
                      )
                    }
                  />
                ))}
            </g>
          );
        })()
      ) : (
        <>
          {/* NORMAL MULTI-WEDGE MODE */}
          {categories.map((cat, idx) => {
            const { angleStart, angleEnd, mid } = categoryAngles(idx);
            const isHovered = hoveredId === cat.id;
            const maxRadius = fixedOuter;
            const explodeOffset = isHovered ? 8 : 2;
            const rOuter = scoreToRadius(cat.avgScore, maxRadius);
            const rInner = baseInner;
            const dx = Math.cos(mid) * explodeOffset;
            const dy = Math.sin(mid) * explodeOffset;
            explodeOffsets[cat.id] = { dx, dy };

            const path = radialRingPath(
              cx + dx,
              cy + dy,
              rInner,
              rOuter,
              angleStart,
              angleEnd,
            );

            const baseFill =
              [
                "rgba(56,189,248,0.22)",
                "rgba(96,165,250,0.22)",
                "rgba(129,140,248,0.22)",
                "rgba(52,211,153,0.22)",
                "rgba(250,204,21,0.22)",
              ][idx % 5] ?? "rgba(56,189,248,0.22)";

            const fill = baseFill;
            const stroke = isHovered
              ? "rgba(56,189,248,1)"
              : "rgba(15,23,42,0.9)";
            const scoreRadius = rOuter + 14;

            const clsCategory =
              cls.categories.find((c) => c.id === cat.id) ?? null;
            const studentCategory =
              selectedStudent?.categories.find((c) => c.id === cat.id) ?? null;

            const {
              classLine,
              studentBaseline,
              studentPeaks,
              classPoints,
              studentPoints,
            } =
              (viewMode === "average" || viewMode === "compare") && isHovered
                ? subskillPolylineForCategory(
                    clsCategory,
                    viewMode === "compare" ? studentCategory ?? null : null,
                    idx,
                    maxRadius,
                    dx,
                    dy,
                  )
                : {
                    classLine: "",
                    studentBaseline: "",
                    studentPeaks: "",
                    classPoints: [],
                    studentPoints: [],
                  };

            const labelPoint = polarPoint(labelRadius, mid);
            const isBottom = mid > Math.PI / 2 || mid < -Math.PI / 2;

            return (
              <g
                key={cat.id}
                onMouseEnter={() => setHoveredId(cat.id)}
                onClick={() => onDrillToggle(cat.id)}
                className="cursor-pointer"
              >
                {isHovered && (
                  <path
                    d={radialRingPath(
                      cx + dx,
                      cy + dy,
                      rInner,
                      rOuter + 8,
                      angleStart,
                      angleEnd,
                    )}
                    fill="rgba(8,47,73,0.65)"
                    stroke="none"
                  />
                )}

                {/* main wedge */}
                <path
                  d={path}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isHovered ? 2.2 : 1}
                />

                {/* abbreviated label */}
                <g transform={`translate(${labelPoint.x},${labelPoint.y})`}>
                  <text
                    className="fill-slate-50 text-[10px] font-semibold"
                    textAnchor="middle"
                    alignmentBaseline={isBottom ? "hanging" : "baseline"}
                  >
                    {cat.abbrev}
                  </text>
                </g>

                {/* score label */}
                <g
                  transform={`translate(${cx + dx + Math.cos(mid) * scoreRadius},${
                    cy + dy + Math.sin(mid) * scoreRadius
                  })`}
                >
                  <rect
                    x={-14}
                    y={-8}
                    width={28}
                    height={16}
                    rx={8}
                    className="fill-slate-950/90 stroke-[0.7]"
                    stroke={isHovered ? "#38bdf8" : "rgba(15,23,42,0.9)"}
                  />
                  <text
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    className="fill-slate-100 text-[9px] font-semibold"
                  >
                    {cat.avgScore.toFixed(0)}
                  </text>
                </g>

                {/* subskill band when hovered */}
                {isHovered && classLine && (
                  <g>
                    <polyline
                      points={classLine}
                      fill="none"
                      stroke="rgba(148,163,184,0.9)"
                      strokeWidth={1.6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {viewMode === "compare" &&
                      selectedStudent &&
                      studentBaseline && (
                        <polyline
                          points={studentBaseline}
                          fill="none"
                          stroke="rgba(148,163,184,0.7)"
                          strokeWidth={1}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}
                    {viewMode === "compare" &&
                      selectedStudent &&
                      studentPeaks && (
                        <polyline
                          points={studentPeaks}
                          fill="none"
                          stroke="#22c55e"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{
                            filter:
                              "drop-shadow(0 0 6px rgba(34,197,94,0.9))",
                          }}
                        />
                      )}

                    {/* class points clickable */}
                    {classPoints.map((pt) => (
                      <circle
                        key={`class-${cat.id}-${pt.id}`}
                        cx={pt.x}
                        cy={pt.y}
                        r={activeSubskillId === pt.id ? 3.5 : 2.5}
                        className={
                          activeSubskillId === pt.id
                            ? "fill-slate-200"
                            : "fill-slate-400"
                        }
                        style={{ cursor: "pointer" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSubskillId(
                            activeSubskillId === pt.id ? null : pt.id,
                          );
                        }}
                      />
                    ))}

                    {/* student points in compare */}
                    {viewMode === "compare" &&
                      selectedStudent &&
                      studentPoints.map((pt) => (
                        <circle
                          key={`student-${cat.id}-${pt.id}`}
                          cx={pt.x}
                          cy={pt.y}
                          r={activeSubskillId === pt.id ? 3.5 : 2.5}
                          className={
                            activeSubskillId === pt.id
                              ? "fill-emerald-300"
                              : "fill-emerald-400"
                          }
                          style={{ cursor: "pointer" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveSubskillId(
                              activeSubskillId === pt.id ? null : pt.id,
                            );
                          }}
                        />
                      ))}
                  </g>
                )}
              </g>
            );
          })}

          {/* student dots view */}
          {viewMode === "students" && (
            <g opacity={0.98}>
              {/* category-level dots */}
              {students.flatMap((s) =>
                categories.map((cat, idx) => {
                  const catScore = s.categories.find((c) => c.id === cat.id);
                  if (!catScore) return null;
                  const explodeOffset = 2;
                  const { cx: px, cy: py } = studentDotPosition(
                    idx,
                    catScore.score,
                    explodeOffset,
                  );
                  const isActive =
                    activeDot &&
                    activeDot.kind === "category" &&
                    activeDot.studentId === s.id &&
                    activeDot.categoryId === cat.id;
                  return (
                    <circle
                      key={`cat-${s.id}-${cat.id}`}
                      cx={px}
                      cy={py}
                      r={isActive ? 3 : 2.4}
                      fill={isActive ? "#bbf7d0" : "#22c55e"}
                      style={{
                        cursor: "pointer",
                        filter: isActive
                          ? "drop-shadow(0 0 7px rgba(34,197,94,0.95))"
                          : "drop-shadow(0 0 5px rgba(34,197,94,0.85))",
                      }}
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

              {/* subskill dots */}
              {students.flatMap((s) =>
                categories.map((cat, idx) => {
                  const clsCategory =
                    cls.categories.find((c) => c.id === cat.id) ?? null;
                  const stuCategory =
                    s.categories.find((c) => c.id === cat.id) ?? null;
                  const classSubs: SubcategoryScore[] =
                    clsCategory?.subcategories ?? [];
                  const studentSubs: SubcategoryScore[] =
                    stuCategory?.subcategories ?? [];
                  if (!classSubs.length && !studentSubs.length) return null;

                  const { angleStart, angleEnd } = categoryAngles(idx);
                  const halfSpan = ((angleEnd - angleStart) * 0.8) / 2;
                  const mid = (angleStart + angleEnd) / 2;
                  const startAngle = mid - halfSpan;
                  const endAngle = mid + halfSpan;
                  const count = Math.max(
                    classSubs.length,
                    studentSubs.length,
                    1,
                  );

                  const dots: React.ReactNode[] = [];
                  for (let i = 0; i < count; i++) {
                    const stuSub = studentSubs[i];
                    if (!stuSub) continue;
                    const tAngle = count === 1 ? 0.5 : i / (count - 1);
                    const a = startAngle + tAngle * (endAngle - startAngle);
                    const r = scoreToRadius(stuSub.score, fixedOuter);
                    const p = polarPoint(r, a);
                    const isActive =
                      activeDot &&
                      activeDot.kind === "subskill" &&
                      activeDot.studentId === s.id &&
                      activeDot.categoryId === cat.id &&
                      activeDot.subskillId === stuSub.id;
                    dots.push(
                      <circle
                        key={`sub-${s.id}-${cat.id}-${stuSub.id}`}
                        cx={p.x}
                        cy={p.y}
                        r={isActive ? 1.9 : 1.4}
                        fill={isActive ? "#c4b5fd" : "#a855f7"}
                        opacity={0.95}
                        style={{
                          cursor: "pointer",
                          filter: isActive
                            ? "drop-shadow(0 0 6px rgba(196,181,253,0.95))"
                            : "drop-shadow(0 0 4px rgba(168,85,247,0.85))",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDot({
                            kind: "subskill",
                            studentId: s.id,
                            categoryId: cat.id,
                            subskillId: stuSub.id,
                          });
                          setActiveSubskillId(stuSub.id);
                        }}
                      />,
                    );
                  }
                  return (
                    <g key={`sub-group-${s.id}-${cat.id}`}>{dots}</g>
                  );
                }),
              )}
            </g>
          )}

          {/* compare student polyline (orange only) */}
          {viewMode === "compare" && selectedStudent && (
            <g>
              {(() => {
                const pts = studentPolylinePoints(
                  selectedStudent,
                  explodeOffsets,
                );
                if (!pts) return null;
                return (
                  <polyline
                    points={pts}
                    fill="none"
                    stroke="#f97316"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.95}
                    style={{
                      filter:
                        "drop-shadow(0 0 8px rgba(248,250,252,0.45))",
                    }}
                  />
                );
              })()}
            </g>
          )}
        </>
      )}
    </svg>
  );
}

function radialRingPath(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  angleStart: number,
  angleEnd: number,
): string {
  const largeArc = angleEnd - angleStart > Math.PI ? 1 : 0;
  const startOuter = polar(cx, cy, rOuter, angleStart);
  const endOuter = polar(cx, cy, rOuter, angleEnd);
  const startInner = polar(cx, cy, rInner, angleEnd);
  const endInner = polar(cx, cy, rInner, angleStart);

  return [
    "M",
    startOuter.x,
    startOuter.y,
    "A",
    rOuter,
    rOuter,
    0,
    largeArc,
    1,
    endOuter.x,
    endOuter.y,
    "L",
    startInner.x,
    startInner.y,
    "A",
    rInner,
    rInner,
    0,
    largeArc,
    0,
    endInner.x,
    endInner.y,
    "Z",
  ].join(" ");
}

function polar(
  cx: number,
  cy: number,
  r: number,
  angle: number,
): { x: number; y: number } {
  const x = cx + r * Math.cos(angle);
  const y = cy + r * Math.sin(angle);
  return { x, y };
}

type DetailPanelProps = {
  category: CategoryView | null;
  viewMode: ViewMode;
  cls: ClassScoreSummary;
  selectedStudent: StudentScoreSummary | null;
  activeSubskillId: string | null;
};

function DetailPanel({
  category,
  viewMode,
  cls,
  selectedStudent,
  activeSubskillId,
}: DetailPanelProps) {
  if (!category) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-800/70 bg-slate-950/40 text-[11px] text-slate-500">
        Hover a wedge to explore subskills.
      </div>
    );
  }

  const classCat =
    cls.categories.find((c) => c.id === category.id) ?? null;
  const classSubs: SubcategoryScore[] = classCat?.subcategories ?? [];

  const studentCat =
    viewMode === "compare" && selectedStudent
      ? selectedStudent.categories.find((c) => c.id === category.id) ?? null
      : null;
  const studentSubs: SubcategoryScore[] =
    viewMode === "compare" ? studentCat?.subcategories ?? [] : [];

  const combinedSubIds = Array.from(
    new Set([
      ...classSubs.map((s) => s.id),
      ...studentSubs.map((s) => s.id),
    ]),
  );

  const categoryDelta =
    viewMode === "compare" && studentCat
      ? Math.round(studentCat.score - category.avgScore)
      : null;

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-800/80 bg-gradient-to-b from-slate-950/90 to-slate-950/60 p-3">
      <div className="mb-2 flex items-start justify-between gap-2 border-b border-slate-800/70 pb-2">
        <div className="space-y-0.5">
          <h3 className="text-xs font-semibold text-slate-100">
            {category.name}
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
            <span>
              Class average{" "}
              <span className="font-mono text-slate-100">
                {category.avgScore.toFixed(0)}
              </span>
            </span>
            {viewMode === "compare" && studentCat && (
              <>
                <span>
                  · Student{" "}
                  <span className="rounded-full bg-sky-500/15 px-1.5 py-0.5 font-mono text-[10px] text-sky-300">
                    {Math.round(studentCat.score)}
                  </span>
                </span>
                {categoryDelta !== null && (
                  <span
                    className={
                      categoryDelta > 0
                        ? "text-[10px] text-emerald-300"
                        : categoryDelta < 0
                        ? "text-[10px] text-amber-300"
                        : "text-[10px] text-slate-400"
                    }
                  >
                    ({categoryDelta > 0 ? "+" : ""}
                    {categoryDelta} vs class)
                  </span>
                )}
              </>
            )}
          </div>
        </div>
        {viewMode === "compare" && selectedStudent && (
          <div className="rounded-lg bg-slate-900/70 px-2 py-1 text-right text-[10px]">
            <div className="text-slate-400">Comparing</div>
            <div className="font-medium text-slate-100">
              {selectedStudent.name}
            </div>
            <div className="text-[10px] text-orange-300">
              Overall {Math.round(selectedStudent.overallScore)}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 space-y-1.5 overflow-y-auto pr-1 text-[11px]">
        {combinedSubIds.length === 0 ? (
          <p className="mt-4 text-center text-slate-500">
            No subskills configured for this category yet.
          </p>
        ) : (
          combinedSubIds.map((id) => {
            const classSub = classSubs.find((s) => s.id === id) ?? null;
            const studentSub = studentSubs.find((s) => s.id === id) ?? null;
            const name =
              classSub?.name ?? studentSub?.name ?? "Subskill";
            const isActive = activeSubskillId === id;

            const delta =
              viewMode === "compare" && classSub && studentSub
                ? Math.round(studentSub.score - classSub.score)
                : null;

            return (
              <div
                key={id}
                className={
                  "flex items-center justify-between rounded-lg border px-2 py-1 " +
                  (isActive
                    ? "border-sky-400 bg-sky-500/10"
                    : "border-slate-800/80 bg-slate-950/70")
                }
              >
                <div className="flex flex-col">
                  <span className="text-[11px] text-slate-100">
                    {name}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {viewMode === "compare"
                      ? isActive
                        ? "Selected subskill · Class vs student"
                        : "Class vs student"
                      : "Class average subskill"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {classSub && (
                    <span className="rounded-full bg-slate-900/90 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                      {Math.round(classSub.score)}
                    </span>
                  )}
                  {viewMode === "compare" && studentSub && (
                    <span className="rounded-full bg-sky-500/15 px-1.5 py-0.5 font-mono text-[10px] text-sky-300">
                      {Math.round(studentSub.score)}
                    </span>
                  )}
                  {delta !== null && (
                    <span
                      className={
                        delta > 0
                          ? "text-[10px] text-emerald-300"
                          : delta < 0
                          ? "text-[10px] text-amber-300"
                          : "text-[10px] text-slate-400"
                      }
                    >
                      {delta > 0 ? "+" : ""}
                      {delta}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

type DotsDetailPanelProps = {
  cls: ClassScoreSummary;
  categories: CategoryView[];
  activeDot: ActiveDot | null;
};

function DotsDetailPanel({
  cls,
  categories,
  activeDot,
}: DotsDetailPanelProps) {
  if (!activeDot) {
    return (
      <div className="flex h-full flex-col rounded-xl border border-slate-800/80 bg-slate-950/40 p-3 text-[11px] text-slate-500">
        <div className="mb-2 border-b border-dashed border-slate-800/80 pb-2">
          <h3 className="text-xs font-semibold text-slate-100">
            Dots view
          </h3>
          <p className="mt-1 text-[11px] text-slate-400">
            Click any dot to see which student, category, and score it
            represents.
          </p>
        </div>
        <p className="mt-4 text-center text-[11px] text-slate-500">
          No dot selected yet.
        </p>
      </div>
    );
  }

  const student = cls.students.find((s) => s.id === activeDot.studentId);
  const categoryMeta = categories.find((c) => c.id === activeDot.categoryId);
  const category =
    student?.categories.find((c) => c.id === activeDot.categoryId) ?? null;

  if (!student || !categoryMeta || !category) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-500">
        This dot refers to data that could not be found.
      </div>
    );
  }

  if (activeDot.kind === "category") {
    return (
      <div className="flex h-full flex-col rounded-xl border border-slate-800/80 bg-gradient-to-b from-slate-950/90 to-slate-950/60 p-3">
        <div className="mb-2 border-b border-slate-800/70 pb-2">
          <h3 className="text-xs font-semibold text-emerald-300">
            Category dot
          </h3>
          <p className="mt-0.5 text-[10px] text-slate-500">
            Each green dot is one student's overall score in a
            category.
          </p>
        </div>

        <div className="space-y-2 text-[11px]">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
              Student
            </div>
            <div className="font-medium text-slate-100">
              {student.name}
            </div>
            <div className="text-[10px] text-slate-500">
              Grade {student.gradeLevel} · Overall{" "}
              <span className="font-mono text-slate-100">
                {Math.round(student.overallScore)}
              </span>
            </div>
          </div>

          <div>
            <div className="mt-2 text-[10px] uppercase tracking-[0.18em] text-slate-500">
              Category
            </div>
            <div className="font-medium text-slate-100">
              {categoryMeta.name}
            </div>
            <div className="text-[10px] text-slate-400">
              Student score in this category:
              <span className="ml-1 rounded-full bg-slate-900/90 px-1.5 py-0.5 font-mono text-[10px] text-emerald-300">
                {Math.round(category.score)}
              </span>
            </div>
          </div>

          <div className="mt-3 rounded-lg bg-slate-900/60 p-2 text-[10px] text-slate-400">
            This dot is placed at the distance that corresponds to this
            student's scaled score in the category, on a 60–150
            standard score scale.
          </div>
        </div>
      </div>
    );
  }

  const subskill =
    activeDot.subskillId != null
      ? category.subcategories?.find((s) => s.id === activeDot.subskillId) ??
        null
      : null;

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-800/80 bg-gradient-to-b from-slate-950/90 to-slate-950/60 p-3">
      <div className="mb-2 border-b border-slate-800/70 pb-2">
        <h3 className="text-xs font-semibold text-violet-300">
          Subskill dot
        </h3>
        <p className="mt-0.5 text-[10px] text-slate-500">
          Each purple dot is one student's score on a specific
          subskill inside a category.
        </p>
      </div>

      <div className="space-y-2 text-[11px]">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
            Student
          </div>
          <div className="font-medium text-slate-100">
            {student.name}
          </div>
          <div className="text-[10px] text-slate-500">
            Grade {student.gradeLevel} · Overall{" "}
            <span className="font-mono text-slate-100">
              {Math.round(student.overallScore)}
            </span>
          </div>
        </div>

        <div>
          <div className="mt-2 text-[10px] uppercase tracking-[0.18em] text-slate-500">
            Category
          </div>
          <div className="font-medium text-slate-100">
            {categoryMeta.name}
          </div>
        </div>

        {subskill ? (
          <div>
            <div className="mt-2 text-[10px] uppercase tracking-[0.18em] text-slate-500">
              Subskill
            </div>
            <div className="font-medium text-slate-100">
              {subskill.name}
            </div>
            <div className="mt-1 text-[10px] text-slate-400">
              Student score:
              <span className="ml-1 rounded-full bg-slate-900/90 px-1.5 py-0.5 font-mono text-[10px] text-violet-300">
                {Math.round(subskill.score)}
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-2 text-[10px] text-slate-500">
            This subskill dot does not have a configured label yet.
          </div>
        )}

        <div className="mt-3 rounded-lg bg-slate-900/60 p-2 text-[10px] text-slate-400">
          This dot sits at the radial distance for this subskill's
          score in the 60–150 scale, within its category wedge.
        </div>
      </div>
    </div>
  );
}
