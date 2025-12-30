'use client';

import { useState, FormEvent, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Category {
  id: string;
  name: string;
  subcategories: Array<{ id: string; name: string }>;
}

interface Props {
  teacherId: string;
}

export function UniversalTemplateClient({ teacherId }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem(`psych-universal-${teacherId}`);
    if (saved) {
      try {
        setCategories(JSON.parse(saved));
      } catch {
        setCategories([]);
      }
    }
  }, [teacherId]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const validCategories = categories.filter((c) => c.name.trim());
      if (validCategories.length === 0) {
        setError('Add at least one category');
        setLoading(false);
        return;
      }

      localStorage.setItem(
        `psych-universal-${teacherId}`,
        JSON.stringify(validCategories)
      );

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save');
    } finally {
      setLoading(false);
    }
  }

  function addCategory() {
    setCategories([
      ...categories,
      {
        id: Math.random().toString(36).substr(2, 9),
        name: '',
        subcategories: [{ id: Math.random().toString(36).substr(2, 9), name: '' }],
      },
    ]);
  }

  function deleteCategory(id: string) {
    if (categories.length === 1) {
      setError('Must have at least one category');
      return;
    }
    setCategories(categories.filter((c) => c.id !== id));
  }

  function updateCategory(id: string, name: string) {
    setCategories(
      categories.map((c) => (c.id === id ? { ...c, name } : c))
    );
  }

  function addSubcategory(categoryId: string) {
    setCategories(
      categories.map((c) =>
        c.id === categoryId
          ? {
              ...c,
              subcategories: [
                ...c.subcategories,
                { id: Math.random().toString(36).substr(2, 9), name: '' },
              ],
            }
          : c
      )
    );
  }

  function updateSubcategory(
    categoryId: string,
    subId: string,
    name: string
  ) {
    setCategories(
      categories.map((c) =>
        c.id === categoryId
          ? {
              ...c,
              subcategories: c.subcategories.map((s) =>
                s.id === subId ? { ...s, name } : s
              ),
            }
          : c
      )
    );
  }

  function deleteSubcategory(categoryId: string, subId: string) {
    setCategories(
      categories.map((c) =>
        c.id === categoryId
          ? {
              ...c,
              subcategories: c.subcategories.filter((s) => s.id !== subId),
            }
          : c
      )
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="space-y-4">
        {categories.map((category) => (
          <div
            key={category.id}
            className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 space-y-3"
          >
            {/* Category */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Category
                </label>
                <Input
                  value={category.name}
                  onChange={(e) =>
                    updateCategory(category.id, e.target.value)
                  }
                  placeholder="e.g., Verbal Comprehension"
                />
              </div>
              <button
                type="button"
                onClick={() => deleteCategory(category.id)}
                className="mt-6 px-3 py-1 rounded text-xs bg-red-900/20 hover:bg-red-900/30 text-red-400"
              >
                Delete
              </button>
            </div>

            {/* Subcategories */}
            <div className="ml-2 space-y-2 border-l border-slate-600 pl-3">
              {category.subcategories.map((sub) => (
                <div key={sub.id} className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      value={sub.name}
                      onChange={(e) =>
                        updateSubcategory(category.id, sub.id, e.target.value)
                      }
                      placeholder="e.g., Similarities"
                      className="text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      deleteSubcategory(category.id, sub.id)
                    }
                    className="px-2 py-1 rounded text-xs bg-red-900/20 hover:bg-red-900/30 text-red-400 flex-shrink-0"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => addSubcategory(category.id)}
              className="text-xs text-sky-400 hover:text-sky-300 ml-2"
            >
              + Add Subtest
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addCategory}
        className="text-xs text-slate-400 hover:text-slate-300"
      >
        + Add Category
      </button>

      {error && (
        <div className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg p-3">
          {error}
        </div>
      )}

      {success && (
        <div className="text-emerald-400 text-sm bg-emerald-900/20 border border-emerald-800 rounded-lg p-3">
          Saved successfully!
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save Categories'}
      </button>
    </form>
  );
}
