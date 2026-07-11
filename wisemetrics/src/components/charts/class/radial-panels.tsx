"use client";

import type { StudentScoreSummary, SubcategoryScore } from "@/types/scores";
import type { CategoryView } from "./geometry";
import type { ViewMode } from "./controls";
import type { RadialActiveDot } from "./RadialCanvas";

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
  tone?: "neutral" | "student" | "category" | "subskill";
  children: React.ReactNode;
}) {
  const tones = {
    neutral: "border border-border bg-card text-foreground",
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

function deltaClass(delta: number): string {
  if (delta > 0) return "text-chart-2";
  if (delta < 0) return "text-destructive";
  return "text-muted-foreground";
}

type DetailPanelProps = {
  category: CategoryView | null;
  viewMode: ViewMode;
  selectedStudent: StudentScoreSummary | null;
  activeSubskillId: string | null;
};

export function DetailPanel({
  category,
  viewMode,
  selectedStudent,
  activeSubskillId,
}: DetailPanelProps) {
  if (!category) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-4 text-center text-xs text-muted-foreground">
        Hover a wedge to see its subskills. Click one to zoom in.
      </div>
    );
  }

  const classSubs: SubcategoryScore[] = category.classSubs;

  const studentCat =
    viewMode === "compare" && selectedStudent
      ? (selectedStudent.categories.find((c) => c.id === category.id) ?? null)
      : null;
  const studentSubs: SubcategoryScore[] =
    viewMode === "compare" ? (studentCat?.subcategories ?? []) : [];

  const combinedSubIds = Array.from(
    new Set([...classSubs.map((s) => s.id), ...studentSubs.map((s) => s.id)]),
  );

  const categoryDelta =
    viewMode === "compare" && studentCat
      ? Math.round(studentCat.score - category.avgScore)
      : null;

  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-muted/30 p-3.5">
      <div className="mb-2.5 flex items-start justify-between gap-2 border-b border-border/70 pb-2.5">
        <div className="min-w-0 space-y-1">
          <h3 className="truncate text-[13px] font-semibold text-foreground">
            {category.name}
          </h3>
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
            <span>Class average</span>
            <Chip>{category.avgScore.toFixed(0)}</Chip>
            {viewMode === "compare" && studentCat && (
              <>
                <span>· Student</span>
                <Chip tone="student">{Math.round(studentCat.score)}</Chip>
                {categoryDelta !== null && (
                  <span className={`text-[10px] ${deltaClass(categoryDelta)}`}>
                    ({categoryDelta > 0 ? "+" : ""}
                    {categoryDelta} vs class)
                  </span>
                )}
              </>
            )}
          </div>
        </div>
        {viewMode === "compare" && selectedStudent && (
          <div className="shrink-0 rounded-md border border-border bg-card px-2 py-1 text-right text-[10px]">
            <div className="text-muted-foreground">Comparing</div>
            <div className="font-medium text-foreground">
              {selectedStudent.name}
            </div>
            <div className="font-mono text-chart-4" data-numeric>
              Overall {Math.round(selectedStudent.overallScore)}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 space-y-0.5 overflow-y-auto pr-0.5 text-[11px]">
        {combinedSubIds.length === 0 ? (
          <p className="mt-4 text-center text-muted-foreground">
            No subskills set up for this category yet.
          </p>
        ) : (
          combinedSubIds.map((id) => {
            const classSub = classSubs.find((s) => s.id === id) ?? null;
            const studentSub = studentSubs.find((s) => s.id === id) ?? null;
            const name = classSub?.name ?? studentSub?.name ?? "Subskill";
            const isActive = activeSubskillId === id;

            const delta =
              viewMode === "compare" && classSub && studentSub
                ? Math.round(studentSub.score - classSub.score)
                : null;

            return (
              <div
                key={id}
                className={
                  "flex items-center justify-between gap-2 rounded-md px-2 py-1.5 transition-colors duration-150 " +
                  (isActive ? "bg-accent/70 ring-1 ring-ring/50" : "")
                }
              >
                <div className="min-w-0">
                  <div className="truncate text-[11px] text-foreground">
                    {name}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {viewMode === "compare"
                      ? isActive
                        ? "Selected · class vs student"
                        : "Class vs student"
                      : "Class average"}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {classSub && <Chip>{Math.round(classSub.score)}</Chip>}
                  {viewMode === "compare" && studentSub && (
                    <Chip tone="student">{Math.round(studentSub.score)}</Chip>
                  )}
                  {delta !== null && (
                    <span
                      className={`font-mono text-[10px] ${deltaClass(delta)}`}
                      data-numeric
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
  students: StudentScoreSummary[];
  categories: CategoryView[];
  activeDot: RadialActiveDot | null;
};

export function DotsDetailPanel({
  students,
  categories,
  activeDot,
}: DotsDetailPanelProps) {
  if (!activeDot) {
    return (
      <div className="flex h-full flex-col rounded-lg border border-border bg-muted/30 p-3.5">
        <div className="mb-2 border-b border-dashed border-border pb-2.5">
          <h3 className="text-[13px] font-semibold text-foreground">
            Dots view
          </h3>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Every dot is one student. Green dots are category scores, violet
            dots are subskills. Click any dot to see who it belongs to.
          </p>
        </div>
        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          Nothing selected yet.
        </p>
      </div>
    );
  }

  const student = students.find((s) => s.id === activeDot.studentId);
  const categoryMeta = categories.find((c) => c.id === activeDot.categoryId);
  const category =
    student?.categories.find((c) => c.id === activeDot.categoryId) ?? null;

  if (!student || !categoryMeta || !category) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-border bg-muted/30 px-4 text-center text-[11px] text-muted-foreground">
        This dot points at data that no longer exists.
      </div>
    );
  }

  if (activeDot.kind === "category") {
    return (
      <div className="flex h-full flex-col rounded-lg border border-border bg-muted/30 p-3.5">
        <div className="mb-2.5 border-b border-border/70 pb-2.5">
          <h3 className="text-[13px] font-semibold text-chart-2">
            Category dot
          </h3>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            Each green dot is one student&apos;s score in a category.
          </p>
        </div>

        <div className="space-y-3 text-[11px]">
          <div>
            <SectionLabel>Student</SectionLabel>
            <div className="mt-0.5 font-medium text-foreground">
              {student.name}
            </div>
            <div className="text-[10px] text-muted-foreground">
              Grade {student.gradeLevel} · Overall{" "}
              <span className="font-mono text-foreground" data-numeric>
                {Math.round(student.overallScore)}
              </span>
            </div>
          </div>

          <div>
            <SectionLabel>Category</SectionLabel>
            <div className="mt-0.5 font-medium text-foreground">
              {categoryMeta.name}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
              Score in this category
              <Chip tone="category">{Math.round(category.score)}</Chip>
            </div>
          </div>

          <div className="rounded-md bg-muted/60 p-2 text-[10px] leading-relaxed text-muted-foreground">
            Distance from the center is the score: this dot sits at{" "}
            {student.name.split(" ")[0]}&apos;s scaled score on the 60-150
            standard scale.
          </div>
        </div>
      </div>
    );
  }

  const subskill =
    activeDot.subskillId != null
      ? (category.subcategories?.find((s) => s.id === activeDot.subskillId) ??
        null)
      : null;

  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-muted/30 p-3.5">
      <div className="mb-2.5 border-b border-border/70 pb-2.5">
        <h3 className="text-[13px] font-semibold text-chart-6">Subskill dot</h3>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          Each violet dot is one student&apos;s score on a single subskill.
        </p>
      </div>

      <div className="space-y-3 text-[11px]">
        <div>
          <SectionLabel>Student</SectionLabel>
          <div className="mt-0.5 font-medium text-foreground">
            {student.name}
          </div>
          <div className="text-[10px] text-muted-foreground">
            Grade {student.gradeLevel} · Overall{" "}
            <span className="font-mono text-foreground" data-numeric>
              {Math.round(student.overallScore)}
            </span>
          </div>
        </div>

        <div>
          <SectionLabel>Category</SectionLabel>
          <div className="mt-0.5 font-medium text-foreground">
            {categoryMeta.name}
          </div>
        </div>

        {subskill ? (
          <div>
            <SectionLabel>Subskill</SectionLabel>
            <div className="mt-0.5 font-medium text-foreground">
              {subskill.name}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
              Score
              <Chip tone="subskill">{Math.round(subskill.score)}</Chip>
            </div>
          </div>
        ) : (
          <div className="text-[10px] text-muted-foreground">
            This subskill doesn&apos;t have a label yet.
          </div>
        )}

        <div className="rounded-md bg-muted/60 p-2 text-[10px] leading-relaxed text-muted-foreground">
          The dot sits at the radial distance for this subskill&apos;s score,
          inside its category wedge, on the same 60-150 scale.
        </div>
      </div>
    </div>
  );
}
