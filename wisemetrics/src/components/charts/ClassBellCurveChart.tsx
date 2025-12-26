// src/components/charts/ClassBellCurveChart.tsx
"use client";

import { useMemo, useState } from "react";
import type {
  ClassScoreSummary,
  StudentScoreSummary,
  SubcategoryScore,
} from "@/types/scores";
import { clampScore } from "@/lib/chartScaling";

type ViewMode = "average" | "students" | "compare";

type Props = {
  cls: ClassScoreSummary;
  svgRef?: React.Ref<SVGSVGElement>;
};

type ActiveDotKind = "overall" | "category" | "subskill";

type ActiveDot = {
  kind: ActiveDotKind;
  studentId: string;
  categoryId?: string;
  subcategoryId?: string;
};

type CategoryView = {
  id: string;
  name: string;
  abbrev: string;
  avgScore: number;
  subskills: SubcategoryScore[];
};

const MEAN = 100;
const SD = 15;
const SCORE_MIN = 60;
const SCORE_MAX = 150;

/** Normal PDF */
function normalPdf(x: number, mean: number, sd: number): number {
  const z = (x - mean) / sd;
  return (1 / (sd * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z);
}

/** Deterministic small vertical jitter in [-jitter, jitter] */
function jitterForKey(key: string, jitter = 6): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  const v = (hash % 1000) / 1000; // 0..1
  return (v * 2 - 1) * jitter;
}

/**
 * Build minimal abbreviations: start with first letter, and if duplicates,
 * extend to 2nd, 3rd, ... characters until all are unique.
 */
function buildLeadingLetterAbbrevs(names: string[]): string[] {
  const cleaned = names.map((n) => n.trim());
  const maxLen =
    Math.max(...cleaned.map((n) => (n.length === 0 ? 1 : n.length))) || 1;

  let length = 1;
  let abbrevs: string[] = [];
  while (length <= maxLen) {
    abbrevs = cleaned.map((name) => {
      if (name.length === 0) return "?";
      const slice = name.slice(0, length);
      return slice.toUpperCase();
    });

    const set = new Set(abbrevs);
    if (set.size === abbrevs.length) {
      break; // all unique at this length
    }
    length += 1;
  }

  return abbrevs;
}

