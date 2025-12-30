'use client';

import { useState, createContext, useContext } from 'react';
import type { ClassScoreSummary } from '@/types/scores';

type ViewMode = 'polar' | 'bell';

type ViewModeContextType = {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
};

const ViewModeContext = createContext<ViewModeContextType | null>(null);

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (!context) throw new Error('useViewMode must be used within PsychEvaluationProvider');
  return context;
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
    <div className="flex items-center gap-2">
      <button
        onClick={() => setViewMode('polar')}
        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
          viewMode === 'polar'
            ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
        }`}
      >
        Polar View
      </button>
      <button
        onClick={() => setViewMode('bell')}
        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
          viewMode === 'bell'
            ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
        }`}
      >
        Bell Curve
      </button>
    </div>
  );
}

export function ChartDisplay({ evaluation }: { evaluation: ClassScoreSummary }) {
  const { viewMode } = useViewMode();
  const { PolarStudentChartWrapper } = require('@/components/PolarStudentChartWrapper');
  
  return <PolarStudentChartWrapper evaluation={evaluation} viewMode={viewMode} />;
}
