'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

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
  
  return (
    <div className="max-w-2xl mx-auto px-6 py-6">
      <Card className="p-8">
        <h1 className="font-display text-2xl font-bold text-foreground mb-1">New evaluation</h1>
        <p className="text-sm text-muted-foreground mb-6">Set up a student and their assessment categories.</p>

        <form onSubmit={handleCreate} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Student name *
            </label>
            <Input
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="e.g., John Doe"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Grade level *
            </label>
            <Input
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              placeholder="e.g., 9"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Assessment categories
            </label>

            <div className="space-y-3">
              {/* Your Categories */}
              <label className="group block cursor-pointer">
                <div className="relative p-4 rounded-lg border-2 border-border hover:border-psych transition-colors bg-muted/40 hover:bg-muted/70">
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="type"
                      checked={useUniversal}
                      onChange={() => setUseUniversal(true)}
                      className="w-4 h-4 mt-1 flex-shrink-0 accent-psych"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-foreground group-hover:text-psych transition-colors">
                        Your categories
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Use your universal set, so every evaluation lines up the same way.
                      </p>
                    </div>
                    <svg className="w-5 h-5 text-psych/0 group-hover:text-psych transition-colors flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                  </div>
                </div>
              </label>

              {/* Custom Profile */}
              <label className="group block cursor-pointer">
                <div className="relative p-4 rounded-lg border-2 border-border hover:border-primary transition-colors bg-muted/40 hover:bg-muted/70">
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="type"
                      checked={!useUniversal}
                      onChange={() => setUseUniversal(false)}
                      className="w-4 h-4 mt-1 flex-shrink-0 accent-primary"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        Custom profile
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Build categories just for this student. You'll add them after this step.
                      </p>
                    </div>
                    <svg className="w-5 h-5 text-primary/0 group-hover:text-primary transition-colors flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {useUniversal && (
            <div className="p-3 bg-psych/10 border border-psych/30 rounded-lg">
              <p className="text-sm text-psych">
                This uses your universal categories.{' '}
                <Link href="/psych/universal-categories" className="underline hover:opacity-80 font-semibold">
                  Edit categories
                </Link>
              </p>
            </div>
          )}

          {!useUniversal && (
            <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
              <p className="text-sm text-primary">
                Once this is created, you'll add categories from the Configure button.
              </p>
            </div>
          )}

          {error && (
            <div className="text-destructive text-sm bg-destructive/10 border border-destructive/30 rounded-lg p-3">
              {error}
            </div>
          )}
          
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Creating…' : 'Create evaluation'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
