'use client';

import { useState, useEffect, useMemo } from 'react';
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
    if (delta > 0) return "text-emerald-400";
    if (delta < 0) return "text-red-400";
    return "text-slate-400";
  };

  return (
    <div className="space-y-3">
      {/* Categories List */}
      <div className="space-y-1">
        {evaluation.categories.map((category) => {
          const categoryScore =
            student.categories?.find((c) => c.id === category.id)?.score ?? 100;
          const isSelected = selectedCategoryId === category.id;
          
          const snapshotScore = getSnapshotCategoryScore(category.id);
          const delta = formatDelta(categoryScore, snapshotScore);
          const deltaColor = getDeltaColor(categoryScore, snapshotScore);

          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategoryId(category.id)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                isSelected
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-50'
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
                  <div className="flex items-center gap-1.5 text-xs font-semibold flex-shrink-0 ml-2">
                    <span className={isSelected ? 'text-white' : 'text-slate-200'}>
                      {categoryScore}
                    </span>
                    <span className={isSelected ? 'text-sky-200' : 'text-slate-500'}>
                      {snapshotScore}
                    </span>
                    <span className={deltaColor}>
                      {delta}
                    </span>
                  </div>
                ) : (
                  <div className={`text-xs font-semibold flex-shrink-0 ml-2 ${
                    isSelected ? 'text-sky-100' : 'text-slate-500'
                  }`}>
                    {categoryScore}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Category Details */}
      {selectedCategory && (
        <div className="mt-6 pt-4 border-t border-slate-700">
          <p className="text-xs font-semibold text-slate-400 mb-2 px-2">
            SUBTESTS
          </p>
          <div className="space-y-1">
            {selectedCategory.subcategories?.length ? (
              selectedCategory.subcategories.map((sub) => {
                const subScore =
                  student.categories
                    ?.find((c) => c.id === selectedCategory.id)
                    ?.subcategories?.find((s) => s.id === sub.id)?.score ?? 100;

                const snapshotScore = getSnapshotSubcategoryScore(selectedCategory.id, sub.id);
                const delta = formatDelta(subScore, snapshotScore);
                const deltaColor = getDeltaColor(subScore, snapshotScore);

                return (
                  <div
                    key={sub.id}
                    className="px-3 py-2 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-50 truncate">
                        {sub.name}
                      </p>
                      
                      {/* Score Display */}
                      {snapshotScore !== null ? (
                        <div className="flex items-center gap-1.5 text-xs font-semibold flex-shrink-0 ml-2">
                          <span className="text-sky-400">
                            {subScore}
                          </span>
                          <span className="text-slate-500">
                            {snapshotScore}
                          </span>
                          <span className={deltaColor}>
                            {delta}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-sky-400 flex-shrink-0 ml-2">
                          {subScore}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-500 px-2 py-2">
                No subtests
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
