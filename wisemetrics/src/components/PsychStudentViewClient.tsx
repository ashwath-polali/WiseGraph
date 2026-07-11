'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import type { ClassScoreSummary, StudentScoreSummary } from '@/types/scores';
import { Card } from '@/components/ui/Card';
import { useViewMode } from '@/components/PsychEvaluationClient';

interface Props {
  student: StudentScoreSummary;
  evaluation: ClassScoreSummary;
  isUniversal: boolean;
  evaluationId: string;
}

interface SnapshotScore {
  categoryName: string;
  categoryId: string | null;
  subcategoryName: string | null;
  subcategoryId: string | null;
  standardScore: number;
}

export function PsychStudentViewClient({
  student,
  evaluation,
  isUniversal,
  evaluationId,
}: Props) {
  const { comparisonSnapshotId } = useViewMode();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    evaluation.categories[0]?.id || null
  );
  const [snapshotScores, setSnapshotScores] = useState<SnapshotScore[] | null>(null);

  // Extract category IDs for stable dependency array
  const categoryIds = useMemo(
    () => evaluation.categories.map(c => c.id).join(','),
    [evaluation.categories]
  );

  // Reset selected category when evaluation changes
  useEffect(() => {
    // If current selection doesn't exist in new evaluation, reset to first
    const categoryExists = evaluation.categories.find(c => c.id === selectedCategoryId);
    if (!categoryExists) {
      setSelectedCategoryId(evaluation.categories[0]?.id || null);
    }
  }, [categoryIds, selectedCategoryId]); // Use stable string instead of array

  // Fetch snapshot scores when comparison is active
  useEffect(() => {
    if (!comparisonSnapshotId) {
      setSnapshotScores(null);
      return;
    }

    async function fetchSnapshotScores() {
      try {
        const res = await fetch(`/api/snapshots/${comparisonSnapshotId}`);
        if (!res.ok) throw new Error("Failed to fetch snapshot");
        const data = await res.json();
        setSnapshotScores(data.scores || []);
      } catch (error) {
        console.error("Error fetching snapshot:", error);
        setSnapshotScores(null);
      }
    }

    fetchSnapshotScores();
  }, [comparisonSnapshotId]);

  const selectedCategory = evaluation.categories.find(
    (c) => c.id === selectedCategoryId
  );

  // Helper to get snapshot score for a category
  const getSnapshotCategoryScore = (categoryId: string): number | null => {
    if (!snapshotScores) return null;
    const score = snapshotScores.find((s) => s.categoryId === categoryId && !s.subcategoryId);
    return score ? score.standardScore : null;
  };

  // Helper to get snapshot score for a subcategory
  const getSnapshotSubcategoryScore = (categoryId: string, subcategoryId: string): number | null => {
    if (!snapshotScores) return null;
    const score = snapshotScores.find(
      (s) => s.categoryId === categoryId && s.subcategoryId === subcategoryId
    );
    return score ? score.standardScore : null;
  };

  // Helper to calculate and format delta
  const formatDelta = (current: number, snapshot: number | null): string => {
    if (snapshot === null) return "";
    const delta = current - snapshot;
    if (delta === 0) return "±0";
    return delta > 0 ? `+${delta}` : `${delta}`;
  };

  // Helper to get delta color
  const getDeltaColor = (current: number, snapshot: number | null): string => {
    if (snapshot === null) return "";
    const delta = current - snapshot;
    if (delta > 0) return "text-[color:var(--chart-2)]";
    if (delta < 0) return "text-destructive";
    return "text-muted-foreground";
  };

  return (
    <div className="space-y-3">
      {/* Categories List */}
      <div className="space-y-1">
        {evaluation.categories.map((category, index) => {
          const categoryScore =
            student.categories?.find((c) => c.id === category.id)?.score ?? 100;
          const isSelected = selectedCategoryId === category.id;

          const snapshotScore = getSnapshotCategoryScore(category.id);
          const delta = formatDelta(categoryScore, snapshotScore);
          const deltaColor = getDeltaColor(categoryScore, snapshotScore);

          return (
            <motion.button
              key={category.id}
              onClick={() => setSelectedCategoryId(category.id)}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1], delay: index * 0.03 }}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-150 ${
                isSelected
                  ? 'bg-psych text-psych-foreground'
                  : 'text-muted-foreground hover:bg-accent/40 hover:text-foreground'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {category.name}
                  </p>
                </div>

                {/* Score Display */}
                {snapshotScore !== null ? (
                  <div className="flex items-center gap-1.5 text-xs font-semibold flex-shrink-0 ml-2 font-mono" data-numeric>
                    <span className={isSelected ? 'text-psych-foreground' : 'text-foreground'}>
                      {categoryScore}
                    </span>
                    <span className={isSelected ? 'text-psych-foreground/70' : 'text-muted-foreground'}>
                      {snapshotScore}
                    </span>
                    <span className={isSelected ? 'text-psych-foreground/90' : deltaColor}>
                      {delta}
                    </span>
                  </div>
                ) : (
                  <div className={`text-xs font-semibold flex-shrink-0 ml-2 font-mono ${
                    isSelected ? 'text-psych-foreground/90' : 'text-muted-foreground'
                  }`} data-numeric>
                    {categoryScore}
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Selected Category Details */}
      {selectedCategory && (
        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs font-semibold text-muted-foreground mb-2 px-2 tracking-wide">
            SUBTESTS
          </p>
          <div className="space-y-1">
            {selectedCategory.subcategories?.length ? (
              selectedCategory.subcategories.map((sub, index) => {
                const subScore =
                  student.categories
                    ?.find((c) => c.id === selectedCategory.id)
                    ?.subcategories?.find((s) => s.id === sub.id)?.score ?? 100;

                const snapshotScore = getSnapshotSubcategoryScore(selectedCategory.id, sub.id);
                const delta = formatDelta(subScore, snapshotScore);
                const deltaColor = getDeltaColor(subScore, snapshotScore);

                return (
                  <motion.div
                    key={sub.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1], delay: index * 0.03 }}
                    className="px-3 py-2 rounded-lg bg-muted/50 hover:bg-accent/40 transition-colors duration-150"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-foreground truncate">
                        {sub.name}
                      </p>

                      {/* Score Display */}
                      {snapshotScore !== null ? (
                        <div className="flex items-center gap-1.5 text-xs font-semibold flex-shrink-0 ml-2 font-mono" data-numeric>
                          <span className="text-[color:var(--chart-4)]">
                            {subScore}
                          </span>
                          <span className="text-muted-foreground">
                            {snapshotScore}
                          </span>
                          <span className={deltaColor}>
                            {delta}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-[color:var(--chart-4)] flex-shrink-0 ml-2 font-mono" data-numeric>
                          {subScore}
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <p className="text-xs text-muted-foreground px-2 py-2">
                No subtests in this category yet.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
