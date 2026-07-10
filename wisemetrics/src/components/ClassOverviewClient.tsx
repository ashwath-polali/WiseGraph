"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { ClassScoreSummary } from "@/types/scores";
import { Card } from "@/components/ui/Card";
import { ClassRadialChart } from "@/components/charts/class/ClassRadialChart";
import { ClassBellChart } from "@/components/charts/class/ClassBellChart";

type ChartMode = "radial" | "bell";

const MODES: { id: ChartMode; label: string }[] = [
  { id: "radial", label: "Radial" },
  { id: "bell", label: "Bell curve" },
];

export function ClassOverviewClient({ cls }: { cls: ClassScoreSummary }) {
  const [chartMode, setChartMode] = useState<ChartMode>("radial");

  return (
    <Card className="flex h-full flex-col overflow-hidden p-0">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Class overview
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {chartMode === "radial"
              ? "Category averages, drawn out from the center."
              : "Where the class sits on the 60–150 curve."}
          </p>
        </div>
        <div className="inline-flex rounded-lg bg-muted p-0.5">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setChartMode(m.id)}
              className={
                "relative rounded-md px-3 py-1 text-[11px] font-medium transition-colors duration-150 " +
                (chartMode === m.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              {chartMode === m.id && (
                <motion.span
                  layoutId="chart-mode-pill"
                  className="absolute inset-0 rounded-md bg-card shadow-sm"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative z-10">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-[520px] flex-1 p-5">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={chartMode}
            className="h-full"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            {chartMode === "radial" ? (
              <ClassRadialChart cls={cls} />
            ) : (
              <ClassBellChart cls={cls} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </Card>
  );
}
