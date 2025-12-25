// app/(dashboard)/dashboard/page.tsx
import Link from "next/link";
import {
  getClassScoreSummary,
  getTeacherClassesWithSummary,
  getDefaultClassIdForTeacher,
} from "@/lib/classSummary";
import { ClassConcentricGraph } from "@/components/charts/ClassConcentricGraph";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ClassSelectorClient } from "@/components/ClassSelectorClient";
import { CreateFirstClassButton } from "@/components/CreateFirstClassButton";

type DashboardPageProps = {
  searchParams: { classId?: string };
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const classes = await getTeacherClassesWithSummary();

  // No classes yet → show create UI
  if (!classes.length) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Card className="w-full max-w-xl space-y-6 p-8">
          <div>
            <h1 className="text-2xl font-semibold text-slate-50">
              Welcome to WiseMetrics
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Create your first class to start tracking student performance by
              category and subskills.
            </p>
          </div>
          <CreateFirstClassButton />
        </Card>
      </main>
    );
  }

  let currentClassId = searchParams.classId;
  if (!currentClassId) {
    currentClassId = (await getDefaultClassIdForTeacher()) ?? classes[0].id;
  }

  const cls = currentClassId ? await getClassScoreSummary(currentClassId) : null;

  if (!cls) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Card className="w-full max-w-md space-y-3 p-6">
          <h1 className="text-xl font-semibold text-slate-50">Dashboard</h1>
          <p className="text-sm text-slate-400">
            Selected class could not be loaded. Try choosing a different class
            or refreshing the page.
          </p>
          <Link href="/dashboard" className="text-xs text-sky-400">
            Reload dashboard
          </Link>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-4rem)]">
      <section className="flex flex-col gap-6 py-2">
        {/* Top row: class overview + students sidebar */}
        <div className="grid grid-cols-[minmax(0,2.3fr)_minmax(0,1fr)] gap-6">
          {/* Left: big class card */}
          <Card className="space-y-5 p-6">
            <header className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-slate-50">
                  {cls.name}
                </h1>
                <p className="mt-1 text-xs text-slate-400">
                  Grade {cls.gradeLevel} · {cls.subject}
                  {cls.term ? ` · ${cls.term}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/dashboard/configure-assessment">
                  <Button variant="secondary" className="text-xs">
                    Configure assessment
                  </Button>
                </Link>
              </div>
            </header>

            {/* Class selector pills */}
            <div className="mt-1">
              <ClassSelectorClient
                classes={classes.map((c) => ({
                  id: c.id,
                  name: c.name,
                  subject: c.subject,
                  term: c.term,
                }))}
                currentClassId={cls.id}
              />
            </div>

            {/* Big class chart */}
            <div className="mt-4 h-[420px]">
              <ClassConcentricGraph cls={cls} />
            </div>
          </Card>

          {/* Right: students list */}
          <Card className="flex h-full flex-col p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-100">
                  Students
                </h2>
                <p className="text-[11px] text-slate-500">
                  Click a student to open detailed charts and subskills.
                </p>
              </div>
              <Link href="/dashboard/manage-students">
                <Button variant="ghost" className="text-xs">
                  Manage
                </Button>
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/40">
              {cls.students.length === 0 ? (
                <div className="flex h-full items-center justify-center px-3 py-6 text-xs text-slate-500">
                  No students yet. Use “Manage” to add your roster.
                </div>
              ) : (
                <ul className="divide-y divide-slate-800 text-xs">
                  {cls.students.map((student) => (
                    <li key={student.id}>
                      <Link
                        href={`/dashboard/students/${student.id}`}
                        className="flex items-center justify-between px-3 py-2 hover:bg-slate-800/60"
                      >
                        <div>
                          <p className="text-[13px] font-medium text-slate-50">
                            {student.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Grade {student.gradeLevel}
                          </p>
                        </div>
                        <span className="rounded-full border border-slate-600 bg-slate-900 px-2 py-0.5 text-[11px] font-mono text-slate-100">
                          {student.overallScore}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}
