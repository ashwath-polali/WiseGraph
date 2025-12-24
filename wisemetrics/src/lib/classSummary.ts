// src/lib/classSummary.ts
import { prisma } from "@/lib/prisma";
import type { ClassScoreSummary, CategoryScore, StudentScoreSummary } from "@/types/scores";

export async function getClassScoreSummary(): Promise<ClassScoreSummary | null> {
  const cls = await prisma.class.findFirst({
    include: {
      categories: true,
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

  // Per-student category scores
  const students: StudentScoreSummary[] = cls.students.map((s) => {
    const categoryScores: CategoryScore[] = cls.categories.map((cat) => {
      const score = s.scores.find((sc) => sc.categoryId === cat.id);
      return {
        id: cat.id,
        name: cat.name,
        score: score?.standardScore ?? s.overallScore,
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
