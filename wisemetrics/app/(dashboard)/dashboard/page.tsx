// app/(dashboard)/dashboard/page.tsx
import Link from "next/link";
import { getClassScoreSummary } from "@/lib/classSummary";
import { ClassConcentricGraph } from "@/components/charts/ClassConcentricGraph";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default async function DashboardPage() {
  const summary = await getClassScoreSummary();
  if (!summary) {
    return (
      <main className="p-6 space-y-4">
        <h1 className="text-xl font-semibold text-slate-50">
          No classes found yet
        </h1>
        <p className="text-sm text-slate-400">
          Add a class and students to see your dashboard.
        </p>
      </main>
    );
  }

  const { id: classId, name, gradeLevel, subject, students } = summary;

  return (
    <main className="p-6 grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6">
      {/* Left: class overview */}
      <section className="space-y-4">
        <header className="flex items-baseline justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-50">{name}</h1>
            <p className="text-sm text-slate-400">
              Grade {gradeLevel} · {subject}
            </p>
          </div>

          {/* Placeholder class selector for now */}
          <select
            className="rounded-md bg-slate-900 border border-slate-700 px-2 py-1 text-sm text-slate-50"
            defaultValue={classId}
            disabled
          >
            <option value={classId}>{name}</option>
          </select>
        </header>

        <Card className="p-4 bg-slate-900/80 border border-slate-800">
          <h2 className="mb-3 text-sm font-medium text-slate-200">
            Class performance overview
          </h2>
          <div className="h-80">
            <ClassConcentricGraph cls={summary} />
          </div>
        </Card>

        <div className="flex gap-3">
          <Link
            href="/dashboard/manage-students"
            className="inline-flex items-center rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-50 hover:border-sky-500 hover:bg-slate-800 transition"
          >
            Manage students
          </Link>
          <Link
            href="/dashboard/configure-assessment"
            className="inline-flex items-center rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-50 hover:border-sky-500 hover:bg-slate-800 transition"
          >
            Configure assessment
          </Link>
        </div>
      </section>

      {/* Right: student list / search */}
      <aside className="space-y-3">
        <h2 className="text-sm font-medium text-slate-200">
          Students ({students.length})
        </h2>
        <div className="space-y-2">
          {students.map((s) => (
            <Link
              key={s.id}
              href={`/dashboard/students/${s.id}`}
              className="block rounded-md border border-slate-800 bg-slate-900/70 px-3 py-2 hover:border-sky-500 hover:bg-slate-900 transition"
            >
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-slate-50">{s.name}</span>
                <span className="text-xs text-slate-400">
                  {s.gradeLevel}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Overall score: {s.overallScore}
              </p>
            </Link>
          ))}
        </div>
      </aside>
    </main>
  );
}
