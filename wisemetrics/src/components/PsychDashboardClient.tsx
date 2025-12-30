'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

type Evaluation = {
  id: string;
  name: string;
  subject: string;
  gradeLevel: string;
  createdAt: string;
  student: {
    id: string;
    name: string;
    gradeLevel: string;
    overallScore: number;
  } | null;
  categoryCount: number;
};

interface Props {
  evaluations: Evaluation[];
}

export function PsychDashboardClient({ evaluations: initialEvaluations }: Props) {
  const router = useRouter();
  const [evaluations, setEvaluations] = useState(initialEvaluations);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  async function handleDelete(id: string, studentName: string) {
    if (!confirm(`Are you sure you want to delete the evaluation for ${studentName}? This cannot be undone.`)) {
      return;
    }
    
    setDeletingId(id);
    
    try {
      const res = await fetch('/api/classes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      
      if (!res.ok) throw new Error('Failed to delete evaluation');
      
      setEvaluations(evaluations.filter((e) => e.id !== id));
      router.refresh();
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete evaluation. Please try again.');
    } finally {
      setDeletingId(null);
    }
  }
  
  return (
    <Card className="p-4">
      <div className="space-y-2">
        {evaluations.map((evaluation) => {
          const student = evaluation.student;
          const createdDate = new Date(evaluation.createdAt);
          const isRecent = Date.now() - createdDate.getTime() < 7 * 24 * 60 * 60 * 1000;
          
          return (
            <Link
              key={evaluation.id}
              href={`/psych/evaluations/${evaluation.id}`}
              className="block"
            >
              <div className="group flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800/50 transition-colors border border-transparent hover:border-sky-500/50">
                {/* Student Name & Subject */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-slate-50 truncate group-hover:text-sky-400 transition-colors">
                      {student?.name || 'Unnamed Student'}
                    </h3>
                    {isRecent && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded flex-shrink-0">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {evaluation.subject}
                  </p>
                </div>

                {/* Quick Stats */}
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <div className="text-right">
                    <p className="text-slate-500">Grade</p>
                    <p className="font-semibold text-slate-50">{student?.gradeLevel || evaluation.gradeLevel}</p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-slate-500">Overall</p>
                    <p className="font-semibold text-slate-50">{student?.overallScore || '—'}</p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-slate-500">Categories</p>
                    <p className="font-semibold text-slate-50">{evaluation.categoryCount}</p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-slate-500">Created</p>
                    <p className="font-semibold text-slate-50">{createdDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                  </div>
                </div>

                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(evaluation.id, student?.name || 'this evaluation');
                  }}
                  disabled={deletingId === evaluation.id}
                  className="flex-shrink-0 p-1.5 rounded hover:bg-red-900/20 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Delete evaluation"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
