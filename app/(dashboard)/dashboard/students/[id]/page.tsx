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
import { TeacherStudentReport } from "@/components/teacher/TeacherStudentReport";

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
    <TeacherStudentReport student={student} cls={cls} comparisons={categoryComparisons} editHref={editHref} />
  );
}
