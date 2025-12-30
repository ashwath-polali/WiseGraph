"use client";

import { useState, createContext, useContext } from "react";
import type { ClassScoreSummary } from "@/types/scores";
import { Card } from "@/components/ui/Card";
import { PolarStudentChart } from "@/components/charts/PolarStudentChart";
import { EnhancedBellCurveChart } from "@/components/charts/EnhancedBellCurveChart";
import { ComparisonToggle } from "@/components/ComparisonToggle";

type ViewMode = "polar" | "bell";

type ViewModeContextType = {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  comparisonSnapshotId: string | null;
  setComparisonSnapshotId: (id: string | null) => void;
};

const ViewModeContext = createContext<ViewModeContextType | null>(null);

export function useViewMode() {
  const ctx = useContext(ViewModeContext);
  if (!ctx) throw new Error("useViewMode must be used within PsychEvaluationProvider");
  return ctx;
}

// Export alias for convenience
export const usePsychEvaluation = useViewMode;

export function PsychEvaluationProvider({
  children,
  evaluation,
}: {
  children: React.ReactNode | ((context: ViewModeContextType) => React.ReactNode);
  evaluation: ClassScoreSummary;
}) {
  const [viewMode, setViewMode] = useState<ViewMode>("polar");
  const [comparisonSnapshotId, setComparisonSnapshotId] = useState<string | null>(null);

  const contextValue = { viewMode, setViewMode, comparisonSnapshotId, setComparisonSnapshotId };

  return (
    <ViewModeContext.Provider value={contextValue}>
      {typeof children === 'function' ? children(contextValue) : children}
    </ViewModeContext.Provider>
  );
}

// Export ViewModeToggle component - JUST THE VIEW MODE BUTTONS
export function ViewModeToggle() {
  const { viewMode, setViewMode } = useViewMode();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setViewMode("polar")}
        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
          viewMode === "polar"
            ? "bg-sky-500 text-white shadow-lg shadow-sky-500/50"
            : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-300"
        }`}
      >
        Polar
      </button>
      <button
        onClick={() => setViewMode("bell")}
        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
          viewMode === "bell"
            ? "bg-sky-500 text-white shadow-lg shadow-sky-500/50"
            : "bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-300"
        }`}
      >
        Bell Curve
      </button>
    </div>
  );
}

// Separate comparison toggle for header use
export function ComparisonToggleWrapper({ evaluationId }: { evaluationId: string }) {
  const { setComparisonSnapshotId } = useViewMode();
  
  return (
    <ComparisonToggle
      classId={evaluationId}
      onComparisonChange={(snapshotId) => setComparisonSnapshotId(snapshotId)}
    />
  );
}

export function ChartDisplay({
  evaluation,
}: {
  evaluation: ClassScoreSummary;
}) {
  const { viewMode, comparisonSnapshotId } = useViewMode();
  const [showFullNames, setShowFullNames] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {/* Main Chart */}
      <div className="h-[600px]">
        {viewMode === "polar" ? (
          <PolarStudentChart
            evaluation={evaluation}
            showFullNames={showFullNames}
            onToggleNames={() => setShowFullNames(!showFullNames)}
            onExpand={() => setIsExpanded(true)}
            comparisonSnapshotId={comparisonSnapshotId}
          />
        ) : (
          <EnhancedBellCurveChart
            cls={evaluation}
            viewMode="bell"
            onExpand={() => setIsExpanded(true)}
            comparisonSnapshotId={comparisonSnapshotId}
          />
        )}
      </div>

      {/* Expanded Modal - for both polar and bell curve */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setIsExpanded(false)}
        >
          <div
            className="relative h-[95vh] w-[95vw] rounded-2xl border border-slate-800/50 bg-slate-950/95 p-6 shadow-[0_20px_50px_rgba(8,_47,_73,_0.9)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setIsExpanded(false)}
              className="absolute right-6 top-6 z-10 rounded-lg bg-slate-900/90 p-2 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Much larger container - almost full screen */}
            <div className="h-full w-full">
              {viewMode === "polar" ? (
                <PolarStudentChart
                  evaluation={evaluation}
                  showFullNames={showFullNames}
                  onToggleNames={() => setShowFullNames(!showFullNames)}
                  comparisonSnapshotId={comparisonSnapshotId}
                />
              ) : (
                <EnhancedBellCurveChart 
                  cls={evaluation} 
                  viewMode="bell" 
                  comparisonSnapshotId={comparisonSnapshotId}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
