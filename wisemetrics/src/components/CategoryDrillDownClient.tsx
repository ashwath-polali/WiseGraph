"use client";

import { useState, useMemo } from "react";
import { motion } from "motion/react";
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
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">
          Category drill-down
        </h2>
        <select
          className="rounded-md border border-input bg-card px-2 py-1 text-xs text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

      <div className="mt-1 grid gap-4 md:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)]">
        {/* Fixed, centered chart area so size is stable across categories */}
        <div className="flex h-[400px] items-center justify-center">
          {!selectedCategory || subskills.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No subskills recorded for this category yet.
            </p>
          ) : (
            <div className="h-full w-full max-w-xl">
              <SubcategoryDiamondChart subskills={subskills} />
            </div>
          )}
        </div>

        <ul className="space-y-1.5">
          {subskills.map((sub, i) => (
            <motion.li
              key={sub.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.2,
                ease: [0.22, 1, 0.36, 1],
                delay: i * 0.03,
              }}
              className="flex items-center justify-between gap-3 rounded-md bg-muted px-3 py-2 transition-colors duration-150 hover:bg-accent/40"
            >
              <span className="min-w-0 truncate text-sm text-foreground">
                {sub.name}
              </span>
              <span
                data-numeric
                className="shrink-0 rounded-md border border-border bg-muted/60 px-2 py-0.5 font-mono text-xs text-muted-foreground"
              >
                {sub.score}
              </span>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}
