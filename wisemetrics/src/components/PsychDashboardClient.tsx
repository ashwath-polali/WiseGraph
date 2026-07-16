'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { classify } from '@/lib/classification';

type Evaluation = {
  id: string;
  name: string;
  subject: string;
  gradeLevel: string;
  createdAt: string;
  student: { id: string; name: string; gradeLevel: string; overallScore: number } | null;
  categoryCount: number;
};

const EASE = [0.22, 1, 0.36, 1] as const;

/** overall score as a donut gauge, colored by classification band. */
function Gauge({ score }: { score: number | null }) {
  const s = score ?? 100;
  const band = classify(s);
  const R = 26;
  const CIRC = 2 * Math.PI * R;
  const frac = Math.max(0.04, Math.min(1, (s - 60) / 90));
  return (
    <svg viewBox="0 0 72 72" className="h-16 w-16 shrink-0">
      <circle cx={36} cy={36} r={R} fill="none" stroke="var(--border)" strokeWidth={5} />
      <motion.circle
        cx={36}
        cy={36}
        r={R}
        fill="none"
        stroke={band.color}
        strokeWidth={5}
        strokeLinecap="round"
        transform="rotate(-90 36 36)"
        strokeDasharray={CIRC}
        initial={{ strokeDashoffset: CIRC }}
        animate={{ strokeDashoffset: CIRC * (1 - frac) }}
        transition={{ duration: 0.9, ease: EASE }}
      />
      <text x={36} y={35} textAnchor="middle" dominantBaseline="central" className="font-mono" fontSize={17} fontWeight={600} fill="var(--foreground)">
        {score ?? '—'}
      </text>
      <text x={36} y={49} textAnchor="middle" dominantBaseline="central" fontSize={6.5} fontWeight={600} letterSpacing="0.12em" fill="var(--muted-foreground)">
        OVERALL
      </text>
    </svg>
  );
}

export function PsychDashboardClient({ evaluations: initialEvaluations }: { evaluations: Evaluation[] }) {
  const router = useRouter();
  const [evaluations, setEvaluations] = useState(initialEvaluations);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string, studentName: string) {
    if (!confirm(`Delete ${studentName}'s evaluation? Its scores and snapshots go with it, and this can't be undone.`)) return;
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {evaluations.map((evaluation, i) => {
        const student = evaluation.student;
        const created = new Date(evaluation.createdAt);
        const isRecent = Date.now() - created.getTime() < 7 * 24 * 60 * 60 * 1000;
        const band = student?.overallScore != null ? classify(student.overallScore) : null;
        return (
          <motion.div
            key={evaluation.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE, delay: i * 0.05 }}
          >
            <Link href={`/psych/evaluations/${evaluation.id}`} className="group block h-full">
              <div className="relative flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-psych/40 hover:shadow-lg">
                <div className="flex items-start gap-4">
                  <Gauge score={student?.overallScore ?? null} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-display text-lg font-semibold text-foreground transition-colors group-hover:text-psych">
                        {student?.name || 'Unnamed student'}
                      </h3>
                      {isRecent && <span className="shrink-0 rounded bg-psych/15 px-1.5 py-0.5 text-[10px] font-medium text-psych">New</span>}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{evaluation.subject}</p>
                    {band && (
                      <span
                        className="mt-2 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
                        style={{ color: band.color, backgroundColor: `color-mix(in srgb, ${band.color} 12%, transparent)` }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: band.color }} />
                        {band.label}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-5 border-t border-border pt-3 font-mono text-xs text-muted-foreground">
                  <span data-numeric>
                    Grade <span className="text-foreground">{student?.gradeLevel || evaluation.gradeLevel}</span>
                  </span>
                  <span data-numeric>
                    <span className="text-foreground">{evaluation.categoryCount}</span> areas
                  </span>
                  <span className="ml-auto">{created.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(evaluation.id, student?.name || 'this student');
                  }}
                  disabled={deletingId === evaluation.id}
                  title="Delete this evaluation"
                  className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 disabled:opacity-50"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </Link>
          </motion.div>
        );
      })}

      {/* quick-create card */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE, delay: evaluations.length * 0.05 }}
      >
        <Link href="/psych/new-evaluation" className="group block h-full">
          <div className="flex h-full min-h-[168px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border p-5 text-muted-foreground transition-all duration-200 hover:border-psych/50 hover:bg-psych/5 hover:text-psych">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-current transition-transform group-hover:scale-110">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-sm font-medium">New evaluation</span>
          </div>
        </Link>
      </motion.div>
    </div>
  );
}
