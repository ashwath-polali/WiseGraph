import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentTeacherId } from "@/lib/currentTeacher";
import { getClassScoreSummary } from "@/lib/classSummary";
import type {
  ClassScoreSummary,
  StudentScoreSummary,
  CategoryScore,
  SubcategoryScore,
} from "@/types/scores";
import { Card } from "@/components/ui/Card";
import { StudentHeroChartsClient } from "@/components/StudentHeroChartsClient";
import { CategoryDrillDownClient } from "@/components/CategoryDrillDownClient";

type RouteParams = {
  id: string;
};

type Props = {
  params: Promise<RouteParams>;
};

export default async function StudentDetailPage(props: Props) {
  const { id } = await props.params;

  const teacherId = await getCurrentTeacherId();
  if (!teacherId) return null;

  // finding which class this student belongs to.
  const studentRow = await prisma.student.findUnique({
    where: { id },
    select: { classId: true },
  });

  if (!studentRow) {
    return notFound();
  }

  const cls = (await getClassScoreSummary(
    studentRow.classId
  )) as ClassScoreSummary | null;
  if (!cls) {
    return notFound();
  }

  const student = cls.students.find((s) => s.id === id) as
    | StudentScoreSummary
    | undefined;
  if (!student) {
    return notFound();
  }

  const teacherRaw = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: {
      id: true,
      defaultStudentView: true,
    },
  });

  const defaultView =
    ((teacherRaw as any)?.defaultStudentView as
      | "polar"
      | "bell"
      | "concentric"
      | null) ?? "polar";

  const editHref = `/dashboard/students/${encodeURIComponent(
    id
  )}/edit-scores`;

  // Build a richer category + subskill comparison view
  const classCategoriesById = new Map<string, CategoryScore>();
  cls.categories.forEach((cat) => {
    classCategoriesById.set(cat.id, cat);
  });

  type CategoryWithSubskills = {
    id: string;
    name: string;
    classScore: number;
    studentScore: number;
    delta: number;
    subskills: {
      id: string;
      name: string;
      classScore: number;
      studentScore: number;
      delta: number;
    }[];
  };

  const categoryComparisons: CategoryWithSubskills[] = student.categories.map(
    (studentCat) => {
      const classCat = classCategoriesById.get(studentCat.id);
      const classScore = classCat?.score ?? studentCat.score;

      const subskills: CategoryWithSubskills["subskills"] = [];

      const studentSubs: SubcategoryScore[] =
        (studentCat.subcategories as SubcategoryScore[] | undefined) ?? [];
      const classSubs: SubcategoryScore[] =
        (classCat?.subcategories as SubcategoryScore[] | undefined) ?? [];

      const classSubsById = new Map<string, SubcategoryScore>();
      classSubs.forEach((sub) => classSubsById.set(sub.id, sub));

      studentSubs.forEach((sSub) => {
        const cSub = classSubsById.get(sSub.id);
        const cScore = cSub?.score ?? sSub.score;
        subskills.push({
          id: sSub.id,
          name: sSub.name,
          classScore: cScore,
          studentScore: sSub.score,
          delta: sSub.score - cScore,
        });
      });

      return {
        id: studentCat.id,
        name: studentCat.name,
        classScore,
        studentScore: studentCat.score,
        delta: studentCat.score - classScore,
        subskills,
      };
    }
  );

  return (
    <main className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6">
      {/* Left: charts + drill-down */}
      <div className="space-y-6">
        <Card className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-slate-400">
                {cls.name} · Grade {cls.gradeLevel} · {cls.subject}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <h1 className="text-xl font-semibold text-slate-50">
                  {student.name}
                </h1>
                <Link
                  href={editHref}
                  className="rounded-md bg-slate-800 px-2 py-1 text-xs font-medium text-slate-100 hover:bg-slate-700"
                >
                  Edit scores
                </Link>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Overall standard score:{" "}
                <span className="font-semibold text-slate-100">
                  {student.overallScore}
                </span>
              </p>
            </div>
            {/* Preserve the student's class when going back */}
            <Link
              href={`/dashboard?classId=${encodeURIComponent(cls.id)}`}
              className="text-xs text-sky-400"
            >
              Back to dashboard
            </Link>
          </div>

          <StudentHeroChartsClient
            student={student}
            cls={cls}
            defaultView={defaultView}
          />
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="text-sm font-medium text-slate-100">
            Category drill-down
          </h2>
          <p className="text-xs text-slate-400">
            Explore subskills for each category to see decoding, fluency, and
            comprehension patterns.
          </p>
          <CategoryDrillDownClient student={student} />
        </Card>
      </div>

      {/* Right: snapshot + detailed category panel */}
      <div className="space-y-4">
        <Card className="p-4 space-y-2">
          <h2 className="text-sm font-medium text-slate-100">Snapshot</h2>
          <p className="text-xs text-slate-400">
            Quick view of {student.name}&apos;s overall performance relative to
            class expectations.
          </p>
          <div className="mt-2 space-y-1 text-xs text-slate-300">
            <div className="flex justify-between">
              <span>Overall score</span>
              <span className="font-semibold">
                {student.overallScore}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Categories tracked</span>
              <span>{student.categories.length}</span>
            </div>
          </div>
        </Card>

        {/* Detailed category + subskill comparison */}
        <Card className="p-4 space-y-3">
          <h2 className="text-sm font-medium text-slate-100">
            Categories & subskills
          </h2>
          <p className="text-xs text-slate-400">
            Compare this student&apos;s scores to class averages for each
            category and subskill.
          </p>

          <div className="space-y-2 text-xs text-slate-300">
            {categoryComparisons.map((cat) => {
              const catSign = cat.delta > 0 ? "+" : cat.delta < 0 ? "−" : "±";
              const catDeltaAbs = Math.abs(cat.delta);

              return (
                <details
                  key={cat.id}
                  className="rounded-md bg-slate-900/70 px-2 py-1.5"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-2 list-none">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-semibold text-slate-100">
                        {cat.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Student {cat.studentScore} · Class {cat.classScore}
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-mono ${
                        cat.delta > 0
                          ? "bg-emerald-900/60 text-emerald-300"
                          : cat.delta < 0
                          ? "bg-rose-900/60 text-rose-300"
                          : "bg-slate-800 text-slate-200"
                      }`}
                    >
                      {catSign}
                      {catDeltaAbs}
                    </span>
                  </summary>

                  {cat.subskills.length > 0 && (
                    <div className="mt-2 space-y-1 border-t border-slate-800 pt-1.5">
                      {cat.subskills.map((sub) => {
                        const sign =
                          sub.delta > 0 ? "+" : sub.delta < 0 ? "−" : "±";
                        const deltaAbs = Math.abs(sub.delta);
                        return (
                          <div
                            key={sub.id}
                            className="flex items-center justify-between rounded-md bg-slate-950/60 px-2 py-1"
                          >
                            <div className="flex flex-col">
                              <span className="text-[11px] text-slate-100">
                                {sub.name}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                Student {sub.studentScore} · Class{" "}
                                {sub.classScore}
                              </span>
                            </div>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-mono ${
                                sub.delta > 0
                                  ? "bg-emerald-900/60 text-emerald-300"
                                  : sub.delta < 0
                                  ? "bg-rose-900/60 text-rose-300"
                                  : "bg-slate-800 text-slate-200"
                              }`}
                            >
                              {sign}
                              {deltaAbs}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </details>
              );
            })}

            {categoryComparisons.length === 0 && (
              <p className="text-[11px] text-slate-500">
                No category scores available yet for this student.
              </p>
            )}
          </div>
        </Card>
      </div>
    </main>
  );
}
