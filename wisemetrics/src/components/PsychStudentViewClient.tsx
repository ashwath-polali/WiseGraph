'use client';

import { useState } from 'react';
import type { ClassScoreSummary, StudentScoreSummary } from '@/types/scores';
import { Card } from '@/components/ui/Card';

interface Props {
  student: StudentScoreSummary;
  evaluation: ClassScoreSummary;
  isUniversal: boolean;
  evaluationId: string;
}

export function PsychStudentViewClient({
  student,
  evaluation,
  isUniversal,
  evaluationId,
}: Props) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    evaluation.categories[0]?.id || null
  );

  const selectedCategory = evaluation.categories.find(
    (c) => c.id === selectedCategoryId
  );

  return (
    <div className="space-y-3">
      {/* Categories List */}
      <div className="space-y-1">
        {evaluation.categories.map((category) => {
          const categoryScore =
            student.categories?.find((c) => c.id === category.id)?.score ?? 100;
          const isSelected = selectedCategoryId === category.id;

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
                <div className={`text-xs font-semibold flex-shrink-0 ml-2 ${
                  isSelected ? 'text-sky-100' : 'text-slate-500'
                }`}>
                  {categoryScore}
                </div>
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

                return (
                  <div
                    key={sub.id}
                    className="px-3 py-2 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-50 truncate">
                        {sub.name}
                      </p>
                      <span className="text-xs font-semibold text-sky-400 flex-shrink-0 ml-2">
                        {subScore}
                      </span>
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
