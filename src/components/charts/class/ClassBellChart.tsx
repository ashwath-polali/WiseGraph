"use client";

import { useMemo, useState } from "react";
import type { ClassScoreSummary, StudentScoreSummary } from "@/types/scores";
import { clampScore } from "@/lib/chartScaling";
import {
  MEAN,
  buildLeadingLetterAbbrevs,
  type CategoryView,
} from "./geometry";
import { StudentPicker, ViewModeToggle, type ViewMode } from "./controls";
import { BellCanvas, type BellActiveDot } from "./BellCanvas";
import { AverageDetailPanel, BellDotsDetailPanel } from "./bell-panels";

const HINTS: Record<ViewMode, string> = {
  average: "Curve + category & subskill means",
  students: "All students + subskills",
  compare: "Student vs curve, cats & subs",
};

type Props = {
  cls: ClassScoreSummary;
  svgRef?: React.Ref<SVGSVGElement>;
};

export function ClassBellChart({ cls, svgRef }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("average");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null,
  );
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(
    null,
  );
  const [activeDot, setActiveDot] = useState<BellActiveDot | null>(null);

  const categories: CategoryView[] = useMemo(() => {
    const abbrevs = buildLeadingLetterAbbrevs(cls.categories.map((c) => c.name));
    return cls.categories.map((c, idx) => ({
      id: c.id,
      name: c.name,
      abbrev: abbrevs[idx],
      avgScore: clampScore(c.score),
      classSubs: (c.subcategories ?? []).map((sub) => ({
        ...sub,
        score: clampScore(sub.score),
      })),
    }));
  }, [cls]);

  const selectedStudent: StudentScoreSummary | null =
    selectedStudentId != null
      ? (cls.students.find((s) => s.id === selectedStudentId) ?? null)
      : null;

  const classOverallMean =
    cls.students.length > 0
      ? cls.students.reduce((sum, s) => sum + s.overallScore, 0) /
        cls.students.length
      : MEAN;

  function handleSetViewMode(m: ViewMode) {
    setViewMode(m);
    if (m !== "students") {
      setActiveDot(null);
    }
  }

  return (
    <div className="flex h-full flex-col gap-3">
      {/* controls */}
      <div className="flex items-start justify-end gap-3">
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
          pillId="bell-viewmode"
        />
      </div>

      {/* canvas + side panel */}
      <div className="flex min-h-[300px] flex-1 gap-4">
        <div className="relative min-w-[320px] flex-[3]">
          <BellCanvas
            categories={categories}
            students={cls.students}
            viewMode={viewMode}
            selectedStudent={selectedStudent}
            classOverallMean={classOverallMean}
            hoveredCategoryId={hoveredCategoryId}
            setHoveredCategoryId={setHoveredCategoryId}
            activeDot={activeDot}
            setActiveDot={setActiveDot}
            svgRef={svgRef}
          />
        </div>

        <div className="flex-[1.5] shrink-0">
          {viewMode === "students" ? (
            <BellDotsDetailPanel
              students={cls.students}
              categories={categories}
              activeDot={activeDot}
            />
          ) : (
            <AverageDetailPanel
              categories={categories}
              hoveredCategoryId={hoveredCategoryId}
              viewMode={viewMode}
              selectedStudent={selectedStudent}
              classOverallMean={classOverallMean}
            />
          )}
        </div>
      </div>
    </div>
  );
}
