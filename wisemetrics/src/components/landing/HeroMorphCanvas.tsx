"use client";

import { useEffect, useState } from "react";
import { line, area, curveMonotoneX } from "d3-shape";
import {
  type MotionValue,
  motion,
  useTransform,
} from "motion/react";
import {
  RING_SCORES,
  categoryAngles,
  normalPdf,
  polarPoint,
  radiusForScore,
} from "@/components/charts/class/geometry";

// ---- geometry -------------------------------------------------------------
const VW = 620;
const VH = 540;
const CX = 310;
const CY_R = 232; // radial center
const R = 156; // radial outer

const BX0 = 66; // bell x for score 60
const BX1 = 560; // bell x for score 150
const BY = 442; // bell baseline
const PEAK = 250; // bell height above baseline
const PDF_MAX = normalPdf(100, 100, 15);

// student overall, for the phase-3 marker
const STUDENT = 118;

// A believable 5-category class profile. chart-4 (terracotta) is reserved for
// the student, so categories cycle the other five hues.
const CATS = [
  { key: "R", label: "Reading", score: 119, color: "var(--chart-1)" },
  { key: "W", label: "Writing", score: 103, color: "var(--chart-2)" },
  { key: "V", label: "Vocabulary", score: 127, color: "var(--chart-3)" },
  { key: "L", label: "Listening", score: 110, color: "var(--chart-6)" },
  { key: "O", label: "Oral fluency", score: 96, color: "var(--chart-5)" },
];
const CLASS_AVG = Math.round(
  CATS.reduce((s, c) => s + c.score, 0) / CATS.length,
);

const n2 = (v: number) => Math.round(v * 100) / 100;
const xScale = (score: number) =>
  BX0 + ((score - 60) / 90) * (BX1 - BX0);
const bellY = (score: number) =>
  BY - (normalPdf(score, 100, 15) / PDF_MAX) * PEAK;

function radialPos(i: number, score: number) {
  const { mid } = categoryAngles(i, CATS.length);
  const p = polarPoint(CX, CY_R, radiusForScore(score, R), mid);
  return { x: n2(p.x), y: n2(p.y) };
}
function labelPos(i: number) {
  const { mid } = categoryAngles(i, CATS.length);
  const p = polarPoint(CX, CY_R, R + 24, mid);
  return { x: n2(p.x), y: n2(p.y), hang: Math.sin(mid) > 0.05 };
}

// bell curve + fill paths (static)
const BELL_SAMPLES = Array.from({ length: 91 }, (_, i) => 60 + i);
const bellLine =
  line<number>()
    .x((s) => xScale(s))
    .y((s) => bellY(s))
    .curve(curveMonotoneX)(BELL_SAMPLES) ?? "";
const bellArea =
  area<number>()
    .x((s) => xScale(s))
    .y0(BY)
    .y1((s) => bellY(s))
    .curve(curveMonotoneX)(BELL_SAMPLES) ?? "";

