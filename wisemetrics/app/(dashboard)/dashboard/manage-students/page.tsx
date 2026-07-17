import Link from "next/link";
import {
  getClassScoreSummary,
  getTeacherClassesWithSummary,
  getDefaultClassIdForTeacher,
} from "@/lib/classSummary";
import { Card } from "@/components/ui/Card";
import { ManageStudentsClient } from "@/components/ManageStudentsClient";

type TeacherClass = {
  id: string;
  name: string;
  gradeLevel: string;
  subject: string;
  term: string | null;
};

export default async function ManageStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string }>;
}) {
  const { classId } = await searchParams;

  const classes = (await getTeacherClassesWithSummary()) as TeacherClass[];

  if (!classes.length) {
    return (
      <main className="space-y-6">
        <Card className="p-6">
          <h1 className="text-xl font-semibold text-foreground">Manage students</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You don&apos;t have a class yet. Create one first, then come back to add students.
          </p>
          <Link
            href="/dashboard"
            className="mt-3 inline-block text-xs text-primary transition-colors hover:text-primary/80"
          >
            Back to dashboard
          </Link>
        </Card>
      </main>
    );
  }

  const idFromQuery =
    classId && classes.some((c: TeacherClass) => c.id === classId)
      ? classId
      : null;

  const defaultClassId = await getDefaultClassIdForTeacher();
  const idFromDefault =
    defaultClassId &&
    classes.some((c: TeacherClass) => c.id === defaultClassId)
      ? defaultClassId
      : null;

  const currentClassId = idFromQuery ?? idFromDefault ?? classes[0].id;

  const cls = await getClassScoreSummary(currentClassId);
  if (!cls) {
    return (
      <main className="space-y-6">
        <Card className="p-6">
          <h1 className="text-xl font-semibold text-foreground">Manage students</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We couldn&apos;t load that class. Head back to the dashboard and try again.
          </p>
          <Link
            href="/dashboard"
            className="mt-3 inline-block text-xs text-primary transition-colors hover:text-primary/80"
          >
            Back to dashboard
          </Link>
        </Card>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <Card className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Manage roster · Grade {cls.gradeLevel}
            </p>
            <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-foreground">{cls.name}</h1>
          </div>
          <Link
            href={`/dashboard?classId=${encodeURIComponent(cls.id)}`}
            className="shrink-0 text-xs text-primary transition-colors hover:text-primary/80"
          >
            Back to dashboard
          </Link>
        </div>

        <ManageStudentsClient
          classId={cls.id}
          initialStudents={cls.students}
        />
      </Card>
    </main>
  );
}
