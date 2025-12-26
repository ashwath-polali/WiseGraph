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
          <h1 className="text-xl font-semibold">Manage students</h1>
          <p className="mt-2 text-sm text-slate-400">
            No classes yet. Create a class first.
          </p>
          <Link href="/dashboard">
            <span className="mt-3 inline-block text-xs text-sky-400">
              Back to dashboard
            </span>
          </Link>
        </Card>
      </main>
    );
  }

  const idFromQuery =
    classId &&
    classes.some((c: TeacherClass) => c.id === classId)
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
          <h1 className="text-xl font-semibold">Manage students</h1>
          <p className="mt-2 text-sm text-slate-400">
            Selected class could not be loaded.
          </p>
        </Card>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">
            Students · {cls.name}
          </h1>
          <Link href={`/dashboard?classId=${encodeURIComponent(cls.id)}`}>
            <span className="text-xs text-sky-400 hover:text-sky-300">
              Back to dashboard
            </span>
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
