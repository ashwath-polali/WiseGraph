"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { classify } from "@/lib/classification";

const ENTER = [0.22, 1, 0.36, 1] as const;

type RosterStudent = {
  id: string;
  name: string;
  gradeLevel: string | number;
  overallScore: number;
};

function MiniGauge({ score }: { score: number }) {
  const band = classify(score);
  const R = 17;
  const CIRC = 2 * Math.PI * R;
  const frac = Math.max(0.04, Math.min(1, (score - 60) / 90));
  return (
    <svg viewBox="0 0 48 48" className="h-11 w-11 shrink-0">
      <circle cx={24} cy={24} r={R} fill="none" stroke="var(--border)" strokeWidth={4} />
      <motion.circle
        cx={24}
        cy={24}
        r={R}
        fill="none"
        stroke={band.color}
        strokeWidth={4}
        strokeLinecap="round"
        transform="rotate(-90 24 24)"
        strokeDasharray={CIRC}
        initial={{ strokeDashoffset: CIRC }}
        animate={{ strokeDashoffset: CIRC * (1 - frac) }}
        transition={{ duration: 0.8, ease: ENTER }}
      />
      <text x={24} y={25} textAnchor="middle" dominantBaseline="central" className="font-mono" fontSize={13} fontWeight={600} fill="var(--foreground)">
        {score}
      </text>
    </svg>
  );
}

export function RosterList({ students, classId }: { students: RosterStudent[]; classId: string }) {
  return (
    <ul className="space-y-2 p-3">
      {students.map((student, i) => {
        const band = classify(student.overallScore);
        return (
          <motion.li
            key={student.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: ENTER, delay: Math.min(i * 0.04, 0.4) }}
          >
            <div className="group relative flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm">
              <Link
                href={`/dashboard/students/${student.id}?classId=${encodeURIComponent(classId)}`}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                <MiniGauge score={student.overallScore} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                    {student.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Grade {student.gradeLevel}</p>
                  <span
                    className="mt-1 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                    style={{ color: band.color, backgroundColor: `color-mix(in srgb, ${band.color} 12%, transparent)` }}
                  >
                    <span className="h-1 w-1 rounded-full" style={{ backgroundColor: band.color }} />
                    {band.label}
                  </span>
                </div>
              </Link>
              <Link
                href={`/dashboard/students/${student.id}/edit-scores`}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity duration-150 hover:bg-muted hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
                aria-label={`Edit scores for ${student.name}`}
              >
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
                  <path d="M11.8 2.2a1 1 0 0 1 1.4 1.4l-7.2 7.2L4 11.5l.7-2.1 7.1-7.2zM3 6.5v6h6l2-2H5a1 1 0 0 1-1-1V6.5z" fill="currentColor" />
                </svg>
              </Link>
            </div>
          </motion.li>
        );
      })}
    </ul>
  );
}
