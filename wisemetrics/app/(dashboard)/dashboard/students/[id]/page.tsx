// app/(dashboard)/dashboard/students/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { getClassScoreSummary } from "@/lib/classSummary";
import type { ClassScoreSummary, StudentScoreSummary } from "@/types/scores";
import { Card } from "@/components/ui/Card";
import { StudentHeroChartsClient } from "@/components/StudentHeroChartsClient";
import { CategoryDrillDownClient } from "@/components/CategoryDrillDownClient";

type RouteParams = {
  id: string;
};

type Props = {
  params: Promise<RouteParams>;
};

export default async function StudentDetailPage({ params }: Props) {
  const { id } = await params;

  const summary = await getClassScoreSummary();
  if (!summary) notFound();

  const student = summary.students.find((s) => s.id === id);
  if (!student) notFound();

  const { name: className, subject } = summary;

  return (
    <main className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400">Student detail</p>
          <h1 className="text-xl font-semibold text-slate-50">
            {student.name}
          </h1>
          <p className="text-sm text-slate-400">
            {className} · {subject}
          </p>
        </div>
        <Link
          href="/dashboard"
          className="text-xs text-sky-400 hover:underline"
        >
          ← Back to class
        </Link>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,0.9fr)]">
        {/* Main charts + drill-down */}
        <section className="space-y-4">
          <Card className="p-4 bg-slate-900/80 border border-slate-800">
            <StudentHeroChartsClient
              student={student as StudentScoreSummary}
              cls={summary as ClassScoreSummary}
            />
          </Card>

          <Card className="p-4 bg-slate-900/80 border border-slate-800">
            <CategoryDrillDownClient student={student as StudentScoreSummary} />
          </Card>
        </section>

        {/* Side summary */}
        <aside className="space-y-3">
          <Card className="p-4 bg-slate-900/80 border border-slate-800">
            <h2 className="text-sm font-medium text-slate-200">
              Snapshot
            </h2>
            <p className="mt-2 text-3xl font-semibold text-slate-50">
              {student.overallScore}
            </p>
            <p className="text-xs text-slate-400">
              Overall standard score
            </p>
          </Card>

          <Card className="p-4 bg-slate-900/80 border border-slate-800">
            <h2 className="text-sm font-medium text-slate-200">
              Categories
            </h2>
            <ul className="mt-2 space-y-1 text-xs text-slate-300">
              {student.categories.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between"
                >
                  <span>{c.name}</span>
                  <span className="text-slate-400">{c.score}</span>
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </main>
  );
}
