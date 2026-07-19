"use client";

import { useEffect, useState } from "react";
import { animate, motion } from "motion/react";
import type { StudentScoreSummary } from "@/types/scores";
import { SCORE_MIN } from "./geometry";

export type ViewMode = "average" | "students" | "compare";

const MODE_LABELS: Record<ViewMode, string> = {
  average: "Class avg",
  students: "Dots",
  compare: "Compare",
};

export function ViewModeToggle({
  viewMode,
  setViewMode,
  hints,
  pillId,
}: {
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;
  hints: Record<ViewMode, string>;
  pillId: string;
}) {
  const modes: ViewMode[] = ["average", "students", "compare"];

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="inline-flex rounded-lg bg-muted p-0.5">
        {modes.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setViewMode(m)}
            className={
              "relative rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors duration-150 " +
              (viewMode === m
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground")
            }
          >
            {viewMode === m && (
              <motion.span
                layoutId={pillId}
                className="absolute inset-0 rounded-md bg-card shadow-sm"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10">{MODE_LABELS[m]}</span>
          </button>
        ))}
      </div>
      <span className="text-[11px] text-muted-foreground">
        {hints[viewMode]}
      </span>
    </div>
  );
}

export function StudentPicker({
  students,
  selectedStudentId,
  setSelectedStudentId,
}: {
  students: StudentScoreSummary[];
  selectedStudentId: string | null;
  setSelectedStudentId: (id: string | null) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="text-[10px] font-medium tracking-[0.14em] uppercase">
        Student
      </span>
      <div className="relative">
        <select
          className="h-8 appearance-none rounded-lg border border-input bg-card pr-7 pl-2.5 text-xs text-foreground transition-colors outline-none hover:border-ring/50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25"
          value={selectedStudentId ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            setSelectedStudentId(v === "" ? null : v);
          }}
        >
          <option value="">Select…</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute top-1/2 right-2 h-3 w-3 -translate-y-1/2 text-muted-foreground"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M3 4.5 6 7.5 9 4.5" />
        </svg>
      </div>
    </label>
  );
}

export function BackToCategoriesButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-[11px] font-medium text-muted-foreground transition-colors duration-150 hover:border-ring/50 hover:text-foreground"
    >
      <svg
        className="h-3 w-3"
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M7.5 3 4.5 6l3 3" />
      </svg>
      All categories
    </button>
  );
}

/**
 * Counts a score up from the bottom of the scale to its value on mount.
 * Ease-out, so the last few points land slowly — reads like a dial settling.
 */
export function useCountUp(target: number, duration = 0.7): number {
  const [val, setVal] = useState(SCORE_MIN);

  useEffect(() => {
    const controls = animate(SCORE_MIN, target, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setVal(Math.round(v)),
    });
    return () => controls.stop();
  }, [target, duration]);

  return val;
}
