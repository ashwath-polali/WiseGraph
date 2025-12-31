"use client";

import { useState, createContext, useContext, useEffect } from "react";
import { createPortal } from "react-dom";
import type { ClassScoreSummary } from "@/types/scores";
import dynamic from "next/dynamic";
import { ComparisonToggle } from "@/components/ComparisonToggle";

const PolarStudentChart = dynamic(
  () => import("@/components/charts/PolarStudentChart").then(mod => ({ default: mod.PolarStudentChart })),
  { ssr: false }
);

const EnhancedBellCurveChart = dynamic(
  () => import("@/components/charts/EnhancedBellCurveChart").then(mod => ({ default: mod.EnhancedBellCurveChart })),
  { ssr: false }
);

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
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  // Create portal container on mount
  useEffect(() => {
    let container = document.getElementById('chart-modal-root');
    
    if (!container) {
      container = document.createElement('div');
      container.id = 'chart-modal-root';
      container.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 999999;';
      document.body.appendChild(container);
    }
    
    setPortalRoot(container);
    
    return () => {
      // Cleanup on unmount
      if (container && container.childNodes.length === 0) {
        document.body.removeChild(container);
      }
    };
  }, []);

  // Handle escape key and body scroll
  useEffect(() => {
    if (!isExpanded) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsExpanded(false);
    };
    
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isExpanded]);

  const modalContent = isExpanded && portalRoot ? (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        zIndex: 999999,
        pointerEvents: 'auto',
      }}
      onClick={() => setIsExpanded(false)}
    >
      {/* Close button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(false);
        }}
        style={{
          position: 'fixed',
          top: '2rem',
          right: '2rem',
          padding: '1rem',
          borderRadius: '0.75rem',
          backgroundColor: 'rgba(30, 41, 59, 0.9)',
          color: 'rgb(203, 213, 225)',
          border: '1px solid rgb(71, 85, 105)',
          cursor: 'pointer',
          zIndex: 1000000,
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgb(51, 65, 85)';
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.9)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <svg
          style={{ width: '2rem', height: '2rem' }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Chart container */}
      <div
        style={{
          width: '94vw',
          height: '88vh',
          borderRadius: '1rem',
          border: '2px solid rgb(71, 85, 105)',
          backgroundColor: 'rgb(2, 6, 23)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ height: '100%', width: '100%', padding: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
  ) : null;

  return (
    <>
      {/* Main Chart */}
      <div className="h-[600px]">
        {viewMode === "polar" ? (
          <PolarStudentChart
            evaluation={evaluation}
            showFullNames={showFullNames}
            onToggleNames={() => setShowFullNames(!showFullNames)}
            onExpand={() => {
              console.log('EXPAND CLICKED'); // DEBUG
              setIsExpanded(true);
            }}
            comparisonSnapshotId={comparisonSnapshotId}
          />
        ) : (
          <EnhancedBellCurveChart
            cls={evaluation}
            viewMode="bell"
            onExpand={() => {
              console.log('EXPAND CLICKED'); // DEBUG
              setIsExpanded(true);
            }}
            comparisonSnapshotId={comparisonSnapshotId}
          />
        )}
      </div>

      {/* Portal the modal */}
      {portalRoot && modalContent && createPortal(modalContent, portalRoot)}
    </>
  );
}
