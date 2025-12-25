// src/components/EditScoresClient.tsx
"use client";

import { useState, useMemo, FormEvent } from "react";
import { useRouter } from "next/navigation";
import type {
  StudentScoreSummary,
  CategoryScore,
  SubcategoryScore,
} from "@/types/scores";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface Props {
  student: StudentScoreSummary;
}

interface EditableCategory extends CategoryScore {
  subcategories?: SubcategoryScore[];
}

export function EditScoresClient({ student }: Props) {
  const router = useRouter();

  const [overallInput, setOverallInput] = useState<string>(
    student.overallScore.toString()
  );
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState<EditableCategory[]>(
    student.categories
  );

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    student.categories[0]?.id ?? null
  );

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId]
  );

  function updateCategoryScore(categoryId: string, value: string) {
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed)) return;
    setCategories((prev) =>
      prev.map((c) =>
        c.id === categoryId ? { ...c, score: parsed } : c
      )
    );
  }

  function updateSubskillScore(
    categoryId: string,
    subId: string,
    value: string
  ) {
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed)) return;
    setCategories((prev) =>
      prev.map((c) =>
        c.id === categoryId
          ? {
              ...c,
              subcategories: c.subcategories?.map((s) =>
                s.id === subId ? { ...s, score: parsed } : s
              ),
            }
          : c
      )
    );
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const overallParsed = parseInt(overallInput, 10);
      if (!Number.isNaN(overallParsed)) {
        await fetch("/api/studentOverall", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId: student.id,
            overallScore: overallParsed,
          }),
        });
      }

      // Save category scores
      for (const cat of categories) {
        await fetch("/api/scores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId: student.id,
            categoryId: cat.id,
            subcategoryId: null,
            standardScore: cat.score,
          }),
        });

        // Save subskills
        for (const sub of cat.subcategories ?? []) {
          await fetch("/api/scores", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              studentId: student.id,
              categoryId: cat.id,
              subcategoryId: sub.id,
              standardScore: sub.score,
            }),
          });
        }
      }

      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      {/* Overall score */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Overall standard score
          </label>
          <Input
            type="number"
            min={60}
            max={150}
            value={overallInput}
            onChange={(e) => setOverallInput(e.target.value)}
          />
        </div>
      </div>

      {/* Category selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-200">
          Category and subskill scores
        </h3>
        <select
          className="rounded-md bg-slate-900 border border-slate-700 px-2 py-1 text-xs text-slate-50"
          value={selectedCategoryId ?? ""}
          onChange={(e) => setSelectedCategoryId(e.target.value || null)}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Selected category editor */}
      {!selectedCategory ? (
        <p className="text-xs text-slate-500">
          No categories available for this student.
        </p>
      ) : (
        <div className="space-y-3 text-xs text-slate-300">
          <div className="flex items-center gap-3">
            <span className="w-32 text-slate-400">Category score</span>
            <Input
              type="number"
              min={60}
              max={150}
              value={selectedCategory.score}
              onChange={(e) =>
                updateCategoryScore(selectedCategory.id, e.target.value)
              }
            />
          </div>

          <div className="space-y-2">
            <p className="text-[11px] text-slate-400">Subskills</p>
            {(selectedCategory.subcategories ?? []).length === 0 ? (
              <p className="text-[11px] text-slate-500">
                No subskills recorded for this category yet.
              </p>
            ) : (
              <div className="space-y-2">
                {selectedCategory.subcategories!.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center gap-3"
                  >
                    <span className="w-32 truncate">{sub.name}</span>
                    <Input
                      type="number"
                      min={60}
                      max={150}
                      value={sub.score}
                      onChange={(e) =>
                        updateSubskillScore(
                          selectedCategory.id,
                          sub.id,
                          e.target.value
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save all"}
        </Button>
      </div>
    </form>
  );
}
