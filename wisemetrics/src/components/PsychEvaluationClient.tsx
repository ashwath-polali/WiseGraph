"use client";

import { useState, createContext, useContext, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import type { ClassScoreSummary } from "@/types/scores";
import dynamic from "next/dynamic";
import { ComparisonToggle } from "@/components/ComparisonToggle";

const PolarStudentChart = dynamic(
  () =>
    import("@/components/charts/student/StudentPolarInstrument").then(mod => ({
      default: mod.StudentPolarInstrument,
    })),
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
  selectedCategoryId: string | null;
  setSelectedCategoryId: (id: string | null) => void;
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
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    evaluation.categories[0]?.id ?? null,
  );

  const contextValue = {
    viewMode,
    setViewMode,
    comparisonSnapshotId,
    setComparisonSnapshotId,
    selectedCategoryId,
    setSelectedCategoryId,
  };

  return (
    <ViewModeContext.Provider value={contextValue}>
      {typeof children === "function" ? children(contextValue) : children}
    </ViewModeContext.Provider>
  );
}

export function ViewModeToggle() {
  const { viewMode, setViewMode } = useViewMode();

  const MODES: { id: ViewMode; label: string }[] = [
    { id: "polar", label: "Polar" },
    { id: "bell", label: "Bell Curve" },
  ];

  return (
    <div className="inline-flex rounded-lg bg-muted p-0.5">
      {MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => setViewMode(m.id)}
          className={
            "relative rounded-md px-3 py-1 text-xs font-medium transition-colors duration-150 " +
            (viewMode === m.id
              ? "text-psych-foreground"
              : "text-muted-foreground hover:text-foreground")
          }
        >
          {viewMode === m.id && (
            <motion.span
              layoutId="psych-view-mode-pill"
              className="absolute inset-0 rounded-md bg-psych shadow-sm"
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
            />
          )}
          <span className="relative z-10">{m.label}</span>
        </button>
      ))}
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
    let container = document.getElementById("chart-modal-root");

    if (!container) {
      container = document.createElement("div");
      container.id = "chart-modal-root";
      container.style.cssText =
        "position: fixed; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 999999;";
      document.body.appendChild(container);
    }

    setPortalRoot(container);

    return () => {
      if (container && container.childNodes.length === 0) {
        document.body.removeChild(container);
      }
    };
  }, []);

  // Handle escape key and body scroll
  useEffect(() => {
    if (!isExpanded) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsExpanded(false);
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isExpanded]);

  const modalContent = isExpanded && portalRoot ? (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "color-mix(in oklch, var(--foreground) 82%, transparent)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        zIndex: 999999,
        pointerEvents: "auto",
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
          position: "fixed",
          top: "1.5rem",
          right: "1.5rem",
          padding: "0.75rem",
          borderRadius: "0.75rem",
          backgroundColor: "var(--card)",
          color: "var(--card-foreground)",
          border: "1px solid var(--border)",
          cursor: "pointer",
          zIndex: 1000000,
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "var(--muted)";
          e.currentTarget.style.transform = "scale(1.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "var(--card)";
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        <svg
          style={{ width: "1.5rem", height: "1.5rem" }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Chart container - popup */}
      <div
        style={{
          width: "98vw",
          height: "96vh",
          borderRadius: "1rem",
          border: "2px solid var(--border)",
          backgroundColor: "var(--card)",
          boxShadow: "0 25px 50px -12px color-mix(in oklch, var(--foreground) 30%, transparent)",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              maxWidth: "2000px",
              maxHeight: "2000px",
            }}
          >
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
    </div>
  ) : null;

  return (
    <>
      {/* Main Chart - fills the hero box the page provides */}
      <div className="h-full w-full">
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

      {/* Portal the modal */}
      {portalRoot && modalContent && createPortal(modalContent, portalRoot)}
    </>
  );
}
