'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
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
    if (!confirm(`Delete ${studentName}'s evaluation? Its scores and snapshots go with it, and this can't be undone.`)) {
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
      alert("We couldn't delete that evaluation. Try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Card className="p-4">
      <div className="space-y-2">
        {evaluations.map((evaluation, i) => {
          const student = evaluation.student;
          const createdDate = new Date(evaluation.createdAt);
          const isRecent = Date.now() - createdDate.getTime() < 7 * 24 * 60 * 60 * 1000;

          return (
            <motion.div
              key={evaluation.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1], delay: i * 0.03 }}
            >
              <Link
                href={`/psych/evaluations/${evaluation.id}`}
                className="block"
              >
                <div className="group flex items-center gap-3 p-3 rounded-lg border border-transparent transition-colors duration-150 hover:bg-accent/40 hover:border-psych/40">
                  {/* Student Name & Subject */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-foreground truncate transition-colors group-hover:text-psych">
                        {student?.name || 'Unnamed student'}
                      </h3>
                      {isRecent && (
                        <span className="text-[10px] bg-psych/15 text-psych px-1.5 py-0.5 rounded flex-shrink-0">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {evaluation.subject}
                    </p>
                  </div>

                  {/* Quick Stats */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="text-right">
                      <p className="text-muted-foreground">Grade</p>
                      <p className="font-semibold text-foreground">{student?.gradeLevel || evaluation.gradeLevel}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-muted-foreground">Overall</p>
                      <p className="font-semibold text-foreground font-mono" data-numeric>{student?.overallScore || '—'}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-muted-foreground">Categories</p>
                      <p className="font-semibold text-foreground font-mono" data-numeric>{evaluation.categoryCount}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-muted-foreground">Created</p>
                      <p className="font-semibold text-foreground">{createdDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon-sm"
                    onClick={(e) => {
                      e.preventDefault();
                      handleDelete(evaluation.id, student?.name || 'this student');
                    }}
                    disabled={deletingId === evaluation.id}
                    className="flex-shrink-0"
                    title="Delete this evaluation"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}
