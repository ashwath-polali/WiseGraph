"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { AnimatedScore } from "@/components/AnimatedScore";

const ENTER = [0.22, 1, 0.36, 1] as const;

type RosterStudent = {
  id: string;
  name: string;
  gradeLevel: string | number;
  overallScore: number;
};

export function RosterList({
  students,
  classId,
}: {
  students: RosterStudent[];
  classId: string;
}) {
  return (
    <ul className="divide-y divide-border/70">
      {students.map((student, i) => (
        <motion.li
          key={student.id}
          className="group"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.28,
            ease: ENTER,
            delay: Math.min(i * 0.035, 0.5),
          }}
        >
          <div className="flex items-center justify-between gap-2 px-5 py-2.5 transition-colors duration-150 group-hover:bg-accent/40">
            <div className="flex min-w-0 items-center gap-1.5">
              <Link
                href={`/dashboard/students/${student.id}?classId=${encodeURIComponent(
                  classId,
                )}`}
                className="min-w-0"
              >
                <div className="min-w-0 transition-transform duration-150 group-hover:translate-x-0.5">
                  <p className="truncate text-[13px] font-medium text-foreground">
                    {student.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Grade {student.gradeLevel}
                  </p>
                </div>
              </Link>
              <Link
                href={`/dashboard/students/${student.id}/edit-scores`}
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity duration-150 group-hover:opacity-100 hover:bg-muted hover:text-foreground focus-visible:opacity-100"
                aria-label={`Edit scores for ${student.name}`}
              >
                <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden="true">
                  <path
                    d="M11.8 2.2a1 1 0 0 1 1.4 1.4l-7.2 7.2L4 11.5l.7-2.1 7.1-7.2zM3 6.5v6h6l2-2H5a1 1 0 0 1-1-1V6.5z"
                    fill="currentColor"
                  />
                </svg>
              </Link>
            </div>
            <span className="shrink-0 rounded-md border border-border bg-muted/60 px-2 py-0.5 font-mono text-xs font-medium text-foreground tabular-nums transition-colors duration-150 group-hover:border-primary/40">
              <AnimatedScore value={student.overallScore} delay={Math.min(i * 0.035, 0.5)} />
            </span>
          </div>
        </motion.li>
      ))}
    </ul>
  );
}
