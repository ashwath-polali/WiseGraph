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

  const cls = await prisma.class.findFirst({
    where: { teacherId },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  return cls?.id ?? null;
}

/**
 * Single-class summary for a given classId.
 * NOTE: validates that the class belongs to the current teacher.
 */
export async function getClassScoreSummary(
  classId: string
): Promise<ClassScoreSummary | null> {
  const teacherId = await getCurrentTeacherId();
  if (!teacherId) return null;

  const cls = await prisma.class.findFirst({
    where: { id: classId, teacherId },
    include: {
      categories: {
        orderBy: { order: "asc" },
        include: {
          subcategories: {
            orderBy: { order: "asc" },
          },
          scores: true,
        },
      },
      students: {
        orderBy: { name: "asc" },
        include: {
          scores: true,
        },
      },
    },
  });

  if (!cls) return null;

  // --- Per-category class averages ---
  const categorySummaries: CategoryScore[] = cls.categories.map((cat) => {
    const categoryScores = cls.students
      .map((student) =>
        student.scores.find(
          (s) => s.categoryId === cat.id && s.subcategoryId === null
        )
      )
      .filter((s) => !!s)
      .map((s) => clampScore(s!.standardScore));

    const avg =
      categoryScores.length === 0
        ? SCOREMIN
        : Math.round(
            categoryScores.reduce((sum, v) => sum + v, 0) /
              categoryScores.length
          );

    return {
      id: cat.id,
      name: cat.name,
      score: avg,
    };
  });

  // --- Per-student category + subcategory scores ---
  const studentSummaries: StudentScoreSummary[] = cls.students.map(
    (student) => {
      const categories: CategoryScore[] = cls.categories.map((cat) => {
        const catScoreRow = student.scores.find(
          (s) => s.categoryId === cat.id && s.subcategoryId === null
        );
        const catScore = clampScore(
          catScoreRow?.standardScore ?? SCOREMIN
        );

        const subskills: SubcategoryScore[] = cat.subcategories.map(
          (sub) => {
            const subRow = student.scores.find(
              (s) => s.subcategoryId === sub.id
            );
            const subScore = clampScore(
              subRow?.standardScore ?? SCOREMIN
            );
            return {
              id: sub.id,
              name: sub.name,
              score: subScore,
            };
          }
        );

        return {
          id: cat.id,
          name: cat.name,
          score: catScore,
          subcategories: subskills,
        };
      });

      return {
        id: student.id,
        name: student.name,
        gradeLevel: student.gradeLevel,
        overallScore: clampScore(student.overallScore),
        categories,
      };
    }
  );

  return {
    id: cls.id,
    name: cls.name,
    gradeLevel: cls.gradeLevel,
    subject: cls.subject,
    term: cls.term,
    categories: categorySummaries,
    students: studentSummaries,
  };
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
      students: true,
    },
  });

  return classes.map((cls) => ({
    id: cls.id,
    name: cls.name,
    gradeLevel: cls.gradeLevel,
    subject: cls.subject,
    term: cls.term,
    studentCount: cls.students.length,
  }));
}
