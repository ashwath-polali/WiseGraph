import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentTeacherId } from "@/lib/currentTeacher";
import { getClassScoreSummary } from "@/lib/classSummary";
import type {
  ClassScoreSummary,
  StudentScoreSummary,
} from "@/types/scores";
import { Card } from "@/components/ui/Card";
import { EditScoresClient } from "@/components/EditScoresClient";

type RouteParams = { id: string };
type Props = { params: Promise<RouteParams> };

export default async function EditStudentScoresPage(props: Props) {
  const { id } = await props.params;

  const teacherId = await getCurrentTeacherId();
  if (!teacherId) return null;

  const studentRow = await prisma.student.findUnique({
    where: { id },
    select: { classId: true, name: true, gradeLevel: true },
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

  return (
    <main className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href={`/dashboard/students/${encodeURIComponent(id)}`}
            className="text-xs text-primary transition-colors hover:text-primary/80"
          >
            ← Back to student view
          </Link>
          <h1 className="mt-2 text-xl font-semibold text-foreground">
            Edit scores for {studentRow.name}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {cls.name} · Grade {cls.gradeLevel} · {cls.subject}
          </p>
        </div>
      </div>

      <Card className="p-4">
        <EditScoresClient student={student} />
      </Card>
    </main>
  );
}
