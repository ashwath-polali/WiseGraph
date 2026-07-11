"use client";

import { useState, FormEvent } from "react";
import { motion } from "motion/react";
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
  const [categories, setCategories] =
    useState<CategoryScore[]>(initialCategories);
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
      body: JSON.stringify({ categoryId, name }),
    });

    if (!res.ok) {
      console.error("Failed to add subcategory", await res.text());
      return;
    }

    const created: { id: string; name: string } = await res.json();

    // ✅ OPTIMISTIC UPDATE - This fixes the refresh issue
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== categoryId) return cat;

        const existing = cat.subcategories ?? [];

        // Avoid duplicate ids; otherwise append so UI updates immediately
        if (!created.id || existing.some((s) => s.id === created.id)) {
          return cat;
        }

        return {
          ...cat,
          subcategories: [
            ...existing,
            {
              id: created.id,
              name: created.name,
              score: 100 as SubcategoryScore["score"],
            },
          ],
        };
      })
    );

    // Clear the input immediately
    setNewSubNameByCategory((prev) => ({ ...prev, [categoryId]: "" }));
  }

  async function handleDeleteCategory(id: string, name: string) {
    const ok = window.confirm(
      `Are you sure you want to delete the category "${name}"? This will also remove all of its subskills and scores.`
    );
    if (!ok) return;

    const res = await fetch(`/api/categories?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      console.error("Failed to delete category", await res.text());
      return;
    }

    setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  async function handleDeleteSubcategory(id: string, name: string) {
    const ok = window.confirm(
      `Delete subskill "${name}"? This will remove its scores for all students.`
    );
    if (!ok) return;

    const res = await fetch(
      `/api/subcategories?id=${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      }
    );

    if (!res.ok) {
      console.error("Failed to delete subcategory", await res.text());
      return;
    }

    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        subcategories: cat.subcategories?.filter((s) => s.id !== id) ?? [],
      }))
    );
  }

  return (
    <div className="space-y-6">
      {/* Add category */}
      <form
        onSubmit={handleAddCategory}
        className="flex flex-col items-start gap-3 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
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
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.2,
              ease: [0.22, 1, 0.36, 1],
              delay: index * 0.03,
            }}
            className="space-y-3 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-[0_1px_2px_oklch(0.245_0.015_75/0.05),0_12px_32px_-16px_oklch(0.245_0.015_75/0.14)]"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {index + 1}. {cat.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Subskills: {cat.subcategories?.length ?? 0}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteCategory(cat.id, cat.name)}
                className="rounded-md p-1.5 text-muted-foreground transition-colors duration-150 hover:bg-destructive/10 hover:text-destructive"
                aria-label={`Delete category ${cat.name}`}
              >
                {/* simple trashcan icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    d="M3 4h10l-.7 9.1A1.5 1.5 0 0 1 10.8 14H5.2a1.5 1.5 0 0 1-1.5-1.3L3 4Z"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  />
                  <path
                    d="M6 4V2.8A1.3 1.3 0 0 1 7.3 1.5h1.4A1.3 1.3 0 0 1 10 2.8V4"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  />
                  <path
                    d="M2 4h12"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  />
                  <path
                    d="M7 6v5"
                    stroke="currentColor"
                    strokeWidth="1.1"
                    strokeLinecap="round"
                  />
                  <path
                    d="M9 6v5"
                    stroke="currentColor"
                    strokeWidth="1.1"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-2">
              {(cat.subcategories ?? []).length > 0 && (
                <ul className="space-y-1 text-xs text-foreground">
                  {(cat.subcategories ?? [])
                    .filter((sub) => sub && sub.id)
                    .map((sub, idx) => (
                      <li
                        key={`${sub.id}-${idx}`}
                        className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1 transition-colors duration-150 hover:bg-accent/40"
                      >
                        <div className="flex items-center gap-2">
                          <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                          <span>{sub.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteSubcategory(sub.id, sub.name)
                          }
                          className="rounded-md p-1 text-muted-foreground transition-colors duration-150 hover:bg-destructive/10 hover:text-destructive"
                          aria-label={`Delete subskill ${sub.name}`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3 w-3"
                            viewBox="0 0 16 16"
                            fill="none"
                          >
                            <path
                              d="M3 4h10l-.7 9.1A1.5 1.5 0 0 1 10.8 14H5.2a1.5 1.5 0 0 1-1.5-1.3L3 4Z"
                              stroke="currentColor"
                              strokeWidth="1.1"
                            />
                            <path
                              d="M2 4h12"
                              stroke="currentColor"
                              strokeWidth="1.1"
                            />
                          </svg>
                        </button>
                      </li>
                    ))}
                </ul>
              )}

              <form
                onSubmit={(e) => handleAddSubcategory(cat.id, e)}
                className="flex items-end gap-2"
              >
                <div className="flex-1">
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
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
          </motion.div>
        ))}

        {categories.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No categories yet. Add at least one to configure assessments.
          </p>
        )}
      </div>
    </div>
  );
}