const smooth = (x: number) => x * x * (3 - 2 * x);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const morphAt = (p: number) => smooth(clamp01((p - 0.35) / 0.27));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ---------------------------------------------------------------------------
export function HeroMorphCanvas({
  progress,
}: {
  progress: MotionValue<number>;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // group opacities keyed to scroll progress
  const radialOpacity = useTransform(progress, [0.26, 0.44], [1, 0]);
  const bellOpacity = useTransform(progress, [0.4, 0.58], [0, 1]);
  const bellDraw = useTransform(progress, [0.42, 0.64], [0, 1]);
  const bandOpacity = useTransform(progress, [0.56, 0.72], [0, 0.6]);
  const studentOpacity = useTransform(progress, [0.68, 0.84], [0, 1]);
  const studentDraw = useTransform(progress, [0.7, 0.9], [0, 1]);

  return (
    <div className="relative aspect-[620/540] w-full max-w-[560px]">
      <svg viewBox={`0 0 ${VW} ${VH}`} className="h-full w-full overflow-visible">
        <defs>
          <linearGradient id="hm-bell" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.22} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
          </linearGradient>
        </defs>

        {mounted && (
          <>
            {/* -------- radial (fades out) -------- */}
            <motion.g style={{ opacity: radialOpacity }}>
              {RING_SCORES.map((s) => (
                <circle
                  key={s}
                  cx={CX}
                  cy={CY_R}
                  r={Math.max(radiusForScore(s, R), 0.5)}
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth={0.8}
                  strokeDasharray="2 6"
                />
              ))}
              {CATS.map((c, i) => {
                const { mid } = categoryAngles(i, CATS.length);
                const edge = polarPoint(CX, CY_R, R, mid);
                return (
                  <line
                    key={c.key}
                    x1={CX}
                    y1={CY_R}
                    x2={n2(edge.x)}
                    y2={n2(edge.y)}
                    stroke="var(--border)"
                    strokeWidth={0.8}
                  />
                );
              })}
              <polygon
                points={CATS.map((c, i) => {
                  const p = radialPos(i, c.score);
                  return `${p.x},${p.y}`;
                }).join(" ")}
                fill="var(--chart-1)"
                fillOpacity={0.1}
                stroke="var(--chart-1)"
                strokeWidth={1.5}
                strokeOpacity={0.5}
                strokeLinejoin="round"
              />
              {CATS.map((c, i) => {
                const lp = labelPos(i);
                return (
                  <text
                    key={c.key}
                    x={lp.x}
                    y={lp.y}
                    textAnchor="middle"
                    dominantBaseline={lp.hang ? "hanging" : "auto"}
                    fontSize={11}
                    fontWeight={600}
                    fill="var(--muted-foreground)"
                    letterSpacing="0.04em"
                  >
                    {c.label}
                  </text>
                );
              })}
              <g>
                <circle cx={CX} cy={CY_R} r={30} fill="var(--card)" stroke="var(--border)" />
                <text x={CX} y={CY_R - 3} textAnchor="middle" dominantBaseline="central" className="font-mono" fontSize={17} fontWeight={600} fill="var(--foreground)">
                  {CLASS_AVG}
                </text>
                <text x={CX} y={CY_R + 14} textAnchor="middle" dominantBaseline="central" fontSize={6.5} fontWeight={600} fill="var(--muted-foreground)" letterSpacing="0.12em">
                  CLASS AVG
                </text>
              </g>
            </motion.g>

            {/* -------- bell (fades / draws in) -------- */}
            <motion.g style={{ opacity: bellOpacity }}>
              {/* average range band */}
              <motion.rect
                x={n2(xScale(85))}
                y={BY - PEAK - 6}
                width={n2(xScale(115) - xScale(85))}
                height={PEAK + 6}
                fill="var(--muted)"
                style={{ opacity: bandOpacity }}
              />
              <path d={bellArea} fill="url(#hm-bell)" />
              <motion.path
                d={bellLine}
                fill="none"
                stroke="var(--chart-1)"
                strokeWidth={2.2}
                strokeLinecap="round"
                style={{ pathLength: bellDraw }}
              />
              {/* axis */}
              <line x1={BX0} y1={BY} x2={BX1} y2={BY} stroke="var(--border)" strokeWidth={1} />
              {[60, 75, 90, 105, 120, 135, 150].map((s) => (
                <text key={s} x={n2(xScale(s))} y={BY + 16} textAnchor="middle" className="font-mono" fontSize={9} fill="var(--muted-foreground)">
                  {s}
                </text>
              ))}
            </motion.g>

            {/* -------- category dots (persist, morph radial -> bell) -------- */}
            {CATS.map((c, i) => (
              <MorphDot
                key={c.key}
                rp={radialPos(i, c.score)}
                bp={{ x: n2(xScale(c.score)), y: n2(bellY(c.score)) }}
                color={c.color}
                progress={progress}
              />
            ))}

            {/* -------- student marker (phase 3) -------- */}
            <motion.g style={{ opacity: studentOpacity }}>
              <motion.line
                x1={n2(xScale(STUDENT))}
                y1={BY}
                x2={n2(xScale(STUDENT))}
                y2={n2(bellY(STUDENT))}
                stroke="var(--chart-4)"
                strokeWidth={2}
                strokeDasharray="3 3"
                style={{ pathLength: studentDraw }}
              />
              <circle cx={n2(xScale(STUDENT))} cy={n2(bellY(STUDENT))} r={6} fill="var(--chart-4)" stroke="var(--card)" strokeWidth={2} />
              <g transform={`translate(${n2(xScale(STUDENT))} ${n2(bellY(STUDENT)) - 26})`}>
                <rect x={-30} y={-13} width={60} height={20} rx={10} fill="var(--card)" stroke="var(--chart-4)" strokeWidth={1} />
                <text textAnchor="middle" dominantBaseline="central" className="font-mono" fontSize={9} fontWeight={600} fill="var(--foreground)">
                  Student {STUDENT}
                </text>
              </g>
            </motion.g>
          </>
        )}
      </svg>
    </div>
  );
}

function MorphDot({
  rp,
  bp,
  color,
  progress,
}: {
  rp: { x: number; y: number };
  bp: { x: number; y: number };
  color: string;
  progress: MotionValue<number>;
}) {
  const cx = useTransform(progress, (p) => n2(lerp(rp.x, bp.x, morphAt(p))));
  const cy = useTransform(progress, (p) => n2(lerp(rp.y, bp.y, morphAt(p))));
  return (
    <motion.circle
      cx={cx}
      cy={cy}
      r={5}
      fill={color}
      stroke="var(--card)"
      strokeWidth={1.6}
    />
  );
}
