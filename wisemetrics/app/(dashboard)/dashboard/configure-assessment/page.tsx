import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  getTeacherClassesWithSummary,
  getDefaultClassIdForTeacher,
} from "@/lib/classSummary";
import { Card } from "@/components/ui/Card";
import { ConfigureAssessmentClient } from "@/components/ConfigureAssessmentClient";
import { CreateFirstClassButton } from "@/components/CreateFirstClassButton";

type TeacherClass = {
  id: string;
  name: string;
  gradeLevel: string;
  subject: string;
  term: string | null;
};

type CategoryWithSubs = {
  id: string;
  name: string;
  subcategories: { id: string; name: string }[];
};

type SubcategoryLite = {
  id: string;
  name: string;
};

export default async function ConfigureAssessmentPage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string }>;
}) {
  const { classId } = await searchParams;

  const classes = (await getTeacherClassesWithSummary()) as TeacherClass[];

  if (!classes.length) {
    return (
      <main className="space-y-6">
        <Card className="space-y-4 p-6">
          <h1 className="text-xl font-semibold text-foreground">Configure assessment</h1>
          <p className="text-sm text-muted-foreground">
            Create a class first, then you can set up its categories and subskills.
          </p>
          <CreateFirstClassButton />
          <Link href="/dashboard" className="text-xs text-primary transition-colors hover:text-primary/80">
            Back to dashboard
          </Link>
        </Card>
      </main>
    );
  }

  const idFromQuery =
    classId &&
    classes.some((c: TeacherClass) => c.id === classId)
      ? classId
      : null;

  const defaultClassId = await getDefaultClassIdForTeacher();
  const idFromDefault =
    defaultClassId &&
    classes.some((c: TeacherClass) => c.id === defaultClassId)
      ? defaultClassId
      : null;

  const currentClassId = idFromQuery ?? idFromDefault ?? classes[0].id;

  const cls = await prisma.class.findUnique({
    where: { id: currentClassId },
    include: {
      categories: {
        orderBy: { order: "asc" },
        include: {
          subcategories: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!cls) {
    return (
      <main className="space-y-6">
        <Card className="p-6">
          <h1 className="text-xl font-semibold text-foreground">Configure assessment</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We couldn&apos;t load that class. Head back to the dashboard and try again.
          </p>
          <Link href="/dashboard" className="text-xs text-primary transition-colors hover:text-primary/80">
            Back to dashboard
          </Link>
        </Card>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <Card className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Configure assessment · {cls.name}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Grade {cls.gradeLevel} · {cls.subject}
            </p>
          </div>
          <Link href={`/dashboard?classId=${encodeURIComponent(cls.id)}`}>
            <span className="text-xs text-primary transition-colors hover:text-primary/80">Back to dashboard</span>
          </Link>
        </div>

        <ConfigureAssessmentClient
          classId={cls.id}
          initialCategories={cls.categories.map(
            (cat: CategoryWithSubs) => ({
              id: cat.id,
              name: cat.name,
              score: 100 as const,
              subcategories: cat.subcategories.map(
                (sub: SubcategoryLite) => ({
                  id: sub.id,
                  name: sub.name,
                  score: 100 as const,
                }),
              ),
            }),
          )}
        />
      </Card>
    </main>
  );
}
