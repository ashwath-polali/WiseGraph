"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { PolarStudentChart } from "@/components/charts/PolarStudentChart";
import { EnhancedBellCurveChart } from "@/components/charts/EnhancedBellCurveChart";
import { Card } from "@/components/ui/Card";
import type { ClassScoreSummary } from "@/types/scores";

type ViewMode = 'polar' | 'bell';

type Props = {
  evaluation: ClassScoreSummary;
  viewMode: ViewMode;
};

export function PolarStudentChartWrapper({ evaluation, viewMode }: Props) {
  const [showFullNames, setShowFullNames] = useState(false);
  const [showExpanded, setShowExpanded] = useState(false);

  return (
    <>
      {/* Main Chart */}
      <div className="relative" style={{ height: "700px" }}>
        {viewMode === 'polar' ? (
          <PolarStudentChart
            evaluation={evaluation}
            showFullNames={showFullNames}
            onToggleNames={() => setShowFullNames(!showFullNames)}
            onExpand={() => setShowExpanded(true)}
          />
        ) : (
          <EnhancedBellCurveChart
            cls={evaluation}
            viewMode={viewMode}
            onExpand={() => setShowExpanded(true)}
          />
        )}
      </div>

      {/* Expanded Modal - for both polar and bell curve */}
      <AnimatePresence>
        {showExpanded && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
          <button
            onClick={() => setShowExpanded(false)}
            className="absolute top-8 right-8 z-10 rounded-xl border border-border bg-card p-3 text-muted-foreground shadow-sm backdrop-blur-sm transition-colors duration-150 hover:bg-accent hover:text-foreground"
          >
            <svg
              className="w-6 h-6"
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
          <div className="h-[95vh] w-[95vw]">
            <Card className="h-full overflow-hidden backdrop-blur-sm">
              <div className="h-full flex items-center justify-center p-4">
                <div style={{ width: "100%", height: "100%", maxWidth: "1400px", maxHeight: "1400px" }}>
                  {viewMode === 'polar' ? (
                    <PolarStudentChart
                      evaluation={evaluation}
                      showFullNames={showFullNames}
                      onToggleNames={() => setShowFullNames(!showFullNames)}
                      onExpand={() => {}}
                    />
                  ) : (
                    <EnhancedBellCurveChart
                      cls={evaluation}
                      viewMode={viewMode}
                      onExpand={() => {}}
                    />
                  )}
                </div>
              </div>
            </Card>
          </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
