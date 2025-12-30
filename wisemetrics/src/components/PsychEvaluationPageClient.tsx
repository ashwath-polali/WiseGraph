'use client';

import { useState, createContext, useContext } from 'react';
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
  return (
    <div className="flex gap-2">
      <button
        onClick={() => setViewMode('polar')}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          viewMode === 'polar'
            ? 'bg-sky-500 text-white'
            : 'bg-slate-800 text-slate-400 hover:text-slate-300'
        }`}
      >
        Polar
      </button>
      <button
        onClick={() => setViewMode('bell')}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          viewMode === 'bell'
            ? 'bg-sky-500 text-white'
            : 'bg-slate-800 text-slate-400 hover:text-slate-300'
        }`}
      >
        Bell Curve
      </button>
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
    <Card className="border border-slate-800/80 bg-gradient-to-br from-slate-900/80 to-slate-950/90 backdrop-blur-sm shadow-2xl overflow-hidden">
      <div className="p-6 border-b border-slate-800/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-50 flex items-center gap-2">
                <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Performance Profile
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Standard score visualization across all assessment areas
              </p>
            </div>
            
            {/* Comparison Toggle - INSIDE the card header */}
            <div className="pl-4 border-l border-slate-700">
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
