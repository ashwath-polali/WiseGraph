// src/components/CategoryDrillDownClient.tsx
"use client";

import { useState, useMemo } from "react";
import type { StudentScoreSummary } from "@/types/scores";

interface Props {
  student: StudentScoreSummary;
}

export function CategoryDrillDownClient({ student }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(
    student.categories[0]?.id ?? null
  );

  const selected = useMemo(
    () => student.categories.find((c) => c.id === selectedId) ?? null,
    [student.categories, selectedId]
  );

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

      {!selected ? (
        <p className="text-xs text-slate-500">
          No categories available for this student.
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-slate-400">
            Subskill detail for {selected.name} will use your diamond chart
            component once subscores are wired.
          </p>
          <div className="h-56 flex items-center justify-center text-xs text-slate-500">
            Subcategory diamond chart placeholder.
          </div>
        </div>
      )}
    </div>
  );
}
