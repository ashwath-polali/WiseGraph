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
};

export function ClassExplodingRadialChart({ cls }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("average");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null,
  );
  const [drillCategoryId, setDrillCategoryId] = useState<string | null>(null);
  const [activeSubskillId, setActiveSubskillId] = useState<string | null>(null);

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
        final = `${abbr}${suffix}`;
        suffix += 1;
      }

      used.add(final);
      result.push(final);
    }

    return result;
  }

  const categories = useMemo<CategoryView[]>(() => {
    const names = cls.categories.map((c) => c.name);
    const abbrevs = buildAbbreviations(names);

    return cls.categories.map((cat, i) => ({
      id: cat.id,
      name: cat.name,
      avgScore: clampScore(cat.score),
      abbrev: abbrevs[i],
    }));
  }, [cls]);

  const hovered = categories.find((c) => c.id === hoveredId) ?? null;
  const selectedStudent: StudentScoreSummary | null =
    selectedStudentId != null
      ? cls.students.find((s) => s.id === selectedStudentId) ?? null
      : null;

  const drillCategory =
    drillCategoryId != null
      ? categories.find((c) => c.id === drillCategoryId) ?? null
      : null;

  // Reset active subskill when switching drilled category
  function handleDrillToggle(id: string) {
    setDrillCategoryId((prev) => {
      const next = prev === id ? null : id;
      if (next !== prev) {
        setActiveSubskillId(null);
      }
      return next;
    });
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
              ← Back to all categories
            </button>
          )}
          {viewMode === "compare" && cls.students.length > 0 && (
            <StudentPicker
              students={cls.students}
              selectedStudentId={selectedStudentId}
              setSelectedStudentId={setSelectedStudentId}
            />
          )}
          <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} />
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
          />
        </div>

        <div className="flex-[1.5] shrink-0">
          <DetailPanel
            category={drillCategory ?? hovered}
            viewMode={viewMode}
            cls={cls}
            selectedStudent={selectedStudent}
            activeSubskillId={activeSubskillId}
          />
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
      hint: "All students per category",
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

  function scoreToRadius(score: number, maxRadius: number) {
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
  ) {
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

  function subskillPolylineForCategory(
    clsCategory: CategoryScore | null,
    studentCategory: CategoryScore | null,
    idx: number,
    maxRadius: number,
    dx: number,
    dy: number,
    forcedAngles?: { angleStart: number; angleEnd: number },
  ) {
    const classSubs: SubcategoryScore[] = clsCategory?.subcategories ?? [];
    const studentSubs: SubcategoryScore[] =
      studentCategory?.subcategories ?? [];

    if (!classSubs.length && !studentSubs.length) {
      return {
        classLine: "",
        studentBaseline: "",
        studentPeaks: "",
        classPoints: [] as { id: string; x: number; y: number }[],
        studentPoints: [] as { id: string; x: number; y: number }[],
      };
    }

    const baseAngles = forcedAngles ?? categoryAngles(idx);
    const { angleStart, angleEnd } = baseAngles;

    // We still define a "band" for baselines, but score mapping uses scoreToRadius
    const innerR = maxRadius * 0.4;

    const halfSpan = (angleEnd - angleStart) * 0.8 * 0.5;
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
        // baseline stays near inner band for visual structure
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
      viewBox={`0 0 ${size} ${size}`}
      className="h-full w-full"
      onMouseLeave={() => !isDrill && setHoveredId(null)}
    >
      {/* subtle radial background */}
      <radialGradient id="radial-bg" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stopColor="#0f172a" stopOpacity="0.1" />
        <stop offset="70%" stopColor="#020617" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#020617" stopOpacity="1" />
      </radialGradient>
      <rect
        x={0}
        y={0}
        width={size}
        height={size}
        fill="url(#radial-bg)"
        opacity={0.85}
      />

      {/* rings (still visible in drill) */}
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
      <circle
        cx={cx}
        cy={cy}
        r={3}
        className="fill-sky-400/90"
        style={{ filter: "drop-shadow(0 0 8px rgba(56,189,248,0.9))" }}
      />
      <circle cx={cx} cy={cy} r={8} className="fill-sky-500/10" />

      {/* DRILL MODE: single wide wedge for one category */}
      {isDrill ? (
        (() => {
          const cat = categories.find((c) => c.id === drillCategoryId);
          if (!cat) return null;

          const clsCategory =
            cls.categories.find((c) => c.id === cat.id) ?? null;
          const studentCategory =
            selectedStudent?.categories.find((c) => c.id === cat.id) ?? null;

          const angleSpan = (160 * Math.PI) / 180; // 160°
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
          } = clsCategory
            ? subskillPolylineForCategory(
                clsCategory,
                viewMode === "compare" ? studentCategory : null,
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
                classPoints: [] as { id: string; x: number; y: number }[],
                studentPoints: [] as { id: string; x: number; y: number }[],
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

              {/* category name centered above */}
              <g transform={`translate(${labelPoint.x}, ${labelPoint.y})`}>
                <text
                  className="fill-slate-50 text-[11px] font-semibold"
                  textAnchor="middle"
                  alignmentBaseline="baseline"
                >
                  {cat.name}
                </text>
              </g>

              {/* score label at tip */}
              <g
                transform={`translate(${cx + Math.cos(mid) * scoreRadius}, ${
                  cy + Math.sin(mid) * scoreRadius
                })`}
              >
                <rect
                  x={-16}
                  y={-9}
                  width={32}
                  height={18}
                  rx={9}
                  className="fill-slate-950/90"
                  stroke="#38bdf8"
                  strokeWidth={0.8}
                />
                <text
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  className="fill-slate-100 text-[10px] font-semibold"
                >
                  {cat.avgScore.toFixed(0)}
                </text>
              </g>

              {/* class polyline */}
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

              {/* student polyline + baseline in compare */}
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
                        filter:
                          "drop-shadow(0 0 6px rgba(34,197,94,0.9))",
                      }}
                    />
                  )}
                </>
              )}

              {/* class points */}
              {classPoints.map((pt) => (
                <circle
                  key={`class-${pt.id}`}
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
                    key={`student-${pt.id}`}
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
            const explodeOffset = 2;

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

            const baseFill = [
              "rgba(56,189,248,0.22)",
              "rgba(96,165,250,0.22)",
              "rgba(129,140,248,0.22)",
              "rgba(52,211,153,0.22)",
              "rgba(250,204,21,0.22)",
            ][idx % 5];

            const fill = baseFill;
            const stroke = isHovered
              ? "rgba(56,189,248,1)"
              : "rgba(15,23,42,0.9)";

            const scoreRadius = rOuter + 14;

            const clsCategory: CategoryScore | null =
              cls.categories.find((c) => c.id === cat.id) ?? null;
            const studentCategory: CategoryScore | null =
              selectedStudent?.categories.find((c) => c.id === cat.id) ?? null;

            const {
              classLine,
              studentBaseline,
              studentPeaks,
              classPoints,
              studentPoints,
            } =
              ((viewMode === "compare" && selectedStudent && isHovered) ||
                (viewMode === "average" && isHovered)) &&
              clsCategory
                ? subskillPolylineForCategory(
                    clsCategory,
                    viewMode === "compare" ? studentCategory : null,
                    idx,
                    maxRadius,
                    dx,
                    dy,
                  )
                : {
                    classLine: "",
                    studentBaseline: "",
                    studentPeaks: "",
                    classPoints: [] as {
                      id: string;
                      x: number;
                      y: number;
                    }[],
                    studentPoints: [] as {
                      id: string;
                      x: number;
                      y: number;
                    }[],
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
                {/* glow behind hovered wedge */}
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
                <g transform={`translate(${labelPoint.x}, ${labelPoint.y})`}>
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
                  transform={`translate(${
                    cx + dx + Math.cos(mid) * scoreRadius
                  }, ${cy + dy + Math.sin(mid) * scoreRadius})`}
                >
                  <rect
                    x={-14}
                    y={-8}
                    width={28}
                    height={16}
                    rx={8}
                    className="fill-slate-950/90"
                    stroke={isHovered ? "#38bdf8" : "rgba(15,23,42,0.9)"}
                    strokeWidth={0.7}
                  />
                  <text
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    className="fill-slate-100 text-[9px] font-semibold"
                  >
                    {cat.avgScore.toFixed(0)}
                  </text>
                </g>

                {/* subskill lines + points: class in avg+compare, student only in compare */}
                {isHovered && (classLine || studentPeaks) && (
                  <g>
                    {classLine && (
                      <polyline
                        points={classLine}
                        fill="none"
                        stroke="rgba(148,163,184,0.9)"
                        strokeWidth={1.6}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

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
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{
                              filter:
                                "drop-shadow(0 0 6px rgba(34,197,94,0.9))",
                            }}
                          />
                        )}
                      </>
                    )}

                    {/* points are clickable here too */}
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

          {/* student dots */}
          {viewMode === "students" && (
            <g opacity={0.95}>
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
                  return (
                    <circle
                      key={`${s.id}-${cat.id}`}
                      cx={px}
                      cy={py}
                      r={1.6}
                      fill="rgba(129,140,248,0.95)"
                    />
                  );
                }),
              )}
            </g>
          )}

          {/* compare student polyline */}
          {viewMode === "compare" && selectedStudent && (
            <g>
              {(() => {
                const pts = studentPolylinePoints(
                  selectedStudent,
                  explodeOffsets,
                );
                if (!pts) return null;
                return (
                  <>
                    <polyline
                      points={pts}
                      fill="none"
                      stroke="rgba(15,23,42,0.9)"
                      strokeWidth={3.4}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={0.9}
                    />
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
                  </>
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
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${endInner.x} ${endInner.y}`,
    "Z",
  ].join(" ");
}

function polar(
  cx: number,
  cy: number,
  r: number,
  angle: number,
): { x: number; y: number } {
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
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

  const classCat = cls.categories.find((c) => c.id === category.id) ?? null;
  const classSubs: SubcategoryScore[] = classCat?.subcategories ?? [];

  const studentCat =
    viewMode === "compare" && selectedStudent
      ? selectedStudent.categories.find((c) => c.id === category.id) ?? null
      : null;

  const studentSubs: SubcategoryScore[] =
    viewMode === "compare" ? studentCat?.subcategories ?? [] : [];

  const combinedSubIds = Array.from(
    new Set([...classSubs.map((s) => s.id), ...studentSubs.map((s) => s.id)]),
  );

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-800/80 bg-gradient-to-b from-slate-950/90 to-slate-950/60 p-3">
      <div className="mb-2 flex items-start justify-between gap-2 border-b border-slate-800/70 pb-2">
        <div className="space-y-0.5">
          <h3 className="text-xs font-semibold text-slate-100">
            {category.name}
          </h3>
          <p className="text-[11px] text-slate-400">
            Class average{" "}
            <span className="font-mono text-slate-100">
              {category.avgScore.toFixed(0)}
            </span>
          </p>
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
            const name = classSub?.name ?? studentSub?.name ?? "Subskill";
            const isActive = activeSubskillId === id;

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
                  <span className="text-[11px] text-slate-100">{name}</span>
                  <span className="text-[10px] text-slate-500">
                    {viewMode === "compare"
                      ? isActive
                        ? "Selected subskill · Class vs student"
                        : "Class vs student"
                      : isActive
                      ? "Selected subskill · Class average"
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
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
