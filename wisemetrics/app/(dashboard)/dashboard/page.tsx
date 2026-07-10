import Link from "next/link";
import {
  getClassScoreSummary,
  getTeacherClassesWithSummary,
  getDefaultClassIdForTeacher,
} from "@/lib/classSummary";
import { prisma } from "@/lib/prisma";
import { getCurrentTeacherId } from "@/lib/currentTeacher";
import type { ClassScoreSummary } from "@/types/scores";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ClassSelectorClient } from "@/components/ClassSelectorClient";
import { CreateFirstClassButton } from "@/components/CreateFirstClassButton";
import { DeleteClassButton } from "@/components/DeleteClassButton";
import { ClassOverviewClient } from "@/components/ClassOverviewClient";

type DashboardPageProps = {
  searchParams: Promise<{ classId?: string }>;
};

type TeacherClass = {
  id: string;
  name: string;
  gradeLevel: string;
  subject: string;
  term: string | null;
};

type TeacherWithDefault = {
  id: string;
  defaultClassId: string | null;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { classId } = await searchParams;

  const teacherId = await getCurrentTeacherId();
  if (!teacherId) return null;

  const classes = (await getTeacherClassesWithSummary()) as TeacherClass[];

  if (!classes.length) {
    return (
      <main className="flex min-h-[calc(100dvh-8rem)] items-center justify-center">
        <Card className="w-full max-w-xl space-y-6 p-8">
          <div>
            <h1 className="font-display text-2xl font-medium text-foreground">
              Welcome to WiseGraph.
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your first class to start tracking performance by category
              and subskill.
            </p>
          </div>
          <CreateFirstClassButton />
        </Card>
      </main>
    );
  }

  const teacherRaw = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { id: true, defaultClassId: true },
  });

  const defaultFromTeacher =
    (teacherRaw as TeacherWithDefault | null)?.defaultClassId ?? null;

  const idFromQuery =
    classId &&
    classes.some((c: TeacherClass) => c.id === classId)
      ? classId
      : null;

  const idFromTeacher =
    defaultFromTeacher &&
    classes.some((c: TeacherClass) => c.id === defaultFromTeacher)
      ? defaultFromTeacher
      : null;

  const fallbackId = classes[0].id;

  const currentClassId = idFromQuery ?? idFromTeacher ?? fallbackId;

  const cls = (await getClassScoreSummary(currentClassId)) as ClassScoreSummary | null;

  if (!cls) {
    return (
      <main className="flex min-h-[calc(100dvh-8rem)] items-center justify-center">
        <Card className="w-full max-w-md space-y-3 p-6">
          <h1 className="font-display text-xl font-medium text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Selected class could not be loaded. Try choosing a different class
            or refreshing the page.
          </p>
          <Link href="/dashboard" className="text-sm font-medium text-primary hover:text-primary/80">
            Reload dashboard
          </Link>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100dvh-8rem)]">
      <section className="flex flex-col gap-6">
        {/* Page header: class title + actions */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-[1.75rem] leading-tight font-medium text-foreground">
                {cls.name}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Grade {cls.gradeLevel} · {cls.subject}
                {cls.term ? ` · ${cls.term}` : ""}
              </p>
            </div>
            <Link
              href={`/dashboard/configure-assessment?classId=${encodeURIComponent(
                cls.id,
              )}`}
            >
              <Button variant="outline" size="sm">
                Configure assessment
              </Button>
            </Link>
          </div>

          {/* All classes strip + new class button */}
          <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
            <ClassSelectorClient
              classes={classes.map((c: TeacherClass) => ({
                id: c.id,
                name: c.name,
                subject: c.subject,
                term: c.term,
              }))}
              currentClassId={cls.id}
            />
            <CreateFirstClassButton />
          </div>
        </div>

        {/* Top row: class overview + students sidebar */}
        <div className="grid grid-cols-1 gap-6 lg:h-[680px] lg:grid-cols-[minmax(0,2.3fr)_minmax(0,1fr)]">
          {/* Left: big class card with chart + radial/bell toggle */}
          <ClassOverviewClient cls={cls as ClassScoreSummary} />

          {/* Right: students list WITH Manage button in panel */}
          <Card className="flex h-full flex-col overflow-hidden p-0">
            <div className="flex items-center justify-between gap-2 border-b border-border px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Students
                  <span className="ml-2 font-mono text-xs font-normal text-muted-foreground" data-numeric>
                    {cls.students.length}
                  </span>
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Open a student for detailed charts and subskills.
                </p>
              </div>
              <Link
                href={`/dashboard/manage-students?classId=${encodeURIComponent(
                  cls.id,
                )}`}
              >
                <Button variant="ghost" size="sm">
                  Manage
                </Button>
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto">
              {cls.students.length === 0 ? (
                <div className="flex h-full items-center justify-center px-4 py-10 text-sm text-muted-foreground">
                  No students yet. Use “Manage” to add your roster.
                </div>
              ) : (
                <ul className="divide-y divide-border/70">
                  {cls.students.map((student) => (
                    <li key={student.id} className="group">
                      <div className="flex items-center justify-between gap-2 px-5 py-2.5 transition-colors duration-150 hover:bg-accent/40">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <Link
                            href={`/dashboard/students/${student.id}?classId=${encodeURIComponent(
                              cls.id,
                            )}`}
                            className="min-w-0"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-medium text-foreground">
                                {student.name}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                Grade {student.gradeLevel}
                              </p>
                            </div>
                          </Link>
                          <Link
                            href={`/dashboard/students/${student.id}/edit-scores`}
                            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity duration-150 group-hover:opacity-100 hover:bg-muted hover:text-foreground focus-visible:opacity-100"
                            aria-label={`Edit scores for ${student.name}`}
                          >
                            <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden="true">
                              <path
                                d="M11.8 2.2a1 1 0 0 1 1.4 1.4l-7.2 7.2L4 11.5l.7-2.1 7.1-7.2zM3 6.5v6h6l2-2H5a1 1 0 0 1-1-1V6.5z"
                                fill="currentColor"
                              />
                            </svg>
                          </Link>
                        </div>
                        <span
                          className="shrink-0 rounded-md border border-border bg-muted/60 px-2 py-0.5 font-mono text-xs font-medium text-foreground"
                          data-numeric
                        >
                          {student.overallScore}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </div>

        {/* Bottom row: destructive action for this class */}
        <div className="flex justify-end">
          <DeleteClassButton classId={cls.id} />
        </div>
      </section>
    </main>
  );
}
