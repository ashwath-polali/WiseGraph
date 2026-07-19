'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

const GRADES = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

export default function NewEvaluationPage() {
  const router = useRouter();
  const [studentName, setStudentName] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [useUniversal, setUseUniversal] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [teacherId, setTeacherId] = useState('');

  // Get teacherId from sessionStorage or auth
  useEffect(() => {
    const stored = sessionStorage.getItem('teacherId');
    if (stored) setTeacherId(stored);
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (!studentName.trim()) {
      setError('Add the student\'s name to continue.');
      setLoading(false);
      return;
    }

    if (!gradeLevel.trim()) {
      setError('Add a grade level to continue.');
      setLoading(false);
      return;
    }
    
    let createdClassId: string | null = null;
    
    try {
      let template: { categories: Array<{ name: string; subcategories: string[] }> };
      let templateName: string;

      if (useUniversal) {
        // Load template from DATABASE instead of localStorage
        const templateRes = await fetch('/api/universal-template');
        if (!templateRes.ok) {
          throw new Error('You haven\'t set up your universal categories yet. Add them first, then come back.');
        }
        const templateData = await templateRes.json();
        if (!templateData.categories || templateData.categories.length === 0) {
          throw new Error('You haven\'t set up your universal categories yet. Add them first, then come back.');
        }
        
        template = {
          categories: templateData.categories.map((cat: any) => ({
            name: cat.name,
            subcategories: cat.subcategories.map((s: any) =>
              typeof s === 'string' ? s : s.name
            ),
          })),
        };
        templateName = 'Universal Assessment';
      } else {
        template = { categories: [] };
        templateName = 'Custom Assessment';
      }

      const classRes = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${studentName.trim()} - ${templateName}`,
          gradeLevel: gradeLevel.trim(),
          subject: templateName,
          term: new Date().toISOString().split('T')[0],
        }),
      });
      
      if (!classRes.ok) {
        const errData = await classRes.json();
        throw new Error(errData.error || 'We couldn\'t create that evaluation. Try again.');
      }
      
      const classDataRaw = await classRes.json();
      const classData = classDataRaw.class || classDataRaw;
      createdClassId = classData.id;
      
      await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: classData.id,
          name: studentName.trim(),
          gradeLevel: gradeLevel.trim(),
          overallScore: 100,
        }),
      });
      
      // Create categories and subcategories if using template
      for (let idx = 0; idx < template.categories.length; idx++) {
        const category = template.categories[idx];
        const catRes = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            classId: classData.id,
            name: category.name,
            order: idx,
          }),
        });
        
        if (!catRes.ok) continue;
        
        const catData = await catRes.json();
        
        for (let subIdx = 0; subIdx < category.subcategories.length; subIdx++) {
          await fetch('/api/subcategories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              categoryId: catData.id,
              name: category.subcategories[subIdx],
              order: subIdx,
            }),
          });
        }
      }
      
      router.push(`/psych/evaluations/${classData.id}`);
      
    } catch (err: any) {
      setError(err.message || 'We couldn\'t create that evaluation. Try again.');
      if (createdClassId) {
        try {
          await fetch('/api/classes', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: createdClassId }),
          });
        } catch {
          // ignore
        }
      }
    } finally {
      setLoading(false);
    }
  }
  
  const OPTIONS = [
    {
      universal: true,
      title: 'Your categories',
      desc: 'Use your universal set, so every evaluation lines up the same way.',
    },
    {
      universal: false,
      title: 'Custom profile',
      desc: "Build categories just for this student. You'll add them right after.",
    },
  ];

  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <Link
          href="/psych/dashboard"
          className="group mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-psych"
        >
          <svg className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Dashboard
        </Link>

        <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">New evaluation</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-[-0.02em] text-foreground">Set up a profile.</h1>
        <p className="mt-2 text-sm text-muted-foreground">A student, a grade, and the areas you&apos;ll score.</p>

        <form onSubmit={handleCreate} className="mt-9 space-y-7">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Student name</label>
            <Input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="e.g., Jordan Vega" autoFocus required />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Grade level</label>
            <div className="flex flex-wrap gap-1.5">
              {GRADES.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGradeLevel(g)}
                  className={`h-9 min-w-9 rounded-lg border px-2.5 text-sm font-medium transition-colors ${
                    gradeLevel === g
                      ? 'border-psych bg-psych text-psych-foreground'
                      : 'border-border bg-card text-muted-foreground hover:border-psych/40 hover:text-foreground'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-3 block text-sm font-medium text-foreground">Assessment categories</label>
            <div className="grid gap-3 sm:grid-cols-2">
              {OPTIONS.map((opt) => {
                const selected = useUniversal === opt.universal;
                return (
                  <button
                    key={opt.title}
                    type="button"
                    onClick={() => setUseUniversal(opt.universal)}
                    className={`relative rounded-xl border p-4 text-left transition-all ${
                      selected ? 'border-psych bg-psych/5 shadow-sm' : 'border-border bg-card hover:border-psych/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className={`font-semibold ${selected ? 'text-psych' : 'text-foreground'}`}>{opt.title}</p>
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${
                          selected ? 'border-psych bg-psych text-psych-foreground' : 'border-border'
                        }`}
                      >
                        {selected && (
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {useUniversal ? (
                <>
                  Uses your universal categories.{' '}
                  <Link href="/psych/universal-categories" className="font-medium text-psych underline-offset-2 hover:underline">
                    Edit them
                  </Link>
                  .
                </>
              ) : (
                "You'll add categories from the Configure button once it's created."
              )}
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Creating…' : 'Create evaluation'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
