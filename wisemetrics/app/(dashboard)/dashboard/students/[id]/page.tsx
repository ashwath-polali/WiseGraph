// app/(dashboard)/dashboard/students/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getClassScoreSummary } from "@/lib/classSummary";
import type {
  ClassScoreSummary,
  StudentScoreSummary,
} from "@/types/scores";
import { Card } from "@/components/ui/Card";
import { StudentHeroChartsClient } from "@/components/StudentHeroChartsClient";
import { CategoryDrillDownClient } from "@/components/CategoryDrillDownClient";
import { EditScoresClient } from "@/components/EditScoresClient";

type RouteParams = {
  id: string;
};

type Props = {
  params: Promise<RouteParams>;
};

export default async function StudentDetailPage(props: Props) {
  const { id } = await props.params;

  // 1) Find which class this student belongs to.
  const studentRow = await prisma.student.findUnique({
    where: { id },
    select: { classId: true },
  });

  if (!studentRow) {
    return notFound();
  }

  // 2) Load class summary for that class.
  const cls = await getClassScoreSummary(studentRow.classId);
  if (!cls) {
    return notFound();
  }

  // 3) Find the student summary inside this class.
  const student = cls.students.find((s) => s.id === id);
  if (!student) {
    return notFound();
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] py-6">
      <div className="mx-auto grid max-w-[1400px] grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6">
        {/* Left: charts + drill-down */}
        <div className="space-y-6">
          <Card className="space-y-4 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-slate-400">
                  {cls.name} · Grade {cls.gradeLevel} · {cls.subject}
                </p>
                <h1 className="mt-1 text-xl font-semibold text-slate-50">
                  {student.name}
                </h1>
                <p className="mt-1 text-xs text-slate-400">
                  Overall standard score:{" "}
                  <span className="font-semibold text-slate-100">
                    {student.overallScore}
                  </span>
                </p>
              </div>
              <Link href="/dashboard" className="text-xs text-sky-400">
                Back to dashboard
              </Link>
            </div>

            <StudentHeroChartsClient student={student} cls={cls} />
          </Card>

          <Card className="space-y-4 p-6">
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

        {/* Right: snapshot + categories + edit panel */}
        <div className="space-y-4">
          <Card className="space-y-2 p-4">
            <h2 className="text-sm font-medium text-slate-100">
              Snapshot
            </h2>
            <p className="text-xs text-slate-400">
              Quick view of {student.name}&apos;s overall performance relative
              to class expectations.
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

          <Card className="space-y-3 p-4">
            <div className="mb-1 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-medium text-slate-100">
                  Categories
                </h2>
                <p className="text-[11px] text-slate-500">
                  Category scores for this student.
                </p>
              </div>
              <Link
                href={`/dashboard/configure-assessment?classId=${cls.id}`}
              >
                <button className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-sky-400 hover:bg-slate-800">
                  Configure
                </button>
              </Link>
            </div>

            <ul className="space-y-1 text-xs text-slate-300">
              {student.categories.map((cat) => (
                <li
                  key={cat.id}
                  className="flex items-center justify-between rounded-md bg-slate-900/60 px-2 py-1"
                >
                  <span>{cat.name}</span>
                  <span className="font-mono text-[11px]">
                    {cat.score}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="space-y-3 p-4">
            <h2 className="text-sm font-medium text-slate-100">
              Edit scores
            </h2>
            <p className="text-xs text-slate-400">
              Update overall, category, and subskill scores. Charts will refresh
              automatically after saving.
            </p>
            <EditScoresClient student={student} />
          </Card>
        </div>
      </div>
    </main>
  );
}
