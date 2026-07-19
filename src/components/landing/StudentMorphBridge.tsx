"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import {
  POLAR_C,
  polarScoreToRadius,
  polarCatAngles,
  polarPointAt,
  domainColor,
  BELL_BASE_Y,
  bellMapX,
  bellCurveY,
} from "@/lib/instrumentGeometry";
import { DEMO_EVALUATION } from "@/lib/demoEvaluation";

const domains = DEMO_EVALUATION.students[0].categories;
const COUNT = domains.length;

// overlay coordinate space (matches the bell's native width so the end-state
// reads as the bell)
const VB_W = 1000;
const VB_H = 540;

// the radial arrangement, centered + scaled into the overlay
const PC_X = 500;
const PC_Y = 250;
const PF = 0.62;

function polarPos(i: number, score: number) {
  const { mid } = polarCatAngles(i, COUNT);
  const pt = polarPointAt(polarScoreToRadius(score), mid); // polar 600 space
  return { x: PC_X + (pt.x - POLAR_C) * PF, y: PC_Y + (pt.y - POLAR_C) * PF };
}
const bellPos = (score: number) => ({ x: bellMapX(score), y: bellCurveY(score) });

// the normal curve + area as static paths in overlay space
const curvePath = (() => {
  let d = "";
  for (let s = 60; s <= 150; s += 1.5) d += `${s === 60 ? "M" : "L"} ${bellMapX(s).toFixed(1)} ${bellCurveY(s).toFixed(1)} `;
  return d.trim();
})();
const areaPath = `${curvePath} L ${bellMapX(150).toFixed(1)} ${BELL_BASE_Y} L ${bellMapX(60).toFixed(1)} ${BELL_BASE_Y} Z`;
const RING_RADII = [70, 85, 100, 115, 130].map((s) => polarScoreToRadius(s) * PF);

function MorphDot({ progress, i, reduce }: { progress: MotionValue<number>; i: number; reduce: boolean }) {
  const d = domains[i];
  const color = domainColor(i);
  const start = polarPos(i, d.score);
  const end = bellPos(d.score);
  const lo = 0.16 + i * 0.03;
  const hi = 0.6 + i * 0.03;
  const cx = useTransform(progress, [lo, hi], [start.x, end.x]);
  const cy = useTransform(progress, [lo, hi], [start.y, end.y]);
  const ly = useTransform(cy, (v) => v - 13);

  if (reduce) {
    return (
      <g>
        <circle cx={end.x} cy={end.y} r={6} fill={color} stroke="var(--card)" strokeWidth={2} />
        <text x={end.x} y={end.y - 13} textAnchor="middle" className="font-mono" fontSize={13} fontWeight={700} fill={color} stroke="var(--background)" strokeWidth={2.4} paintOrder="stroke">
          {Math.round(d.score)}
        </text>
      </g>
    );
  }
  return (
    <g>
      <motion.circle cx={cx} cy={cy} r={6} fill={color} stroke="var(--card)" strokeWidth={2} />
      <motion.text x={cx} y={ly} textAnchor="middle" className="font-mono" fontSize={13} fontWeight={700} fill={color} stroke="var(--background)" strokeWidth={2.4} paintOrder="stroke">
        {Math.round(d.score)}
      </motion.text>
    </g>
  );
}

export function StudentMorphBridge() {
  const ref = useRef<HTMLDivElement>(null);
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    setReduce(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
  }, []);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  const gridOpacity = useTransform(scrollYProgress, [0, 0.34], [0.85, 0]);
  const areaOpacity = useTransform(scrollYProgress, [0.5, 0.95], [0, 0.5]);
  const curveLen = useTransform(scrollYProgress, [0.32, 0.9], [0, 1]);
  const captionO = useTransform(scrollYProgress, [0.05, 0.2, 0.85, 1], [0, 1, 1, 0]);

  return (
    <section ref={ref} className="relative h-[150vh]" aria-label="The same scores, on the curve">
      <div className="sticky top-14 flex h-[calc(100dvh-3.5rem)] flex-col items-center justify-center overflow-hidden">
        <div className="mb-2 border-y border-border/70 py-3 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Plate II</p>
          <h2 className="mt-1 font-display text-[clamp(1.9rem,3.4vw,3rem)] font-medium tracking-[-0.02em] text-foreground">
            The same scores, on the curve.
          </h2>
        </div>

        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full max-w-[1120px] overflow-visible">
          {/* radial ring grid — dissolves */}
          <motion.g style={{ opacity: reduce ? 0 : gridOpacity }}>
            {RING_RADII.map((r, i) => (
              <circle key={i} cx={PC_X} cy={PC_Y} r={r} fill="none" stroke="var(--border)" strokeWidth={0.8} strokeDasharray="2 6" />
            ))}
          </motion.g>

          {/* bell area + curve — flood + draw in underneath */}
          <motion.path d={areaPath} fill="var(--chart-2)" style={{ opacity: reduce ? 0.4 : areaOpacity }} />
          <line x1={bellMapX(60)} y1={BELL_BASE_Y} x2={bellMapX(150)} y2={BELL_BASE_Y} stroke="var(--border)" strokeWidth={1} />
          {reduce ? (
            <path d={curvePath} fill="none" stroke="var(--chart-2)" strokeWidth={2.4} strokeLinecap="round" />
          ) : (
            <motion.path d={curvePath} fill="none" stroke="var(--chart-2)" strokeWidth={2.4} strokeLinecap="round" style={{ pathLength: curveLen }} />
          )}

          {/* the six scores, flying from radial to curve */}
          {domains.map((d, i) => (
            <MorphDot key={d.id} progress={scrollYProgress} i={i} reduce={reduce} />
          ))}
        </svg>

        <motion.p style={{ opacity: reduce ? 1 : captionO }} className="mt-4 max-w-md px-6 text-center text-sm leading-relaxed text-muted-foreground">
          The shape of a child becomes their place in the population. Same six numbers, no cut.
        </motion.p>
      </div>
    </section>
  );
}
