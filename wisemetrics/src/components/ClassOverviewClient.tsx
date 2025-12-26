// src/components/ClassOverviewClient.tsx
"use client";

import { useState } from "react";
import type { ClassScoreSummary } from "@/types/scores";
import { Card } from "@/components/ui/Card";
import { ClassExplodingRadialChart } from "@/components/charts/ClassExplodingRadialChart";
import { ClassBellCurveChart } from "@/components/charts/ClassBellCurveChart";

export function ClassOverviewClient({ cls }: { cls: ClassScoreSummary }) {
  const [chartMode, setChartMode] = useState<"radial" | "bell">("radial");

  return (
    <Card className="p-6">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">
            Class overview
          </h2>
          <p className="text-[11px] text-slate-500">
            Switch between radial wedges and bell curve for this class.
          </p>
        </div>
        <div className="inline-flex rounded-full border border-slate-700/80 bg-slate-900/80 p-0.5">
          <button
            type="button"
            onClick={() => setChartMode("radial")}
            className={
              "rounded-full px-3 py-1 text-[10px] font-medium transition-all " +
              (chartMode === "radial"
                ? "bg-sky-400 text-slate-950"
                : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-100")
            }
          >
            Radial
          </button>
          <button
            type="button"
            onClick={() => setChartMode("bell")}
            className={
              "rounded-full px-3 py-1 text-[10px] font-medium transition-all " +
              (chartMode === "bell"
                ? "bg-sky-400 text-slate-950"
                : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-100")
            }
          >
            Bell curve
          </button>
        </div>
      </div>
      <div className="h-[620px]">
        {chartMode === "radial" ? (
          <ClassExplodingRadialChart cls={cls} />
        ) : (
          <ClassBellCurveChart cls={cls} />
        )}
      </div>
    </Card>
  );
}
