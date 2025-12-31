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
      setError('Student name is required');
      setLoading(false);
      return;
    }
    
    if (!gradeLevel.trim()) {
      setError('Grade level is required');
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
          throw new Error('No universal categories defined. Please configure them first.');
        }
        const templateData = await templateRes.json();
        if (!templateData.categories || templateData.categories.length === 0) {
          throw new Error('No universal categories defined. Please configure them first.');
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
        throw new Error(errData.error || 'Failed to create evaluation');
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
      setError(err.message || 'Failed to create evaluation');
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
        <h1 className="text-2xl font-bold text-slate-50 mb-1">New Evaluation</h1>
        <p className="text-sm text-slate-400 mb-6">Create a psychoeducational assessment</p>
        
        <form onSubmit={handleCreate} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Student Name *
            </label>
            <Input
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="e.g., John Doe"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Grade Level *
            </label>
            <Input
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              placeholder="e.g., 9"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Assessment Categories
            </label>
            
            <div className="space-y-3">
              {/* Your Categories */}
              <label className="group block cursor-pointer">
                <div className="relative p-4 rounded-lg border-2 border-slate-700 hover:border-sky-500 transition-colors bg-slate-800/30 hover:bg-slate-800/50">
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="type"
                      checked={useUniversal}
                      onChange={() => setUseUniversal(true)}
                      className="w-4 h-4 mt-1 flex-shrink-0"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-50 group-hover:text-sky-400 transition-colors">
                        Your Categories
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Use your configured universal framework. Quick and consistent.
                      </p>
                    </div>
                    <svg className="w-5 h-5 text-sky-500/0 group-hover:text-sky-500 transition-colors flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                  </div>
                </div>
              </label>

              {/* Custom Profile */}
              <label className="group block cursor-pointer">
                <div className="relative p-4 rounded-lg border-2 border-slate-700 hover:border-amber-500 transition-colors bg-slate-800/30 hover:bg-slate-800/50">
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="type"
                      checked={!useUniversal}
                      onChange={() => setUseUniversal(false)}
                      className="w-4 h-4 mt-1 flex-shrink-0"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-50 group-hover:text-amber-400 transition-colors">
                        Custom Profile
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Build a unique assessment. Add categories after creation.
                      </p>
                    </div>
                    <svg className="w-5 h-5 text-amber-500/0 group-hover:text-amber-500 transition-colors flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {useUniversal && (
            <div className="p-3 bg-sky-900/20 border border-sky-800 rounded-lg">
              <p className="text-sm text-sky-400">
                Using your universal framework.{' '}
                <Link href="/psych/universal-categories" className="underline hover:text-sky-300 font-semibold">
                  Edit categories
                </Link>
              </p>
            </div>
          )}

          {!useUniversal && (
            <div className="p-3 bg-amber-900/20 border border-amber-800 rounded-lg">
              <p className="text-sm text-amber-400">
                You'll configure categories after creation via the Configure button.
              </p>
            </div>
          )}
          
          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg p-3">
              {error}
            </div>
          )}
          
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Creating...' : 'Create Evaluation'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
