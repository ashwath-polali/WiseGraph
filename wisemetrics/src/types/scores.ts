// src/types/scores.ts
export type StandardScore = number; // 60–150

export interface CategoryScore {
  id: string;
  name: string;
  score: StandardScore;
}

export interface StudentScoreSummary {
  id: string;
  name: string;
  gradeLevel: string;
  overallScore: StandardScore;
  categories: CategoryScore[];
}

export interface ClassScoreSummary {
  id: string;
  name: string;
  gradeLevel: string;
  subject: string;
  term?: string | null;
  categories: CategoryScore[];          // class averages per category
  students: StudentScoreSummary[];      // students with per-category scores
}
