"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { NumberTicker } from "@/components/ui/number-ticker";

const ENTER = [0.22, 1, 0.36, 1] as const;
const pct = (s: number) => Math.max(0, Math.min(100, ((s - 60) / 90) * 100));

function deltaClass(d: number) {
  if (d > 0) return "text-[color:var(--chart-2)]";
  if (d < 0) return "text-destructive";
  return "text-muted-foreground";
}
const sign = (d: number) => (d > 0 ? "+" : d < 0 ? "−" : "±");

export type GaugeSubskill = {
  id: string;
  name: string;
  studentScore: number;
  classScore: number;
  delta: number;
};
export type GaugeCategory = {
  id: string;
  name: string;
  studentScore: number;
  classScore: number;
  delta: number;
  subskills: GaugeSubskill[];
};

/**
 * A category as a premium gauge: where the student sits on the 60–150 scale,
 * the shaded 85–115 average band, the class-average tick, and the student's
 * marker + fill sliding into place. Subskills expand inline. This is the
 * "communicate the bands to a parent" panel Wiseman needs, made premium.
 */
export function CategoryGaugeCard({
  category,
  index,
}: {
  category: GaugeCategory;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const { name, studentScore, classScore, delta, subskills } = category;
  const p = pct(studentScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: ENTER, delay: index * 0.06 }}
      whileHover={{ y: -3 }}
      className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow duration-200 hover:shadow-[0_16px_40px_-20px_oklch(0.245_0.015_75/0.25)]"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="truncate text-sm font-semibold text-foreground">{name}</h3>
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-xl font-semibold text-foreground" data-numeric>
            <NumberTicker value={studentScore} />
          </span>
          <span className={`font-mono text-xs ${deltaClass(delta)}`} data-numeric>
            {sign(delta)}
            {Math.abs(delta)}
          </span>
        </div>
      </div>

      {/* the gauge */}
      <div className="relative mt-3.5 h-2.5 rounded-full bg-muted">
        {/* 85-115 average band */}
        <div
          className="absolute inset-y-0 rounded-full bg-foreground/[0.07]"
          style={{ left: `${pct(85)}%`, right: `${100 - pct(115)}%` }}
        />
        {/* fill to the student's score */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[color:var(--chart-1)] to-[color:var(--chart-2)]"
          initial={{ width: "0%" }}
          whileInView={{ width: `${p}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: ENTER, delay: index * 0.06 + 0.15 }}
        />
        {/* class-average tick */}
        <div
          className="absolute top-1/2 h-3.5 w-[2px] -translate-y-1/2 rounded-full bg-muted-foreground/70"
          style={{ left: `${pct(classScore)}%` }}
          title={`Class ${classScore}`}
        />
        {/* student marker */}
        <motion.div
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-[color:var(--chart-4)] shadow"
          initial={{ left: "0%", opacity: 0, scale: 0 }}
          whileInView={{ left: `${p}%`, opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: ENTER, delay: index * 0.06 + 0.15 }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between font-mono text-[10px] text-muted-foreground" data-numeric>
        <span>60</span>
        <span className="text-muted-foreground/80">class {classScore}</span>
        <span>150</span>
      </div>

      {subskills.length > 0 && (
        <div className="mt-3 border-t border-border/70 pt-2.5">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="text-[11px] font-medium text-primary transition-colors hover:text-primary/80"
          >
            {open ? "Hide" : "Show"} {subskills.length} subtest
            {subskills.length === 1 ? "" : "s"}
          </button>
          <motion.div
            initial={false}
            animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
            transition={{ duration: 0.25, ease: ENTER }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-1.5">
              {subskills.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="truncate text-muted-foreground">{s.name}</span>
                  <span className="flex shrink-0 items-baseline gap-1.5 font-mono" data-numeric>
                    <span className="text-foreground">{s.studentScore}</span>
                    <span className={deltaClass(s.delta)}>
                      {sign(s.delta)}
                      {Math.abs(s.delta)}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
