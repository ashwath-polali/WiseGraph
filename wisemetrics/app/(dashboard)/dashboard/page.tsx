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
import { RosterList } from "@/components/RosterList";
import { OnboardingTour } from "@/components/OnboardingTour";
import { TEACHER_TOUR } from "@/lib/onboardingSteps";

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

  const onboard = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { onboardedAt: true },
  });
  const showTour = !onboard?.onboardedAt;

  const classes = (await getTeacherClassesWithSummary()) as TeacherClass[];

  if (!classes.length) {
    return (
      <main className="flex min-h-[calc(100dvh-8rem)] items-center justify-center">
        <Card className="w-full max-w-xl space-y-6 p-8">
          <div>
            <h1 className="font-display text-2xl font-medium text-foreground">
              Let&apos;s set up your first class.
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Add a class, drop in your roster, and you can start scoring
              students by category and subskill.
            </p>
          </div>
          <span data-tour="teacher-new">
            <CreateFirstClassButton />
          </span>
        </Card>
        <OnboardingTour steps={TEACHER_TOUR} storageKey="wg_tour_teacher_v1" enabled={showTour} />
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
            We couldn&apos;t load that class. Pick another one, or refresh the
            page.
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
              data-tour="teacher-configure"
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
            <span data-tour="teacher-new">
              <CreateFirstClassButton />
            </span>
          </div>
        </div>

        {/* Top row: class overview + students sidebar */}
        <div className="grid grid-cols-1 gap-6 lg:h-[680px] lg:grid-cols-[minmax(0,2.3fr)_minmax(0,1fr)]">
          {/* Left: big class card with chart + radial/bell toggle */}
          <div data-tour="teacher-overview" className="min-w-0">
            <ClassOverviewClient cls={cls as ClassScoreSummary} />
          </div>

          {/* Right: students list WITH Manage button in panel */}
          <Card data-tour="teacher-roster" className="flex h-full flex-col overflow-hidden p-0">
            <div className="flex items-center justify-between gap-2 border-b border-border px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Students
                  <span className="ml-2 font-mono text-xs font-normal text-muted-foreground" data-numeric>
                    {cls.students.length}
                  </span>
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Open a student to see their charts and subskill breakdown.
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

            <div className="flex-1 overflow-y-auto" data-lenis-prevent>
              {cls.students.length === 0 ? (
                <div className="flex h-full items-center justify-center px-4 py-10 text-sm text-muted-foreground">
                  No students yet. Add your first from Manage.
                </div>
              ) : (
                <RosterList students={cls.students} classId={cls.id} />
              )}
            </div>
          </Card>
        </div>

        {/* Bottom row: destructive action for this class */}
        <div className="flex justify-end">
          <DeleteClassButton classId={cls.id} />
        </div>
      </section>
      <OnboardingTour steps={TEACHER_TOUR} storageKey="wg_tour_teacher_v1" enabled={showTour} />
    </main>
  );
}
