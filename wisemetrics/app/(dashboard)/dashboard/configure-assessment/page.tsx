// app/(dashboard)/dashboard/configure-assessment/page.tsx
import Link from "next/link";
import { getClassScoreSummary } from "@/lib/classSummary";
import { Card } from "@/components/ui/Card";
import { ConfigureAssessmentClient } from "@/components/ConfigureAssessmentClient";

export default async function ConfigureAssessmentPage() {
  const summary = await getClassScoreSummary();
  if (!summary) {
    return (
      <main className="p-6 space-y-4">
        <h1 className="text-xl font-semibold text-slate-50">
          No classes found yet
        </h1>
        <p className="text-sm text-slate-400">
          Add a class before configuring assessments.
        </p>
      </main>
    );
  }

  const { id: classId, name, subject, categories } = summary;

  return (
    <main className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-50">
            Configure assessment
          </h1>
          <p className="text-sm text-slate-400">
            {name} · {subject}
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
        <ConfigureAssessmentClient
          classId={classId}
          initialCategories={categories}
        />
      </Card>
    </main>
  );
}
