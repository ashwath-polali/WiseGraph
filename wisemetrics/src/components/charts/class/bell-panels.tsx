"use client";

import type { StudentScoreSummary } from "@/types/scores";
import { clampScore } from "@/lib/chartScaling";
import type { CategoryView } from "./geometry";
import type { ViewMode } from "./controls";
import type { BellActiveDot } from "./BellCanvas";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
      {children}
    </div>
  );
}

function Chip({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "student" | "category" | "subskill" | "class";
  children: React.ReactNode;
}) {
  const tones = {
    neutral: "border border-border bg-card text-foreground",
    class: "bg-chart-1/12 text-chart-1",
    student: "bg-chart-4/12 text-chart-4",
    category: "bg-chart-2/12 text-chart-2",
    subskill: "bg-chart-6/12 text-chart-6",
  };
  return (
    <span
      className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] font-medium ${tones[tone]}`}
      data-numeric
    >
      {children}
    </span>
  );
}

function formatDelta(d: number | null): string {
  if (d == null || Number.isNaN(d)) return "-";
  const rounded = Math.round(d);
  if (rounded === 0) return "0";
  return rounded > 0 ? `+${rounded}` : `${rounded}`;
}

function deltaClass(delta: number | null): string {
  if (delta == null || Number.isNaN(delta)) return "text-muted-foreground";
  if (delta >= 8) return "text-chart-2";
  if (delta >= 3) return "text-chart-2/70";
  if (delta <= -8) return "text-destructive";
  if (delta <= -3) return "text-destructive/70";
  return "text-muted-foreground";
}

type AveragePanelProps = {
  categories: CategoryView[];
  hoveredCategoryId: string | null;
  viewMode: ViewMode;
  selectedStudent: StudentScoreSummary | null;
  classOverallMean: number;
};

export function AverageDetailPanel({
  categories,
  hoveredCategoryId,
  viewMode,
  selectedStudent,
  classOverallMean,
}: AveragePanelProps) {
  const category =
    hoveredCategoryId != null
      ? (categories.find((c) => c.id === hoveredCategoryId) ?? null)
      : null;

  const studentCat =
    viewMode === "compare" && selectedStudent && category
      ? (selectedStudent.categories.find((c) => c.id === category.id) ?? null)
      : null;
  const studentCategoryScore =
    studentCat != null ? clampScore(studentCat.score) : null;
  const deltaCategory =
    category && studentCategoryScore != null
      ? studentCategoryScore - category.avgScore
      : null;

  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-muted/30 p-3.5">
      <div className="mb-2.5 flex items-start justify-between gap-2 border-b border-border/70 pb-2.5">
        <div className="space-y-1">
          <h3 className="text-[13px] font-semibold text-foreground">
            Class bell curve
          </h3>
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            Overall mean <Chip>{classOverallMean.toFixed(0)}</Chip>
          </p>
        </div>
        {viewMode === "compare" && selectedStudent && (
          <div className="shrink-0 rounded-md border border-border bg-card px-2 py-1 text-right text-[10px]">
            <div className="text-muted-foreground">Comparing</div>
            <div className="font-medium text-foreground">
              {selectedStudent.name}
            </div>
            <div className="font-mono text-chart-4" data-numeric>
              Overall {Math.round(selectedStudent.overallScore)}{" "}
              <span className="text-muted-foreground">
                ({formatDelta(selectedStudent.overallScore - classOverallMean)})
              </span>
            </div>
          </div>
        )}
      </div>

      {!category ? (
        <p className="mt-4 px-2 text-center text-[11px] text-muted-foreground">
          Hover a marker on the curve to see that category&apos;s average and
          subskills.
        </p>
      ) : (
        <div className="flex-1 space-y-2.5 overflow-y-auto pr-0.5 text-[11px]">
          <div>
            <SectionLabel>Category</SectionLabel>
            <div className="mt-0.5 font-medium text-foreground">
              {category.name}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-2 py-1.5">
            <span className="text-[10px] text-muted-foreground">
              Class average
            </span>
            <div className="flex items-center gap-1.5">
              <Chip tone="class">{Math.round(category.avgScore)}</Chip>
              {viewMode === "compare" && studentCategoryScore != null && (
                <>
                  <span className="text-[9px] text-muted-foreground">
                    vs student
                  </span>
                  <Chip tone="student">{Math.round(studentCategoryScore)}</Chip>
                  <span
                    className={`font-mono text-[10px] ${deltaClass(deltaCategory)}`}
                    data-numeric
                  >
                    {formatDelta(deltaCategory)}
                  </span>
                </>
              )}
            </div>
          </div>

          {category.classSubs.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <SectionLabel>Subskill averages</SectionLabel>
                {viewMode === "compare" && selectedStudent && (
                  <span className="text-[9px] text-muted-foreground">
                    student vs class (Δ)
                  </span>
                )}
              </div>
              <div className="space-y-0.5">
                {category.classSubs.map((sub) => {
                  const studentSub =
                    viewMode === "compare" && studentCat
                      ? (studentCat.subcategories?.find(
                          (x) => x.id === sub.id,
                        ) ?? null)
                      : null;
                  const delta =
                    studentSub != null
                      ? clampScore(studentSub.score) - clampScore(sub.score)
                      : null;
                  return (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between gap-2 rounded-md px-2 py-1"
                    >
                      <span className="truncate text-[10.5px] text-foreground">
                        {sub.name}
                      </span>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Chip tone="subskill">
                          {Math.round(clampScore(sub.score))}
                        </Chip>
                        {studentSub != null && (
                          <>
                            <span className="text-[9px] text-muted-foreground">
                              /
                            </span>
                            <Chip tone="student">
                              {Math.round(clampScore(studentSub.score))}
                            </Chip>
                            <span
                              className={`font-mono text-[10px] ${deltaClass(delta)}`}
                              data-numeric
                            >
                              {formatDelta(delta)}
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

          <p className="pt-1 text-[10px] leading-relaxed text-muted-foreground">
            Category and subskill scores sit on the same 60-150 standard
            scale, so one student can be compared with the class at every
            level.
          </p>
        </div>
      )}
    </div>
  );
}

type DotsPanelProps = {
  students: StudentScoreSummary[];
  categories: CategoryView[];
  activeDot: BellActiveDot | null;
};

export function BellDotsDetailPanel({
  students,
  categories,
  activeDot,
}: DotsPanelProps) {
  if (!activeDot) {
    return (
      <div className="flex h-full flex-col rounded-lg border border-border bg-muted/30 p-3.5">
        <div className="mb-2 border-b border-dashed border-border pb-2.5">
          <h3 className="text-[13px] font-semibold text-foreground">
            Dots view
          </h3>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Terracotta dots are overall scores, green dots are categories,
            violet dots are subskills. Click any dot to see who it belongs to.
          </p>
        </div>
        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          Nothing selected yet.
        </p>
      </div>
    );
  }

  const student = students.find((s) => s.id === activeDot.studentId);
  if (!student) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-border bg-muted/30 px-4 text-center text-[11px] text-muted-foreground">
        This dot points at data that no longer exists.
      </div>
    );
  }

  if (activeDot.kind === "overall") {
    return (
      <div className="flex h-full flex-col rounded-lg border border-border bg-muted/30 p-3.5">
        <div className="mb-2.5 border-b border-border/70 pb-2.5">
          <h3 className="text-[13px] font-semibold text-chart-4">
            Overall dot
          </h3>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            Each terracotta dot is one student&apos;s overall standard score on
            the class curve.
          </p>
        </div>

        <div className="space-y-3 text-[11px]">
          <div>
            <SectionLabel>Student</SectionLabel>
            <div className="mt-0.5 font-medium text-foreground">
              {student.name}
            </div>
            <div className="text-[10px] text-muted-foreground">
              Grade {student.gradeLevel}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-2 py-1.5">
            <span className="text-[10px] text-muted-foreground">
              Overall standard score
            </span>
            <Chip tone="student">{Math.round(student.overallScore)}</Chip>
          </div>

          <p className="text-[10px] leading-relaxed text-muted-foreground">
            The horizontal position shows where this student&apos;s overall
            performance falls within the class distribution.
          </p>
        </div>
      </div>
    );
  }

  const categoryId = activeDot.categoryId;
  const studentCategory =
    categoryId != null
      ? (student.categories.find((c) => c.id === categoryId) ?? null)
      : null;
  const categoryMeta =
    categoryId != null
      ? (categories.find((c) => c.id === categoryId) ?? null)
      : null;

  if (activeDot.kind === "category") {
    return (
      <div className="flex h-full flex-col rounded-lg border border-border bg-muted/30 p-3.5">
        <div className="mb-2.5 border-b border-border/70 pb-2.5">
          <h3 className="text-[13px] font-semibold text-chart-2">
            Category dot
          </h3>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            Each green dot is one student&apos;s score in a category, on the
            same curve.
          </p>
        </div>

        <div className="space-y-3 text-[11px]">
          <div>
            <SectionLabel>Student</SectionLabel>
            <div className="mt-0.5 font-medium text-foreground">
              {student.name}
            </div>
          </div>

          {categoryMeta && (
            <div>
              <SectionLabel>Category</SectionLabel>
              <div className="mt-0.5 font-medium text-foreground">
                {categoryMeta.name}
              </div>
            </div>
          )}

          {studentCategory && (
            <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-2 py-1.5">
              <span className="text-[10px] text-muted-foreground">
                Score in this category
              </span>
              <Chip tone="category">{Math.round(studentCategory.score)}</Chip>
            </div>
          )}

          <p className="text-[10px] leading-relaxed text-muted-foreground">
            This dot shows where the category score sits within the class bell
            curve, on the 60-150 standard scale.
          </p>
        </div>
      </div>
    );
  }

  const subId = activeDot.subcategoryId;
  const catForSub =
    categoryId != null
      ? (categories.find((c) => c.id === categoryId) ?? null)
      : null;
  const studentSub =
    subId != null && studentCategory
      ? (studentCategory.subcategories?.find((s) => s.id === subId) ?? null)
      : null;
  const subMeta =
    subId != null && catForSub
      ? (catForSub.classSubs.find((s) => s.id === subId) ?? null)
      : null;

  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-muted/30 p-3.5">
      <div className="mb-2.5 border-b border-border/70 pb-2.5">
        <h3 className="text-[13px] font-semibold text-chart-6">Subskill dot</h3>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          Each violet dot is one student&apos;s score in a subskill, on the
          same curve.
        </p>
      </div>

      <div className="space-y-3 text-[11px]">
        <div>
          <SectionLabel>Student</SectionLabel>
          <div className="mt-0.5 font-medium text-foreground">
            {student.name}
          </div>
        </div>

        {catForSub && (
          <div>
            <SectionLabel>Category</SectionLabel>
            <div className="mt-0.5 font-medium text-foreground">
              {catForSub.name}
            </div>
          </div>
        )}

        {subMeta && (
          <div>
            <SectionLabel>Subskill</SectionLabel>
            <div className="mt-0.5 font-medium text-foreground">
              {subMeta.name}
            </div>
          </div>
        )}

        {studentSub && (
          <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-2 py-1.5">
            <span className="text-[10px] text-muted-foreground">
              Score in this subskill
            </span>
            <Chip tone="subskill">{Math.round(studentSub.score)}</Chip>
          </div>
        )}

        <p className="text-[10px] leading-relaxed text-muted-foreground">
          This dot shows how the subskill score fits inside the same 60-150
          distribution as the rest of the class.
        </p>
      </div>
    </div>
  );
}
