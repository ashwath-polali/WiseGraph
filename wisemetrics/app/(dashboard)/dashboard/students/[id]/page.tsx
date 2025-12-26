// app/(dashboard)/dashboard/students/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentTeacherId } from "@/lib/currentTeacher";
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

  const teacherId = await getCurrentTeacherId();
  if (!teacherId) return null;

  // 1) Find which class this student belongs to.
  const studentRow = await prisma.student.findUnique({
    where: { id },
    select: { classId: true },
  });

  if (!studentRow) {
    return notFound();
  }

  // 2) Load class summary for that class.
  const cls = (await getClassScoreSummary(
    studentRow.classId
  )) as ClassScoreSummary | null;
  if (!cls) {
    return notFound();
  }

  // 3) Find the student summary inside this class.
  const student = cls.students.find((s) => s.id === id) as
    | StudentScoreSummary
    | undefined;
  if (!student) {
    return notFound();
  }

  // 4) Read teacher's defaultStudentView without touching select types
  const teacherRaw = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: {
      id: true,
    },
  });

  const defaultView =
    ((teacherRaw as any)?.defaultStudentView as
      | "polar"
      | "bell"
      | "concentric"
      | null) ?? "polar";

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

      {/* Right: snapshot + categories + edit panel */}
      <div className="space-y-4">
        <Card className="p-4 space-y-2">
          <h2 className="text-sm font-medium text-slate-100">Snapshot</h2>
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

        <Card className="p-4 space-y-3">
          <h2 className="text-sm font-medium text-slate-100">
            Categories
          </h2>
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

        <Card className="p-4 space-y-3">
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
    </main>
  );
}
