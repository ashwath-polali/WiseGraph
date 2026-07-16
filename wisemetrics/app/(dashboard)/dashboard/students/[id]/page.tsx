import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentTeacherId } from "@/lib/currentTeacher";
import { getClassScoreSummary } from "@/lib/classSummary";
import type {
  ClassScoreSummary,
  StudentScoreSummary,
  CategoryScore,
  SubcategoryScore,
} from "@/types/scores";
import { Card } from "@/components/ui/Card";
import { StudentHeroChartsClient } from "@/components/StudentHeroChartsClient";
import { CategoryDrillDownClient } from "@/components/CategoryDrillDownClient";
import { Reveal } from "@/components/Reveal";
import { NumberTicker } from "@/components/ui/number-ticker";
import { CategoryGaugeCard } from "@/components/student/CategoryGaugeCard";

function scoreBand(s: number) {
  if (s >= 116)
    return {
      label: s >= 131 ? "Well above average" : "Above average",
      cls: "border-[color:var(--chart-2)]/30 bg-[color:var(--chart-2)]/10 text-[color:var(--chart-2)]",
    };
  if (s >= 85)
    return {
      label: "Average range",
      cls: "border-primary/30 bg-primary/10 text-primary",
    };
  if (s >= 70)
    return {
      label: "Below average",
      cls: "border-[color:var(--chart-3)]/40 bg-[color:var(--chart-3)]/10 text-[color:var(--chart-3)]",
    };
  return {
    label: "Well below average",
    cls: "border-destructive/30 bg-destructive/10 text-destructive",
  };
}

function BandPill({ score }: { score: number }) {
  const band = scoreBand(score);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${band.cls}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {band.label}
    </span>
  );
}

type RouteParams = {
  id: string;
};

type Props = {
  params: Promise<RouteParams>;
};

export default async function StudentDetailPage(props: Props) {
  const { id } = await props.params;

  const teacherId = await getCurrentTeacherId();
  if (!teacherId) return null;

  // finding which class this student belongs to.
  const studentRow = await prisma.student.findUnique({
    where: { id },
    select: { classId: true },
  });

  if (!studentRow) {
    return notFound();
  }

  const cls = (await getClassScoreSummary(
    studentRow.classId
  )) as ClassScoreSummary | null;
  if (!cls) {
    return notFound();
  }

  const student = cls.students.find((s) => s.id === id) as
    | StudentScoreSummary
    | undefined;
  if (!student) {
    return notFound();
  }

  const teacherRaw = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: {
      id: true,
      defaultStudentView: true,
    },
  });

  const defaultView =
    ((teacherRaw as any)?.defaultStudentView as
      | "polar"
      | "bell"
      | "concentric"
      | null) ?? "polar";

  const editHref = `/dashboard/students/${encodeURIComponent(
    id
  )}/edit-scores`;

  // Build a richer category + subskill comparison view
  const classCategoriesById = new Map<string, CategoryScore>();
  cls.categories.forEach((cat) => {
    classCategoriesById.set(cat.id, cat);
  });

  type CategoryWithSubskills = {
    id: string;
    name: string;
    classScore: number;
    studentScore: number;
    delta: number;
    subskills: {
      id: string;
      name: string;
      classScore: number;
      studentScore: number;
      delta: number;
    }[];
  };

  const categoryComparisons: CategoryWithSubskills[] = student.categories.map(
    (studentCat) => {
      const classCat = classCategoriesById.get(studentCat.id);
      const classScore = classCat?.score ?? studentCat.score;

      const subskills: CategoryWithSubskills["subskills"] = [];

      const studentSubs: SubcategoryScore[] =
        (studentCat.subcategories as SubcategoryScore[] | undefined) ?? [];
      const classSubs: SubcategoryScore[] =
        (classCat?.subcategories as SubcategoryScore[] | undefined) ?? [];

      const classSubsById = new Map<string, SubcategoryScore>();
      classSubs.forEach((sub) => classSubsById.set(sub.id, sub));

      studentSubs.forEach((sSub) => {
        const cSub = classSubsById.get(sSub.id);
        const cScore = cSub?.score ?? sSub.score;
        subskills.push({
          id: sSub.id,
          name: sSub.name,
          classScore: cScore,
          studentScore: sSub.score,
          delta: sSub.score - cScore,
        });
      });

      return {
        id: studentCat.id,
        name: studentCat.name,
        classScore,
        studentScore: studentCat.score,
        delta: studentCat.score - classScore,
        subskills,
      };
    }
  );

  return (
    <main className="space-y-8">
      {/* Hero: identity + score + band + the chart */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-[0_1px_2px_oklch(0.245_0.015_75/0.05),0_30px_60px_-30px_oklch(0.245_0.015_75/0.18)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_90%_at_85%_-10%,color-mix(in_oklch,var(--primary)_10%,transparent),transparent)]"
        />
        <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-center lg:gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
              <Link
                href={`/dashboard?classId=${encodeURIComponent(cls.id)}`}
                className="transition-colors hover:text-foreground"
              >
                ← Dashboard
              </Link>
              <span className="text-border">/</span>
              <span>
                {cls.name} · Grade {cls.gradeLevel} · {cls.subject}
              </span>
            </div>

            <h1 className="mt-4 font-display text-4xl font-medium leading-[1.03] tracking-tight text-foreground sm:text-5xl">
              {student.name}
            </h1>

            <div className="mt-6 flex flex-wrap items-end gap-x-5 gap-y-3">
              <div>
                <div
                  className="font-mono text-[3.25rem] font-semibold leading-none text-foreground"
                  data-numeric
                >
                  <NumberTicker value={student.overallScore} />
                </div>
                <div className="mt-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Overall standard score
                </div>
              </div>
              <BandPill score={student.overallScore} />
            </div>

            <div className="mt-7">
              <Link
                href={editHref}
                className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Edit scores
              </Link>
            </div>
          </div>

          <div className="min-w-0">
            <StudentHeroChartsClient
              student={student}
              cls={cls}
              defaultView={defaultView}
            />
          </div>
        </div>
      </section>

      {/* Category breakdown — premium gauges on the 60-150 scale */}
      <section>
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-xl font-medium text-foreground">
            Category breakdown
          </h2>
          <p className="text-xs text-muted-foreground">
            Every score on the 60-150 scale · the shaded band is the 85-115
            average
          </p>
        </div>
        {categoryComparisons.length === 0 ? (
          <Card className="p-6 text-sm text-muted-foreground">
            No category scores for this student yet.
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {categoryComparisons.map((cat, i) => (
              <CategoryGaugeCard key={cat.id} category={cat} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* Drill-down */}
      <Reveal>
        <Card className="space-y-4 p-6">
          <div>
            <h2 className="font-display text-xl font-medium text-foreground">
              Category drill-down
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Pick a category to see the subtests underneath it.
            </p>
          </div>
          <CategoryDrillDownClient student={student} />
        </Card>
      </Reveal>
    </main>
  );
}
