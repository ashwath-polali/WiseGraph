"use client";

import { useEffect, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useTransform,
} from "motion/react";
import {
  categoryAngles,
  polarPoint,
  radiusForScore,
  wedgePath,
  RING_SCORES,
  SCORE_MIN,
} from "@/components/charts/class/geometry";

const SIZE = 460;
const C = SIZE / 2;
const OUTER = 176;
const ENTER = [0.22, 1, 0.36, 1] as const;

// Decorative, believable class profile — 6 categories around the dial.
const CATS = [
  { abbrev: "R", score: 119, color: "var(--chart-1)" },
  { abbrev: "W", score: 103, color: "var(--chart-2)" },
  { abbrev: "V", score: 127, color: "var(--chart-3)" },
  { abbrev: "L", score: 111, color: "var(--chart-6)" },
  { abbrev: "O", score: 96, color: "var(--chart-5)" },
  { abbrev: "F", score: 122, color: "var(--chart-4)" },
];

const CLASS_AVG = Math.round(
  CATS.reduce((s, c) => s + c.score, 0) / CATS.length,
);

export function LandingRadialHero() {
  // Client-only: the dial's coordinates are trig floats that serialize a hair
  // differently on the server, so we mount after hydration. The fixed
  // aspect-square container holds the layout; the parent's fade-in hides the
  // one-frame delay.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="relative aspect-square w-full max-w-[460px]">
      {/* ambient breathing glow behind the dial */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 50%, color-mix(in oklch, var(--primary) 16%, transparent), transparent 70%)",
        }}
        initial={{ opacity: 0.55, scale: 0.96 }}
        animate={{ opacity: [0.55, 0.85, 0.55], scale: [0.96, 1.02, 0.96] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      {!mounted ? null : (
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="relative h-full w-full">
        <defs>
          {CATS.map((c, i) => (
            <radialGradient
              key={i}
              id={`lh-wg-${i}`}
              gradientUnits="userSpaceOnUse"
              cx={C}
              cy={C}
              r={OUTER}
            >
              <stop offset="0%" stopColor={c.color} stopOpacity={0.5} />
              <stop offset="60%" stopColor={c.color} stopOpacity={0.22} />
              <stop offset="100%" stopColor={c.color} stopOpacity={0.06} />
            </radialGradient>
          ))}
          {/* radar sweep gradient — bright leading edge fading to nothing */}
          <linearGradient id="lh-sweep" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.28} />
          </linearGradient>
          <filter id="lh-soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={3.5} />
          </filter>
        </defs>

        <g transform={`translate(${C} ${C})`}>
          <RingGrid />
          <RadarSweep />
          {CATS.map((cat, i) => (
            <Wedge key={cat.abbrev} cat={cat} idx={i} />
          ))}
          <CenterMedallion />
        </g>
      </svg>
      )}
    </div>
  );
}

function RingGrid() {
  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {RING_SCORES.map((score) => {
        const r = radiusForScore(score, OUTER);
        return (
          <circle
            key={score}
            r={Math.max(r, 0.5)}
            fill="none"
            stroke="var(--border)"
            strokeWidth={0.8}
            strokeDasharray="2 6"
          />
        );
      })}
    </motion.g>
  );
}

// A continuously rotating radar sweep — the "always analyzing" motion.
function RadarSweep() {
  const span = (52 * Math.PI) / 180;
  const d = wedgePath(OUTER, -Math.PI / 2 - span, -Math.PI / 2, {
    pad: 0,
    corner: 0,
  });
  return (
    <motion.g
      animate={{ rotate: 360 }}
      transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
      style={{ transformOrigin: "0px 0px" }}
    >
      <path d={d} fill="url(#lh-sweep)" opacity={0.9} />
      <line
        x1={0}
        y1={0}
        x2={0}
        y2={-OUTER}
        stroke="var(--primary)"
        strokeWidth={1.4}
        strokeLinecap="round"
        opacity={0.5}
      />
    </motion.g>
  );
}

function Wedge({
  cat,
  idx,
}: {
  cat: (typeof CATS)[number];
  idx: number;
}) {
  const { start, end, mid } = categoryAngles(idx, CATS.length);
  const baseR = radiusForScore(cat.score, OUTER);

  // grow on mount, then breathe forever
  const grow = useMotionValue(0);
  const breath = useMotionValue(1);
  useEffect(() => {
    const g = animate(grow, 1, {
      delay: 0.15 + idx * 0.08,
      duration: 0.75,
      ease: ENTER,
    });
    const b = animate(breath, [1, 1.035, 1], {
      delay: 0.9 + idx * 0.15,
      duration: 4.5,
      repeat: Infinity,
      ease: "easeInOut",
    });
    return () => {
      g.stop();
      b.stop();
    };
  }, [grow, breath, idx]);

  const d = useTransform([grow, breath], ([g, b]) =>
    wedgePath(baseR * (g as number) * (b as number), start, end),
  );

  const tip = polarPoint(0, 0, baseR, mid);
  const labelP = polarPoint(0, 0, OUTER + 22, mid);
  const hangs = Math.sin(mid) > 0.05;

  return (
    <g>
      <motion.path
        d={d}
        fill={`url(#lh-wg-${idx})`}
        stroke={cat.color}
        strokeWidth={1.1}
        strokeOpacity={0.7}
        strokeLinejoin="round"
      />

      {/* pulsing data point at the wedge tip */}
      <motion.circle
        cx={tip.x}
        cy={tip.y}
        r={3.2}
        fill={cat.color}
        stroke="var(--card)"
        strokeWidth={1.4}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: [1, 1.35, 1] }}
        transition={{
          opacity: { delay: 0.6 + idx * 0.08, duration: 0.3 },
          scale: {
            delay: 1 + idx * 0.2,
            duration: 2.4,
            repeat: Infinity,
            ease: "easeInOut",
          },
        }}
      />

      <motion.text
        x={labelP.x}
        y={labelP.y}
        textAnchor="middle"
        dominantBaseline={hangs ? "hanging" : "auto"}
        fontSize={12}
        fontWeight={600}
        fill="var(--muted-foreground)"
        letterSpacing="0.06em"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 + idx * 0.08, duration: 0.4 }}
      >
        {cat.abbrev}
      </motion.text>
    </g>
  );
}

function CenterMedallion() {
  const [display, setDisplay] = useState(SCORE_MIN);
  const mv = useMotionValue(SCORE_MIN);
  useEffect(() => {
    const controls = animate(mv, CLASS_AVG, {
      delay: 0.5,
      duration: 1.1,
      ease: ENTER,
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [mv]);

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.45, duration: 0.5, ease: ENTER }}
    >
      {/* soft pulsing halo */}
      <motion.circle
        r={34}
        fill="none"
        stroke="var(--primary)"
        strokeWidth={1}
        animate={{ opacity: [0.25, 0, 0.25], scale: [1, 1.5, 1] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "0px 0px" }}
      />
      <circle r={34} fill="var(--card)" stroke="var(--border)" strokeWidth={1} />
      <text
        textAnchor="middle"
        y={-3}
        dominantBaseline="central"
        className="font-mono"
        fontSize={20}
        fontWeight={600}
        fill="var(--foreground)"
      >
        {display}
      </text>
      <text
        textAnchor="middle"
        y={15}
        dominantBaseline="central"
        fontSize={7}
        fontWeight={600}
        fill="var(--muted-foreground)"
        letterSpacing="0.14em"
      >
        CLASS AVG
      </text>
    </motion.g>
  );
}
