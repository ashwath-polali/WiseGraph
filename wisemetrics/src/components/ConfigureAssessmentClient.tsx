// src/components/ConfigureAssessmentClient.tsx
"use client";

import { useState, FormEvent } from "react";
import type { CategoryScore, SubcategoryScore } from "@/types/scores";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Props {
  classId: string;
  initialCategories: CategoryScore[];
}

export function ConfigureAssessmentClient({
  classId,
  initialCategories,
}: Props) {
  // Single source of truth for this UI: categories state
  const [categories, setCategories] = useState<CategoryScore[]>(initialCategories);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newSubNameByCategory, setNewSubNameByCategory] = useState<
    Record<string, string>
  >({});

  async function handleAddCategory(e: FormEvent) {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        classId,
        name: newCategoryName.trim(),
      }),
    });

    if (!res.ok) {
      console.error("Failed to add category", await res.text());
      return;
    }

    const created = await res.json();

    setCategories((prev) => [
      ...prev,
      {
        id: created.id,
        name: created.name,
        score: created.score ?? 100,
        subcategories: [],
      },
    ]);

    setNewCategoryName("");
    // no router.refresh() → avoid resetting to initialCategories
  }

  async function handleAddSubcategory(
    categoryId: string,
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    const name = newSubNameByCategory[categoryId]?.trim();
    if (!name) return;

    const res = await fetch("/api/subcategories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoryId,
        name,
      }),
    });

    if (!res.ok) {
      console.error("Failed to add subcategory", await res.text());
      return;
    }

    const created: { id: string; name: string } = await res.json();

    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              subcategories: [
                ...(cat.subcategories ?? []),
                {
                  id: created.id,
                  name: created.name,
                  // score is irrelevant here; just use 100
                  score: 100 as SubcategoryScore["score"],
                },
              ],
            }
          : cat
      )
    );

    setNewSubNameByCategory((prev) => ({ ...prev, [categoryId]: "" }));
    // no router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Add category */}
      <form
        onSubmit={handleAddCategory}
        className="flex flex-col items-start gap-3 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-400">
            New category
          </label>
          <Input
            placeholder="e.g. Reading"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
        </div>
        <Button type="submit" className="whitespace-nowrap">
          Add category
        </Button>
      </form>

      {/* Category list */}
      <div className="space-y-4">
        {categories.map((cat, index) => (
          <div
            key={cat.id}
            className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-50">
                  {index + 1}. {cat.name}
                </p>
                <p className="text-xs text-slate-400">
                  Subskills: {cat.subcategories?.length ?? 0}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {(cat.subcategories ?? []).length > 0 && (
                <ul className="space-y-1 text-xs text-slate-300">
                  {cat.subcategories!.map((sub) => (
                    <li key={sub.id} className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-slate-500" />
                      <span>{sub.name}</span>
                    </li>
                  ))}
                </ul>
              )}

              <form
                onSubmit={(e) => handleAddSubcategory(cat.id, e)}
                className="flex items-end gap-2"
              >
                <div className="flex-1">
                  <label className="mb-1 block text-[11px] font-medium text-slate-400">
                    Add subskill
                  </label>
                  <Input
                    placeholder="e.g. Decoding"
                    value={newSubNameByCategory[cat.id] ?? ""}
                    onChange={(e) =>
                      setNewSubNameByCategory((prev) => ({
                        ...prev,
                        [cat.id]: e.target.value,
                      }))
                    }
                  />
                </div>
                <Button type="submit">Add</Button>
              </form>
            </div>
          </div>
        ))}

        {categories.length === 0 && (
          <p className="text-xs text-slate-500">
            No categories yet. Add at least one to configure assessments.
          </p>
        )}
      </div>
    </div>
  );
}
