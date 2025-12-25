// app/(dashboard)/dashboard/configure-assessment/page.tsx
import Link from "next/link";
import {
  getClassScoreSummary,
  getTeacherClassesWithSummary,
  getDefaultClassIdForTeacher,
} from "@/lib/classSummary";
import { Card } from "@/components/ui/Card";
import { ConfigureAssessmentClient } from "@/components/ConfigureAssessmentClient";
import { CreateFirstClassButton } from "@/components/CreateFirstClassButton";

export default async function ConfigureAssessmentPage({
  searchParams,
}: {
  searchParams: { classId?: string };
}) {
  const classes = await getTeacherClassesWithSummary();

  if (!classes.length) {
    return (
      <main className="space-y-6">
        <Card className="p-6 space-y-4">
          <h1 className="text-xl font-semibold">Configure assessment</h1>
          <p className="text-sm text-slate-400">
            Before you can configure categories and subskills, create a class.
          </p>
          <CreateFirstClassButton />
          <Link href="/dashboard" className="text-xs text-sky-400">
            Back to dashboard
          </Link>
        </Card>
      </main>
    );
  }

  let currentClassId = searchParams.classId;
  if (!currentClassId) {
    currentClassId =
      (await getDefaultClassIdForTeacher()) ?? classes[0].id;
  }

  const cls = currentClassId
    ? await getClassScoreSummary(currentClassId)
    : null;

  if (!cls) {
    return (
      <main className="space-y-6">
        <Card className="p-6">
          <h1 className="text-xl font-semibold">Configure assessment</h1>
          <p className="mt-2 text-sm text-slate-400">
            Selected class could not be loaded.
          </p>
          <Link href="/dashboard" className="text-xs text-sky-400">
            Back to dashboard
          </Link>
        </Card>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">
              Configure assessment · {cls.name}
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Grade {cls.gradeLevel} · {cls.subject}
            </p>
          </div>
          <Link href="/dashboard" className="text-xs text-sky-400">
            Back to dashboard
          </Link>
        </div>

        <ConfigureAssessmentClient
          classId={cls.id}
          initialCategories={cls.categories}
        />
      </Card>
    </main>
  );
}
