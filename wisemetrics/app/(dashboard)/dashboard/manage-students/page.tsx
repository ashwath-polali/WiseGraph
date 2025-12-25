// app/(dashboard)/dashboard/manage-students/page.tsx
import Link from "next/link";
import {
  getClassScoreSummary,
  getTeacherClassesWithSummary,
} from "@/lib/classSummary";
import { Card } from "@/components/ui/Card";
import { ManageStudentsClient } from "@/components/ManageStudentsClient";

export default async function ManageStudentsPage({
  searchParams,
}: {
  searchParams: { classId?: string };
}) {
  const classes = await getTeacherClassesWithSummary();
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

  const currentClassId = searchParams.classId ?? classes[0].id;
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
          <Link href="/dashboard">
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
