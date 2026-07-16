"use client";

import { useEffect, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useTransform,
} from "motion/react";
import {
  RING_SCORES,
  SCORE_MIN,
  bandAngles,
  categoryAngles,
  polarPoint,
  radiusForScore,
  wedgePath,
} from "@/components/charts/class/geometry";
import { wedgeColor } from "@/components/charts/class/palette";

const SIZE = 460;
const C = SIZE / 2;
const OUTER = 178;
const LABEL_R = OUTER + 26;
const ENTER = [0.22, 1, 0.36, 1] as const;
const n2 = (v: number) => Math.round(v * 100) / 100;

export type PremiumSubtest = { id: string; name: string; score: number };
export type PremiumCategory = {
  id: string;
  name: string;
  score: number;
  subtests: PremiumSubtest[];
};

/**
 * Wiseman's core chart, done premium. Outer ring = overall score; each category
 * is a gradient-glow wedge grown from the hub at its score; inside each wedge a
 * subtest polyline draws on, anchored to the category arc at both ends (his
 * 5-point rule: [category] → subs → [category]). Light = crisp premium; dark =
 * full bloom. Pure SVG, so it prints and exports.
 */
export function StudentPolarPremium({
  categories,
  overallScore,
  svgRef,
}: {
  categories: PremiumCategory[];
  overallScore: number;
  svgRef?: React.Ref<SVGSVGElement>;
}) {
  const n = Math.max(categories.length, 1);
  const [hover, setHover] = useState<number | null>(null);

  return (
    <div className="relative h-full w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="h-full w-full overflow-visible"
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          {categories.map((_, i) => {
            const c = wedgeColor(i);
            return (
              <radialGradient
                key={i}
                id={`spp-wg-${i}`}
                gradientUnits="userSpaceOnUse"
                cx={C}
                cy={C}
                r={OUTER}
              >
                <stop offset="0%" stopColor={c} stopOpacity={0.55} />
                <stop offset="60%" stopColor={c} stopOpacity={0.24} />
                <stop offset="100%" stopColor={c} stopOpacity={0.08} />
              </radialGradient>
            );
          })}
          {/* dual-radius soft bloom: tight core + wide halo, crisp source on top */}
          <filter id="spp-bloom" x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="g1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="g2" />
            <feMerge>
              <feMergeNode in="g2" />
              <feMergeNode in="g1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="spp-hub" gradientUnits="userSpaceOnUse" cx={C} cy={C} r={40}>
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.9} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
          </radialGradient>
        </defs>

        <RingGrid />

        {/* the "whole circle is the overall score" boundary */}
        <OverallRing overallScore={overallScore} />

        <g filter="url(#spp-bloom)">
          {categories.map((cat, i) => (
            <Wedge
              key={cat.id}
              cat={cat}
              idx={i}
              count={n}
              hovered={hover === i}
              onHover={() => setHover(i)}
            />
          ))}
        </g>

        {categories.map((cat, i) => (
          <SubtestLine key={`sub-${cat.id}`} cat={cat} idx={i} count={n} />
        ))}

        {categories.map((cat, i) => (
          <CategoryLabel key={`lbl-${cat.id}`} cat={cat} idx={i} count={n} active={hover === i} />
        ))}

        <CenterHub overallScore={overallScore} />
      </svg>

      {hover !== null && categories[hover] && (
        <div className="pointer-events-none absolute left-1/2 top-1 -translate-x-1/2 rounded-lg border border-border bg-popover px-3 py-2 text-center shadow-md">
          <div className="text-[12px] font-semibold text-foreground">{categories[hover].name}</div>
          <div className="mt-0.5 font-mono text-[11px] text-muted-foreground" data-numeric>
            score {Math.round(categories[hover].score)}
          </div>
          {categories[hover].subtests.length > 0 && (
            <div className="mt-1 flex flex-wrap justify-center gap-x-2 gap-y-0.5 text-[10px]">
              {categories[hover].subtests.map((s) => (
                <span key={s.id} className="font-mono text-muted-foreground" data-numeric>
                  {s.name.split(" ")[0]} {Math.round(s.score)}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RingGrid() {
  return (
    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, ease: "easeOut" }}>
      {/* emphasized 85-115 "average range" band */}
      <circle cx={C} cy={C} r={n2(radiusForScore(115, OUTER))} fill="var(--muted)" opacity={0.35} />
      <circle cx={C} cy={C} r={n2(radiusForScore(85, OUTER))} fill="var(--background)" />
      {RING_SCORES.map((s) => (
        <circle
          key={s}
          cx={C}
          cy={C}
          r={n2(Math.max(radiusForScore(s, OUTER), 0.5))}
          fill="none"
          stroke="var(--border)"
          strokeWidth={0.8}
          strokeDasharray="2 6"
        />
      ))}
      {RING_SCORES.filter((s) => s > SCORE_MIN).map((s) => (
        <text
          key={`t-${s}`}
          x={C + 4}
          y={n2(C - radiusForScore(s, OUTER)) - 3}
          className="font-mono"
          fontSize={8}
          fill="var(--muted-foreground)"
          stroke="var(--background)"
          strokeWidth={3}
          paintOrder="stroke"
          opacity={0.8}
        >
          {s}
        </text>
      ))}
    </motion.g>
  );
}

function OverallRing({ overallScore }: { overallScore: number }) {
  const r = radiusForScore(overallScore, OUTER);
  return (
    <motion.circle
      cx={C}
      cy={C}
      r={n2(r)}
      fill="none"
      stroke="var(--foreground)"
      strokeWidth={1.4}
      strokeDasharray="5 5"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 0.5, scale: 1 }}
      transition={{ delay: 0.5, duration: 0.5, ease: ENTER }}
      style={{ transformOrigin: `${C}px ${C}px` }}
    />
  );
}

function Wedge({
  cat,
  idx,
  count,
  hovered,
  onHover,
}: {
  cat: PremiumCategory;
  idx: number;
  count: number;
  hovered: boolean;
  onHover: () => void;
}) {
  const { start, end, mid } = categoryAngles(idx, count);
  const rTarget = radiusForScore(cat.score, OUTER);
  const color = wedgeColor(idx);

  const r = useMotionValue(0);
  useEffect(() => {
    const controls = animate(r, rTarget, { delay: 0.15 + idx * 0.08, duration: 0.7, ease: ENTER });
    return () => controls.stop();
  }, [r, rTarget, idx]);
  const d = useTransform(r, (rv) => wedgePath(rv, start, end, { pad: 0.014, corner: 3 }));

  const explode = hovered ? 8 : 0;
  const dx = Math.cos(mid) * explode;
  const dy = Math.sin(mid) * explode;

  return (
    <motion.g
      animate={{ x: dx, y: dy }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className="cursor-pointer"
      onMouseEnter={onHover}
    >
      <motion.path
        d={d}
        transform={`translate(${C} ${C})`}
        fill={`url(#spp-wg-${idx})`}
        stroke={color}
        strokeLinejoin="round"
        animate={{ strokeWidth: hovered ? 2 : 1.2, strokeOpacity: hovered ? 1 : 0.8 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
      />
    </motion.g>
  );
}

function SubtestLine({ cat, idx, count }: { cat: PremiumCategory; idx: number; count: number }) {
  const { start, end } = categoryAngles(idx, count);
  const color = wedgeColor(idx);
  const catR = radiusForScore(cat.score, OUTER);
  const subs = cat.subtests;

  // endpoints anchored on the category arc near the wedge edges (his 5-point rule)
  const pad = (end - start) * 0.13;
  const pStart = polarPoint(C, C, catR, start + pad);
  const pEnd = polarPoint(C, C, catR, end - pad);
  const subAngles = bandAngles(start, end, Math.max(subs.length, 1));
  const subPts = subs.map((s, i) => ({
    ...polarPoint(C, C, radiusForScore(s.score, OUTER), subAngles[i]),
    sub: s,
  }));

  const points = [pStart, ...subPts, pEnd].map((p) => `${n2(p.x)},${n2(p.y)}`).join(" ");
  const delay = 0.15 + idx * 0.08 + 0.55;

  return (
    <g>
      <motion.polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ delay, duration: 0.6, ease: "easeOut" }}
      />
      {subPts.map((p, i) => (
        <motion.circle
          key={p.sub.id}
          cx={n2(p.x)}
          cy={n2(p.y)}
          r={3.4}
          fill={color}
          stroke="var(--card)"
          strokeWidth={1.4}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: delay + 0.3 + i * 0.06, duration: 0.25, ease: ENTER }}
        />
      ))}
    </g>
  );
}

function CategoryLabel({
  cat,
  idx,
  count,
  active,
}: {
  cat: PremiumCategory;
  idx: number;
  count: number;
  active: boolean;
}) {
  const { mid } = categoryAngles(idx, count);
  const p = polarPoint(C, C, LABEL_R, mid);
  const hangs = Math.sin(mid) > 0.05;
  return (
    <motion.text
      x={n2(p.x)}
      y={n2(p.y)}
      textAnchor="middle"
      dominantBaseline={hangs ? "hanging" : "auto"}
      fontSize={11}
      fontWeight={active ? 700 : 600}
      fill={active ? "var(--foreground)" : "var(--muted-foreground)"}
      letterSpacing="0.02em"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 + idx * 0.08, duration: 0.4 }}
    >
      {cat.name}
    </motion.text>
  );
}

function CenterHub({ overallScore }: { overallScore: number }) {
  const [display, setDisplay] = useState(60);
  useEffect(() => {
    const c = animate(60, overallScore, {
      delay: 0.4,
      duration: 1,
      ease: ENTER,
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => c.stop();
  }, [overallScore]);

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.35, duration: 0.5, ease: ENTER }}
      style={{ transformOrigin: `${C}px ${C}px` }}
    >
      <circle cx={C} cy={C} r={38} fill="url(#spp-hub)" />
      <motion.circle
        cx={C}
        cy={C}
        r={30}
        fill="none"
        stroke="var(--primary)"
        strokeWidth={1}
        animate={{ opacity: [0.3, 0, 0.3], scale: [1, 1.45, 1] }}
        transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: `${C}px ${C}px` }}
      />
      <circle cx={C} cy={C} r={30} fill="var(--card)" stroke="var(--border)" strokeWidth={1} />
      <text
        x={C}
        y={C - 3}
        textAnchor="middle"
        dominantBaseline="central"
        className="font-mono"
        fontSize={19}
        fontWeight={600}
        fill="var(--foreground)"
      >
        {display}
      </text>
      <text
        x={C}
        y={C + 14}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={6.5}
        fontWeight={600}
        fill="var(--muted-foreground)"
        letterSpacing="0.14em"
      >
        OVERALL
      </text>
    </motion.g>
  );
}
