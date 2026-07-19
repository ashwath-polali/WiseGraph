"use client";

import { useMemo, useState } from "react";
import type { ClassScoreSummary, StudentScoreSummary } from "@/types/scores";
import { clampScore } from "@/lib/chartScaling";
import { buildAbbreviations, type CategoryView } from "./geometry";
import {
  BackToCategoriesButton,
  StudentPicker,
  ViewModeToggle,
  type ViewMode,
} from "./controls";
import { RadialCanvas, type RadialActiveDot } from "./RadialCanvas";
import { DetailPanel, DotsDetailPanel } from "./radial-panels";

const HINTS: Record<ViewMode, string> = {
  average: "Category wedges + subskills",
  students: "All students per category & subskill",
  compare: "Single student vs class",
};

type Props = {
  cls: ClassScoreSummary;
  svgRef?: React.Ref<SVGSVGElement>;
};

export function ClassRadialChart({ cls, svgRef }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("average");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null,
  );
  const [drillCategoryId, setDrillCategoryId] = useState<string | null>(null);
  const [activeSubskillId, setActiveSubskillId] = useState<string | null>(null);
  const [activeDot, setActiveDot] = useState<RadialActiveDot | null>(null);

  const categories: CategoryView[] = useMemo(() => {
    const abbrevs = buildAbbreviations(cls.categories.map((c) => c.name));
    return cls.categories.map((cat, i) => ({
      id: cat.id,
      name: cat.name,
      abbrev: abbrevs[i],
      avgScore: clampScore(cat.score),
      classSubs: cat.subcategories ?? [],
    }));
  }, [cls]);

  const hovered =
    hoveredId != null
      ? (categories.find((c) => c.id === hoveredId) ?? null)
      : null;

  const selectedStudent: StudentScoreSummary | null =
    selectedStudentId != null
      ? (cls.students.find((s) => s.id === selectedStudentId) ?? null)
      : null;

  const drillCategory =
    drillCategoryId != null
      ? (categories.find((c) => c.id === drillCategoryId) ?? null)
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
    <div className="flex h-full flex-col gap-3">
      {/* controls */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 pt-0.5">
          {drillCategory && (
            <BackToCategoriesButton onClick={() => setDrillCategoryId(null)} />
          )}
        </div>
        <div className="flex items-start gap-3">
          {viewMode === "compare" && cls.students.length > 0 && (
            <StudentPicker
              students={cls.students}
              selectedStudentId={selectedStudentId}
              setSelectedStudentId={setSelectedStudentId}
            />
          )}
          <ViewModeToggle
            viewMode={viewMode}
            setViewMode={handleSetViewMode}
            hints={HINTS}
            pillId="radial-viewmode"
          />
        </div>
      </div>

      {/* canvas + side panel */}
      <div className="flex min-h-[320px] flex-1 gap-4">
        <div className="relative min-w-[320px] flex-[3]">
          <RadialCanvas
            categories={categories}
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
              students={cls.students}
              categories={categories}
              activeDot={activeDot}
            />
          ) : (
            <DetailPanel
              category={drillCategory ?? hovered}
              viewMode={viewMode}
              selectedStudent={selectedStudent}
              activeSubskillId={activeSubskillId}
            />
          )}
        </div>
      </div>
    </div>
  );
}
