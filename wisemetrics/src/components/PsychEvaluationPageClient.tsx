'use client';

import { useState, createContext, useContext } from 'react';
import { motion } from 'motion/react';
import type { ClassScoreSummary } from '@/types/scores';
import { Card } from '@/components/ui/Card';
import { PolarStudentChart } from '@/components/charts/PolarStudentChart';
import { EnhancedBellCurveChart } from '@/components/charts/EnhancedBellCurveChart';
import { ComparisonToggle } from '@/components/ComparisonToggle';

type ViewMode = 'polar' | 'bell';

type ViewModeContextType = {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
};

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export function useViewMode() {
  const ctx = useContext(ViewModeContext);
  if (!ctx) throw new Error('useViewMode must be used within PsychEvaluationProvider');
  return ctx;
}

export function PsychEvaluationProvider({ children }: { children: React.ReactNode }) {
  const [viewMode, setViewMode] = useState<ViewMode>('polar');
  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function ViewModeToggle() {
  const { viewMode, setViewMode } = useViewMode();

  const MODES: { id: ViewMode; label: string }[] = [
    { id: 'polar', label: 'Polar' },
    { id: 'bell', label: 'Bell Curve' },
  ];

  return (
    <div className="inline-flex rounded-lg bg-muted p-0.5">
      {MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => setViewMode(m.id)}
          className={
            'relative rounded-md px-3 py-1 text-sm font-medium transition-colors duration-150 ' +
            (viewMode === m.id
              ? 'text-psych-foreground'
              : 'text-muted-foreground hover:text-foreground')
          }
        >
          {viewMode === m.id && (
            <motion.span
              layoutId="psych-page-view-mode-pill"
              className="absolute inset-0 rounded-md bg-psych shadow-sm"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <span className="relative z-10">{m.label}</span>
        </button>
      ))}
    </div>
  );
}

interface ChartDisplayProps {
  evaluation: ClassScoreSummary;
  evaluationId: string;
}

export function ChartDisplay({ evaluation, evaluationId }: ChartDisplayProps) {
  const { viewMode } = useViewMode();
  
  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
                <svg className="w-5 h-5 text-psych" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Performance profile
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Standard scores across every assessment area, on one chart.
              </p>
            </div>

            {/* Comparison Toggle - INSIDE the card header */}
            <div className="pl-4 border-l border-border">
              <ComparisonToggle psychStudentId={evaluationId} />
            </div>
          </div>

          {/* View Mode Toggle */}
          <ViewModeToggle />
        </div>
      </div>

      <div className="p-8" id="chart-container">
        {viewMode === 'polar' ? (
          <PolarStudentChart evaluation={evaluation} />
        ) : (
          <EnhancedBellCurveChart cls={evaluation} />
        )}
      </div>
    </Card>
  );
}
