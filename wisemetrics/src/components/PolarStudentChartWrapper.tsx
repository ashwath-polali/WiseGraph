"use client";

import { useState } from "react";
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
      {showExpanded && (
        <div className="fixed inset-0 z-50 bg-black/98 backdrop-blur-md flex items-center justify-center">
          <button
            onClick={() => setShowExpanded(false)}
            className="absolute top-8 right-8 p-3 rounded-xl bg-slate-900/80 border border-slate-700/50 text-slate-300 hover:text-white hover:border-slate-500 transition-all z-10 backdrop-blur-sm"
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
          <div className="w-[95vw] h-[95vh]">
            <Card className="h-full border border-slate-800/80 bg-gradient-to-br from-slate-900/95 to-slate-950/95 backdrop-blur-sm shadow-2xl overflow-hidden">
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
        </div>
      )}
    </>
  );
}
