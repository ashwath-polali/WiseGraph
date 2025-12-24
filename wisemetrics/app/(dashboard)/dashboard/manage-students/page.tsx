// app/(dashboard)/dashboard/manage-students/page.tsx
import Link from "next/link";
import { getClassScoreSummary } from "@/lib/classSummary";
import { Card } from "@/components/ui/Card";
import { ManageStudentsClient } from "@/components/ManageStudentsClient";

export default async function ManageStudentsPage() {
  const summary = await getClassScoreSummary();
  if (!summary) {
    return (
      <main className="p-6 space-y-4">
        <h1 className="text-xl font-semibold text-slate-50">
          No classes found yet
        </h1>
        <p className="text-sm text-slate-400">
          Add a class before managing students.
        </p>
      </main>
    );
  }

  const { id: classId, name, students } = summary;

  return (
    <main className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-50">
            Manage students
          </h1>
          <p className="text-sm text-slate-400">
            {name} · {students.length} student
            {students.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-xs text-sky-400 hover:underline"
        >
          ← Back to dashboard
        </Link>
      </header>

      <Card className="p-4 bg-slate-900/80 border border-slate-800">
        <ManageStudentsClient classId={classId} initialStudents={students} />
      </Card>
    </main>
  );
}
