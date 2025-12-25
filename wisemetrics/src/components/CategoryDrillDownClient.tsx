// src/components/CategoryDrillDownClient.tsx
"use client";

import { useState, useMemo } from "react";
import type {
  StudentScoreSummary,
  SubcategoryScore,
} from "@/types/scores";
import { SubcategoryDiamondChart } from "@/components/charts/SubcategoryDiamondChart";

interface Props {
  student: StudentScoreSummary;
}

export function CategoryDrillDownClient({ student }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(
    student.categories[0]?.id ?? null
  );

  const selectedCategory = useMemo(
    () => student.categories.find((c) => c.id === selectedId) ?? null,
    [student.categories, selectedId]
  );

  const subskills: SubcategoryScore[] =
    selectedCategory?.subcategories ?? [];

  return (
    <div className="space-y-3">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-slate-200">
          Category drill-down
        </h2>
        <select
          className="rounded-md bg-slate-900 border border-slate-700 px-2 py-1 text-xs text-slate-50"
          value={selectedId ?? ""}
          onChange={(e) => setSelectedId(e.target.value || null)}
        >
          {student.categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </header>

      {!selectedCategory || subskills.length === 0 ? (
        <p className="text-xs text-slate-500">
          No subskills recorded for this category yet.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="h-80 md:h-96">
            <SubcategoryDiamondChart subskills={subskills} />
          </div>
          <ul className="space-y-2 text-xs text-slate-300">
            {subskills.map((sub) => (
              <li
                key={sub.id}
                className="flex items-center justify-between border-b border-slate-800 pb-1 last:border-b-0 last:pb-0"
              >
                <span>{sub.name}</span>
                <span className="text-slate-400">{sub.score}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