export function ClassBellCurveChart({ cls, svgRef }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("average");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null,
  );
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(
    null,
  );
  const [activeDot, setActiveDot] = useState<ActiveDot | null>(null);

  const categories: CategoryView[] = useMemo(() => {
    const abbrevs = buildLeadingLetterAbbrevs(cls.categories.map((c) => c.name));
    return cls.categories.map((c, idx) => ({
      id: c.id,
      name: c.name,
      abbrev: abbrevs[idx],
      avgScore: clampScore(c.score),
      subskills: (c.subcategories ?? []).map((sub) => ({
        ...sub,
        score: clampScore(sub.score),
      })),
    }));
  }, [cls]);

  const selectedStudent: StudentScoreSummary | null =
    selectedStudentId != null
      ? cls.students.find((s) => s.id === selectedStudentId) ?? null
      : null;

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
            Class distribution
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
      <div className="flex min-h-[300px] flex-1 gap-4">
        <div className="relative flex-[3] min-w-[320px]">
          <BellCurveCanvas
            cls={cls}
            categories={categories}
            viewMode={viewMode}
            selectedStudent={selectedStudent}
            hoveredCategoryId={hoveredCategoryId}
            setHoveredCategoryId={setHoveredCategoryId}
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
            <AverageDetailPanel
              cls={cls}
              categories={categories}
              hoveredCategoryId={hoveredCategoryId}
              viewMode={viewMode}
              selectedStudent={selectedStudent}
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
      hint: "Curve + category & subskill means",
    },
    {
      id: "students",
      label: "Dots",
      hint: "All students + subskills",
    },
    {
      id: "compare",
      label: "Compare",
      hint: "Student vs curve, cats & subs",
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

type BellProps = {
  cls: ClassScoreSummary;
  categories: CategoryView[];
  viewMode: ViewMode;
  selectedStudent: StudentScoreSummary | null;
  hoveredCategoryId: string | null;
  setHoveredCategoryId: (id: string | null) => void;
  activeDot: ActiveDot | null;
  setActiveDot: (dot: ActiveDot | null) => void;
  svgRef?: React.Ref<SVGSVGElement>;
};

function BellCurveCanvas({
  cls,
  categories,
  viewMode,
  selectedStudent,
  hoveredCategoryId,
  setHoveredCategoryId,
  activeDot,
  setActiveDot,
  svgRef,
}: BellProps) {
  const width = 520;
  const height = 270;
  const marginLeft = 42;
  const marginRight = 24;
  const marginTop = 26;
  const marginBottom = 54;

  function xScale(score: number): number {
    const t = (clampScore(score) - SCORE_MIN) / (SCORE_MAX - SCORE_MIN);
    return marginLeft + t * (width - marginLeft - marginRight);
  }

  const sampleXs: number[] = [];
  const steps = 180;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const s = SCORE_MIN + t * (SCORE_MAX - SCORE_MIN);
    sampleXs.push(s);
  }

  const pdfValues = sampleXs.map((s) => normalPdf(s, MEAN, SD));
  const maxPdf = Math.max(...pdfValues, 1e-6);

  function yScaleFromPdf(pdf: number): number {
    const t = pdf / maxPdf;
    const usableHeight = height - marginTop - marginBottom;
    return marginTop + (1 - t) * usableHeight;
  }

  const curvePath = (() => {
    const pts: string[] = [];
    sampleXs.forEach((s, i) => {
      const x = xScale(s);
      const pdf = pdfValues[i];
      const y = yScaleFromPdf(pdf);
      pts.push(`${x},${y}`);
    });
    if (!pts.length) return "";
    return "M " + pts.join(" L ");
  })();

  const classOverallMean =
    cls.students.length > 0
      ? cls.students.reduce((sum, s) => sum + s.overallScore, 0) /
        cls.students.length
      : MEAN;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      className="h-full w-full"
    >
      {/* gradients */}
      <defs>
        <linearGradient id="bell-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#020617" stopOpacity="1" />
          <stop offset="90%" stopColor="#020617" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#020617" stopOpacity="1" />
        </linearGradient>
        <linearGradient id="bell-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* background */}
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill="url(#bell-bg)"
      />

      {/* x-axis */}
      <line
        x1={marginLeft}
        y1={height - marginBottom}
        x2={width - marginRight}
        y2={height - marginBottom}
        className="stroke-slate-700/80"
        strokeWidth={1}
      />

      {/* x ticks */}
      {Array.from({ length: 10 }).map((_, i) => {
        const score = SCORE_MIN + i * ((SCORE_MAX - SCORE_MIN) / 9);
        const x = xScale(score);
        return (
          <g key={score}>
            <line
              x1={x}
              y1={height - marginBottom}
              x2={x}
              y2={height - marginBottom + 4}
              className="stroke-slate-700/70"
              strokeWidth={1}
            />
            <text
              x={x}
              y={height - marginBottom + 14}
              className="fill-slate-500 text-[9px]"
              textAnchor="middle"
            >
              {Math.round(score)}
            </text>
          </g>
        );
      })}

      {/* bell curve fill */}
      {curvePath && (
        <path
          d={
            curvePath +
            ` L ${xScale(SCORE_MAX)},${height - marginBottom}` +
            ` L ${xScale(SCORE_MIN)},${height - marginBottom} Z`
          }
          fill="url(#bell-fill)"
          opacity={0.22}
        />
      )}

      {/* bell curve outline */}
      {curvePath && (
        <path
          d={curvePath}
          fill="none"
          stroke="rgba(56,189,248,0.95)"
          strokeWidth={2}
        />
      )}

      {/* class overall vertical line */}
      <line
        x1={xScale(classOverallMean)}
        y1={marginTop}
        x2={xScale(classOverallMean)}
        y2={height - marginBottom}
        className="stroke-slate-500/70"
        strokeDasharray="4 3"
        strokeWidth={1}
      />
      <text
        x={xScale(classOverallMean)}
        y={marginTop - 6}
        className="fill-slate-400 text-[10px]"
        textAnchor="middle"
      >
        Class overall
      </text>

      {/* category avg markers + subskill avg dots in average/compare */}
      {(viewMode === "average" || viewMode === "compare") && (
        <>
          {categories.map((cat) => {
            const x = xScale(cat.avgScore);
            const pdf = normalPdf(cat.avgScore, MEAN, SD);
            const y = yScaleFromPdf(pdf);
            const isHovered = hoveredCategoryId === cat.id;

            return (
              <g
                key={cat.id}
                onMouseEnter={() => setHoveredCategoryId(cat.id)}
                onMouseLeave={() => setHoveredCategoryId(null)}
                className="cursor-pointer"
              >
                <line
                  x1={x}
                  y1={y}
                  x2={x}
                  y2={height - marginBottom}
                  className="stroke-slate-600/70"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                />
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 4 : 3}
                  className={
                    isHovered ? "fill-sky-300" : "fill-sky-400/90"
                  }
                />
                <text
                  x={x}
                  y={height - marginBottom + 26}
                  className="fill-slate-50 text-[9px]"
                  textAnchor="middle"
                >
                  {cat.abbrev}
                </text>
              </g>
            );
          })}

          {/* subskill class averages as faint purple dots */}
          {categories.flatMap((cat) =>
            cat.subskills.map((sub) => {
              const x = xScale(sub.score);
              const pdf = normalPdf(sub.score, MEAN, SD);
              const baseY = yScaleFromPdf(pdf);
              const y =
                baseY +
                jitterForKey(`class-sub-${cat.id}-${sub.id}`, 3);

              return (
                <circle
                  key={`class-sub-${cat.id}-${sub.id}`}
                  cx={x}
                  cy={y}
                  r={1.6}
                  fill="#a855f7"
                  opacity={0.65}
                />
              );
            }),
          )}
        </>
      )}

      {/* students mode: overall, category and subskill dots with jitter */}
      {viewMode === "students" && (
        <>
          {/* overall dots (orange) */}
          {cls.students.map((s) => {
            const x = xScale(s.overallScore);
            const pdf = normalPdf(s.overallScore, MEAN, SD);
            const baseY = yScaleFromPdf(pdf);
            const y = baseY + jitterForKey(`overall-${s.id}`);

            const isActive =
              activeDot &&
              activeDot.kind === "overall" &&
              activeDot.studentId === s.id;
            return (
              <circle
                key={`overall-${s.id}`}
                cx={x}
                cy={y}
                r={isActive ? 3.2 : 2.4}
                fill={isActive ? "#fed7aa" : "#f97316"}
                style={{
                  cursor: "pointer",
                  filter: isActive
                    ? "drop-shadow(0 0 7px rgba(249,115,22,0.95))"
                    : "drop-shadow(0 0 4px rgba(249,115,22,0.75))",
                }}
                onClick={() =>
                  setActiveDot({
                    kind: "overall",
                    studentId: s.id,
                  })
                }
              />
            );
          })}

          {/* per-category dots (green) */}
          {cls.students.flatMap((s) =>
            s.categories.map((cat) => {
              const x = xScale(cat.score);
              const pdf = normalPdf(cat.score, MEAN, SD);
              const baseY = yScaleFromPdf(pdf);
              const y =
                baseY + jitterForKey(`cat-${s.id}-${cat.id}`, 5);

              const isActive =
                activeDot &&
                activeDot.kind === "category" &&
                activeDot.studentId === s.id &&
                activeDot.categoryId === cat.id;
              return (
                <circle
                  key={`cat-${s.id}-${cat.id}`}
                  cx={x}
                  cy={y}
                  r={isActive ? 2.8 : 2.2}
                  fill={isActive ? "#bbf7d0" : "#22c55e"}
                  opacity={0.92}
                  style={{
                    cursor: "pointer",
                    filter: isActive
                      ? "drop-shadow(0 0 6px rgba(34,197,94,0.95))"
                      : "drop-shadow(0 0 4px rgba(34,197,94,0.7))",
                  }}
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

          {/* subskill dots (purple) */}
          {cls.students.flatMap((s) =>
            s.categories.flatMap((cat) =>
              (cat.subcategories ?? []).map((sub) => {
                const x = xScale(sub.score);
                const pdf = normalPdf(sub.score, MEAN, SD);
                const baseY = yScaleFromPdf(pdf);
                const y =
                  baseY + jitterForKey(`sub-${s.id}-${sub.id}`, 4);

                const isActive =
                  activeDot &&
                  activeDot.kind === "subskill" &&
                  activeDot.studentId === s.id &&
                  activeDot.subcategoryId === sub.id;
                return (
                  <circle
                    key={`sub-${s.id}-${sub.id}`}
                    cx={x}
                    cy={y}
                    r={isActive ? 2.6 : 1.8}
                    fill={isActive ? "#e9d5ff" : "#a855f7"}
                    opacity={0.9}
                    style={{
                      cursor: "pointer",
                      filter: isActive
                        ? "drop-shadow(0 0 6px rgba(168,85,247,0.95))"
                        : "drop-shadow(0 0 3px rgba(168,85,247,0.7))",
                    }}
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
        </>
      )}

      {/* compare mode: selected student vs class using dots */}
      {viewMode === "compare" && selectedStudent && (
        <>
          {/* bold overall vertical line for selected student */}
          <line
            x1={xScale(selectedStudent.overallScore)}
            y1={marginTop}
            x2={xScale(selectedStudent.overallScore)}
            y2={height - marginBottom}
            className="stroke-orange-400"
            strokeWidth={2}
          />
          {/* connector and label moved outside chart */}
          {(() => {
            const x = xScale(selectedStudent.overallScore);
            const anchorY = marginTop - 4;
            const labelX = x + 8;
            const labelY = marginTop - 14;
            return (
              <>
                <line
                  x1={x}
                  y1={anchorY}
                  x2={labelX}
                  y2={labelY + 2}
                  stroke="rgba(249,115,22,0.8)"
                  strokeWidth={1}
                />
                <text
                  x={labelX}
                  y={labelY}
                  className="fill-orange-300 text-[10px]"
                  textAnchor="start"
                >
                  {selectedStudent.name}
                </text>
              </>
            );
          })()}

          {/* medium dots for this student's category scores */}
          {selectedStudent.categories.map((cat) => {
            const x = xScale(cat.score);
            const pdf = normalPdf(cat.score, MEAN, SD);
            const baseY = yScaleFromPdf(pdf);
            const y = baseY + jitterForKey(
              `cmp-cat-${selectedStudent.id}-${cat.id}`,
              3,
            );

            return (
              <circle
                key={`cmp-cat-${cat.id}`}
                cx={x}
                cy={y}
                r={2.6}
                fill="#22c55e"
                opacity={0.85}
              />
            );
          })}

          {/* faint dots for this student's subskill scores */}
          {selectedStudent.categories.flatMap((cat) =>
            (cat.subcategories ?? []).map((sub) => {
              const x = xScale(sub.score);
              const pdf = normalPdf(sub.score, MEAN, SD);
              const baseY = yScaleFromPdf(pdf);
              const y = baseY + jitterForKey(
                `cmp-sub-${selectedStudent.id}-${sub.id}`,
                2.5,
              );

              return (
                <circle
                  key={`cmp-sub-${sub.id}`}
                  cx={x}
                  cy={y}
                  r={2}
                  fill="#a855f7"
                  opacity={0.6}
                />
              );
            }),
          )}
        </>
      )}
    </svg>
  );
}

type AveragePanelProps = {
  cls: ClassScoreSummary;
  categories: CategoryView[];
  hoveredCategoryId: string | null;
  viewMode: ViewMode;
  selectedStudent: StudentScoreSummary | null;
};

function AverageDetailPanel({
  cls,
  categories,
  hoveredCategoryId,
  viewMode,
  selectedStudent,
}: AveragePanelProps) {
  const category =
    hoveredCategoryId != null
      ? categories.find((c) => c.id === hoveredCategoryId) ?? null
      : null;

  const classOverallMean =
    cls.students.length > 0
      ? cls.students.reduce((sum, s) => sum + s.overallScore, 0) /
        cls.students.length
      : MEAN;

  // For compare mode, compute student vs class deltas for category + subskills
  let studentCategoryScore: number | null = null;
  let deltaCategory: number | null = null;
  let studentSubskills: { name: string; student: number; delta: number }[] = [];

  if (viewMode === "compare" && selectedStudent && category) {
    const studentCat = selectedStudent.categories.find(
      (c) => c.id === category.id,
    );
    if (studentCat) {
      studentCategoryScore = clampScore(studentCat.score);
      deltaCategory = studentCategoryScore - category.avgScore;
      const classSubById = new Map(
        category.subskills.map((s) => [s.id, s]),
      );
      (studentCat.subcategories ?? []).forEach((sub) => {
        const classSub = classSubById.get(sub.id);
        if (!classSub) return;
        const stud = clampScore(sub.score);
        const delta = stud - classSub.score;
        studentSubskills.push({
          name: sub.name,
          student: stud,
          delta,
        });
      });
    }
  }

  function formatDelta(d: number | null): string {
    if (d == null || Number.isNaN(d)) return "–";
    const rounded = Math.round(d);
    if (rounded === 0) return "0";
    if (rounded > 0) return `+${rounded}`;
    return `${rounded}`;
  }

  function deltaColor(delta: number | null): string {
    if (delta == null || Number.isNaN(delta)) return "text-slate-400";
    if (delta >= 8) return "text-emerald-300";
    if (delta >= 3) return "text-emerald-200";
    if (delta <= -8) return "text-red-400";
    if (delta <= -3) return "text-red-300";
    return "text-slate-300";
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-800/80 bg-gradient-to-b from-slate-950/90 to-slate-950/60 p-3">
      <div className="mb-2 flex items-start justify-between gap-2 border-b border-slate-800/70 pb-2">
        <div className="space-y-0.5">
          <h3 className="text-xs font-semibold text-slate-100">
            Class bell curve
          </h3>
          <p className="text-[11px] text-slate-400">
            Overall mean{" "}
            <span className="font-mono text-slate-100">
              {classOverallMean.toFixed(0)}
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
              Overall {Math.round(selectedStudent.overallScore)}{" "}
              <span className="text-slate-400">
                ({formatDelta(
                  selectedStudent.overallScore - classOverallMean,
                )}
                )
              </span>
            </div>
          </div>
        )}
      </div>

      {!category ? (
        <p className="mt-4 text-center text-[11px] text-slate-500">
          Hover a category marker on the curve to see its average and
          subskills.
        </p>
      ) : (
        <div className="space-y-2 text-[11px]">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
              Category
            </div>
            <div className="font-medium text-slate-100">
              {category.name}
            </div>
          </div>

          {/* Class vs student category row */}
          <div className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/70 px-2 py-1">
            <div className="text-[10px] text-slate-400">
              Class average score
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-slate-900/90 px-1.5 py-0.5 font-mono text-[10px] text-sky-300">
                {Math.round(category.avgScore)}
              </span>
              {viewMode === "compare" && studentCategoryScore != null && (
                <>
                  <span className="text-[9px] text-slate-500">vs student</span>
                  <span className="rounded-full bg-slate-900/90 px-1.5 py-0.5 font-mono text-[10px] text-emerald-300">
                    {Math.round(studentCategoryScore)}
                  </span>
                  <span
                    className={
                      "font-mono text-[10px] " +
                      deltaColor(deltaCategory)
                    }
                  >
                    {formatDelta(deltaCategory)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Subskills section */}
          {category.subskills.length > 0 && (
            <div className="mt-1 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                  Subskill averages
                </div>
                {viewMode === "compare" && selectedStudent && (
                  <div className="text-[9px] text-slate-500">
                    Student vs class (Δ)
                  </div>
                )}
              </div>
              <div className="space-y-0.5">
                {category.subskills.map((sub) => {
                  const studentRow =
                    viewMode === "compare" && selectedStudent
                      ? studentSubskills.find((s) => s.name === sub.name)
                      : null;
                  return (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between rounded-md border border-slate-900/80 bg-slate-950/60 px-1.5 py-0.5"
                    >
                      <span className="truncate text-[10px] text-slate-300">
                        {sub.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-violet-300">
                          {Math.round(sub.score)}
                        </span>
                        {studentRow && (
                          <>
                            <span className="text-[9px] text-slate-500">
                              /
                            </span>
                            <span className="font-mono text-[10px] text-emerald-300">
                              {Math.round(studentRow.student)}
                            </span>
                            <span
                              className={
                                "font-mono text-[10px] " +
                                deltaColor(studentRow.delta)
                              }
                            >
                              {formatDelta(studentRow.delta)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <p className="mt-2 text-[10px] text-slate-500">
            Category and subskill scores are placed on the same 60–150
            standard score curve so you can compare a single student to the
            class at each level.
          </p>
        </div>
      )}
    </div>
  );
}

type DotsPanelProps = {
  cls: ClassScoreSummary;
  categories: CategoryView[];
  activeDot: ActiveDot | null;
};

function DotsDetailPanel({ cls, categories, activeDot }: DotsPanelProps) {
  if (!activeDot) {
    return (
      <div className="flex h-full flex-col rounded-xl border border-slate-800/80 bg-slate-950/40 p-3 text-[11px] text-slate-500">
        <div className="mb-2 border-b border-dashed border-slate-800/80 pb-2">
          <h3 className="text-xs font-semibold text-slate-100">
            Dots view
          </h3>
          <p className="mt-1 text-[11px] text-slate-400">
            Click any dot to see which student, category, or subskill it
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
  if (!student) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-500">
        This dot refers to data that could not be found.
      </div>
    );
  }

  if (activeDot.kind === "overall") {
    return (
      <div className="flex h-full flex-col rounded-xl border border-slate-800/80 bg-gradient-to-b from-slate-950/90 to-slate-950/60 p-3">
        <div className="mb-2 border-b border-slate-800/70 pb-2">
          <h3 className="text-xs font-semibold text-orange-300">
            Overall dot
          </h3>
          <p className="mt-0.5 text-[10px] text-slate-500">
            Each orange dot is one student&apos;s overall standard score
            placed on the class bell curve.
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
              Grade {student.gradeLevel}
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/70 px-2 py-1">
            <span className="text-[10px] text-slate-400">
              Overall standard score
            </span>
            <span className="rounded-full bg-slate-900/90 px-1.5 py-0.5 font-mono text-[10px] text-orange-300">
              {Math.round(student.overallScore)}
            </span>
          </div>

          <p className="mt-3 text-[10px] text-slate-500">
            The horizontal position of this dot shows where the student&apos;s
            overall performance falls within the class distribution.
          </p>
        </div>
      </div>
    );
  }

  const categoryId = activeDot.categoryId;
  const studentCategory =
    categoryId != null
      ? student.categories.find((c) => c.id === categoryId) ?? null
      : null;
  const categoryMeta =
    categoryId != null
      ? categories.find((c) => c.id === categoryId) ?? null
      : null;

  if (activeDot.kind === "category") {
    return (
      <div className="flex h-full flex-col rounded-xl border border-slate-800/80 bg-gradient-to-b from-slate-950/90 to-slate-950/60 p-3">
        <div className="mb-2 border-b border-slate-800/70 pb-2">
          <h3 className="text-xs font-semibold text-emerald-300">
            Category dot
          </h3>
          <p className="mt-0.5 text-[10px] text-slate-500">
            Each green dot is one student&apos;s score in a category,
            positioned on the same bell curve.
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
          </div>

          {categoryMeta && (
            <div>
              <div className="mt-2 text-[10px] uppercase tracking-[0.18em] text-slate-500">
                Category
              </div>
              <div className="font-medium text-slate-100">
                {categoryMeta.name}
              </div>
            </div>
          )}

          {studentCategory && (
            <div className="mt-2 flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/70 px-2 py-1">
              <span className="text-[10px] text-slate-400">
                Student score in this category
              </span>
              <span className="rounded-full bg-slate-900/90 px-1.5 py-0.5 font-mono text-[10px] text-emerald-300">
                {Math.round(studentCategory.score)}
              </span>
            </div>
          )}

          <p className="mt-3 text-[10px] text-slate-500">
            This dot shows how this category score sits within the class bell
            curve, using the same 60–150 standard score scale.
          </p>
        </div>
      </div>
    );
  }

  // subskill dot
  const subId = activeDot.subcategoryId;
  const catForSub =
    categoryId != null
      ? categories.find((c) => c.id === categoryId) ?? null
      : null;
  const studentSub =
    subId != null && studentCategory
      ? studentCategory.subcategories?.find((s) => s.id === subId) ?? null
      : null;
  const subMeta =
    subId != null && catForSub
      ? catForSub.subskills.find((s) => s.id === subId) ?? null
      : null;

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-800/80 bg-gradient-to-b from-slate-950/90 to-slate-950/60 p-3">
      <div className="mb-2 border-b border-slate-800/70 pb-2">
        <h3 className="text-xs font-semibold text-violet-300">
          Subskill dot
        </h3>
        <p className="mt-0.5 text-[10px] text-slate-500">
          Each purple dot is one student&apos;s score in a subskill,
          aligned to the same bell curve.
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
        </div>

        {catForSub && (
          <div>
            <div className="mt-2 text-[10px] uppercase tracking-[0.18em] text-slate-500">
              Category
            </div>
            <div className="font-medium text-slate-100">
              {catForSub.name}
            </div>
          </div>
        )}

        {subMeta && (
          <div>
            <div className="mt-2 text-[10px] uppercase tracking-[0.18em] text-slate-500">
              Subskill
            </div>
            <div className="font-medium text-slate-100">
              {subMeta.name}
            </div>
          </div>
        )}

        {studentSub && (
          <div className="mt-2 flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/70 px-2 py-1">
            <span className="text-[10px] text-slate-400">
              Student score in this subskill
            </span>
            <span className="rounded-full bg-slate-900/90 px-1.5 py-0.5 font-mono text-[10px] text-violet-300">
              {Math.round(studentSub.score)}
            </span>
          </div>
        )}

        <p className="mt-3 text-[10px] text-slate-500">
          This dot shows how this subskill score fits inside the same 60–150
          standard score distribution as the rest of the class.
        </p>
      </div>
    </div>
  );
}
