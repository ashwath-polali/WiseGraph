'use client';

import { useState, FormEvent, useEffect } from 'react';
import { motion } from 'motion/react';
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
    // Load from DATABASE instead of localStorage
    async function loadTemplate() {
      try {
        const res = await fetch('/api/universal-template');
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
        }
      } catch (err) {
        console.error('Failed to load template:', err);
      }
    }
    loadTemplate();
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

      // Save to DATABASE instead of localStorage
      const res = await fetch('/api/universal-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: validCategories }),
      });

      if (!res.ok) throw new Error('Failed to save');

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
        {categories.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1], delay: index * 0.03 }}
            className="p-4 bg-muted/50 rounded-lg border border-border space-y-3"
          >
            {/* Category */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-foreground mb-1">
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
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => deleteCategory(category.id)}
                className="mt-6"
              >
                Delete
              </Button>
            </div>

            {/* Subcategories */}
            <div className="ml-2 space-y-2 border-l border-border pl-3">
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
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon-sm"
                    onClick={() =>
                      deleteSubcategory(category.id, sub.id)
                    }
                    className="flex-shrink-0"
                    aria-label="Delete subtest"
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="link"
              size="xs"
              onClick={() => addSubcategory(category.id)}
              className="ml-2 px-0 text-psych"
            >
              + Add Subtest
            </Button>
          </motion.div>
        ))}
      </div>

      <Button
        type="button"
        variant="link"
        size="xs"
        onClick={addCategory}
        className="px-0 text-muted-foreground hover:text-foreground"
      >
        + Add Category
      </Button>

      {error && (
        <div className="text-destructive text-sm bg-destructive/10 border border-destructive/30 rounded-lg p-3">
          {error}
        </div>
      )}

      {success && (
        <div className="text-[color:var(--chart-2)] text-sm bg-[color:var(--chart-2)]/10 border border-[color:var(--chart-2)]/30 rounded-lg p-3">
          Saved successfully!
        </div>
      )}

      <Button
        type="submit"
        disabled={loading}
        size="lg"
        className="w-full"
      >
        {loading ? 'Saving...' : 'Save Categories'}
      </Button>
    </form>
  );
}
