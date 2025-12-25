// src/lib/classSummary.ts
import { prisma } from "@/lib/prisma";
import type {
  ClassScoreSummary,
  CategoryScore,
  StudentScoreSummary,
  SubcategoryScore,
} from "@/types/scores";

export async function getClassScoreSummary(): Promise<ClassScoreSummary | null> {
  const cls = await prisma.class.findFirst({
    include: {
      categories: {
        include: { subcategories: true },
      },
      students: {
        include: { scores: true },
      },
    },
  });

  if (!cls) return null;

  // Per-category class averages
  const categories: CategoryScore[] = cls.categories
    .sort((a, b) => a.order - b.order)
    .map((cat) => {
      const scores = cls.students
        .flatMap((s) => s.scores)
        .filter((sc) => sc.categoryId === cat.id)
        .map((sc) => sc.standardScore);

      const avg =
        scores.length > 0
          ? Math.round(scores.reduce((sum, v) => sum + v, 0) / scores.length)
          : cls.students.length > 0
          ? Math.round(
              cls.students.reduce((sum, s) => sum + s.overallScore, 0) /
                cls.students.length
            )
          : 100;

      return {
        id: cat.id,
        name: cat.name,
        score: avg,
      };
    });

  // Per-student category + subcategory scores
  const students: StudentScoreSummary[] = cls.students.map((s) => {
    const categoryScores: CategoryScore[] = cls.categories.map((cat) => {
      const catScore = s.scores.find((sc) => sc.categoryId === cat.id);

      const subcategories: SubcategoryScore[] = cat.subcategories.map(
        (sub) => {
          const subScore = s.scores.find(
            (sc) => sc.subcategoryId === sub.id
          );

          return {
            id: sub.id,
            name: sub.name,
            score:
              subScore?.standardScore ??
              catScore?.standardScore ??
              s.overallScore,
          };
        }
      );

      return {
        id: cat.id,
        name: cat.name,
        score: catScore?.standardScore ?? s.overallScore,
        subcategories,
      };
    });

    return {
      id: s.id,
      name: s.name,
      gradeLevel: s.gradeLevel,
      overallScore: s.overallScore,
      categories: categoryScores,
    };
  });

  return {
    id: cls.id,
    name: cls.name,
    gradeLevel: cls.gradeLevel,
    subject: cls.subject,
    term: cls.term,
    categories,
    students,
  };
}
