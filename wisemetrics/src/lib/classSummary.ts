// src/lib/classSummary.ts
import { prisma } from "@/lib/prisma";
import { getCurrentTeacherId } from "./currentTeacher";
import type {
  ClassScoreSummary,
  CategoryScore,
  StudentScoreSummary,
  SubcategoryScore,
} from "@/types/scores";
import { clampScore, SCOREMIN } from "./chartScaling";

/**
 * Returns the first classId for the current teacher, or null if none.
 */
export async function getDefaultClassIdForTeacher(): Promise<string | null> {
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) return null;

  const firstClass = await prisma.class.findFirst({
    where: { teacherId },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  return firstClass?.id ?? null;
}

/**
 * Single-class summary for a given classId.
 * NOTE: validates that the class belongs to the current teacher.
 */
export async function getClassScoreSummary(
  classId: string,
): Promise<ClassScoreSummary | null> {
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) return null;

  const cls = await prisma.class.findFirst({
    where: {
      id: classId,
      teacherId,
    },
    include: {
      categories: {
        orderBy: { order: "asc" },
        include: {
          subcategories: {
            orderBy: { order: "asc" },
          },
        },
      },
      students: {
        orderBy: { createdAt: "asc" },
        include: {
          scores: true,
        },
      },
    },
  });

  if (!cls) return null;

  // --- Per-category class averages + subskill (subcategory) averages ---

  const categoryAverages: CategoryScore[] = cls.categories.map((cat) => {
    const scoresForCategory = cls.students.flatMap((student) =>
      student.scores.filter((s) => s.categoryId === cat.id && s.subcategoryId == null),
    );

    const avgCategoryScore =
      scoresForCategory.length > 0
        ? clampScore(
            Math.round(
              scoresForCategory.reduce((sum, s) => sum + s.standardScore, 0) /
                scoresForCategory.length,
            ),
          )
        : (SCOREMIN as number);

    // Per-subcategory averages for this category
    const subcategories: SubcategoryScore[] = cat.subcategories.map((sub) => {
      const scoresForSub = cls.students.flatMap((student) =>
        student.scores.filter((s) => s.subcategoryId === sub.id),
      );

      const avgSubScore =
        scoresForSub.length > 0
          ? clampScore(
              Math.round(
                scoresForSub.reduce((sum, s) => sum + s.standardScore, 0) /
                  scoresForSub.length,
              ),
            )
          : (SCOREMIN as number);

      return {
        id: sub.id,
        name: sub.name,
        score: avgSubScore,
      };
    });

    return {
      id: cat.id,
      name: cat.name,
      score: avgCategoryScore,
      subcategories,
    };
  });

  // --- Per-student category + subcategory scores ---

  const students: StudentScoreSummary[] = cls.students.map((student) => {
    const categories: CategoryScore[] = cls.categories.map((cat) => {
      const catScore = student.scores.find(
        (s) => s.categoryId === cat.id && s.subcategoryId == null,
      );
      const catStandard = catScore
        ? clampScore(catScore.standardScore)
        : (SCOREMIN as number);

      const subcategories: SubcategoryScore[] = cat.subcategories.map((sub) => {
        const subScore = student.scores.find((s) => s.subcategoryId === sub.id);
        const subStandard = subScore
          ? clampScore(subScore.standardScore)
          : (SCOREMIN as number);

        return {
          id: sub.id,
          name: sub.name,
          score: subStandard,
        };
      });

      return {
        id: cat.id,
        name: cat.name,
        score: catStandard,
        subcategories,
      };
    });

    return {
      id: student.id,
      name: student.name,
      gradeLevel: student.gradeLevel,
      overallScore: clampScore(student.overallScore),
      categories,
    };
  });

  const summary: ClassScoreSummary = {
    id: cls.id,
    name: cls.name,
    gradeLevel: cls.gradeLevel,
    subject: cls.subject,
    term: cls.term,
    categories: categoryAverages,
    students,
  };

  return summary;
}

/**
 * List of all classes owned by the current teacher.
 */
export async function getTeacherClassesWithSummary() {
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) return [];

  const classes = await prisma.class.findMany({
    where: { teacherId },
    orderBy: { createdAt: "asc" },
    include: {
      categories: true,
      students: true,
    },
  });

  return classes.map((cls) => ({
    id: cls.id,
    name: cls.name,
    subject: cls.subject,
    term: cls.term,
    gradeLevel: cls.gradeLevel,
    studentCount: cls.students.length,
    categoryCount: cls.categories.length,
  }));
}
